const admin = require("../firebaseAdmin");
const calculateDistanceAndWeight = require("../utils/distanceCalculator");

// Utility: Compute cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

// Main recommendation endpoint
exports.getRecommendations = async (req, res) => {
  let { userId, location } = req.body; // or req.query for GET

  try {
    // If location is not provided, try to fetch from user profile
    if ((!location || !location.lat || !location.lon) && userId) {
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      if (userDoc.exists && userDoc.data().location && userDoc.data().location.lat && userDoc.data().location.lon) {
        location = userDoc.data().location;
        console.log("[RECOMMENDER] Using user profile location:", location);
      } else {
        console.log("[RECOMMENDER] No location found for user, distanceWeight will be 0.");
      }
    }
    const db = admin.firestore();

    // 1. Get user and followed users' categoryFrequency
    let userVector = null;
    let followedVectors = [];
    let following = [];
    if (userId) {
      const userDoc = await db.collection("users").doc(userId).get();
      userVector = userDoc.exists ? userDoc.data().categoryFrequency || {} : {};
      // Fetch following user IDs from the 'following' subcollection
      following = [];
      if (userDoc.exists) {
        const followingSnap = await db.collection("users").doc(userId).collection("following").get();
        following = followingSnap.docs.map(doc => doc.id);
      }
      for (const followId of following) {
        const followDoc = await db.collection("users").doc(followId).get();
        if (followDoc.exists) {
          followedVectors.push(followDoc.data().categoryFrequency || {});
        }
      }
    }

    // 2. If no userVector, use global fallback
    let globalDoc = await db.collection("meta").doc("categoryFrequency").get();
    const globalVector = globalDoc.exists ? globalDoc.data() : {};

    // 3. Build the master category list
    const allCategories = Array.from(
      new Set([
        ...Object.keys(userVector || {}),
        ...followedVectors.flatMap(v => Object.keys(v)),
        ...Object.keys(globalVector)
      ])
    );

    // 4. Convert frequency maps to aligned vectors
    function mapToVector(map) {
      return allCategories.map(cat => map[cat] || 0);
    }
    const userVecArr = mapToVector(userVector || {});
    const followedVecArr = followedVectors.length
      ? mapToVector(
          followedVectors.reduce((acc, v) => {
            for (const cat of allCategories) acc[cat] = (acc[cat] || 0) + (v[cat] || 0);
            return acc;
          }, {})
        )
      : allCategories.map(() => 0);
    const globalVecArr = mapToVector(globalVector);

    // DEBUG LOGGING
    console.log("[RECOMMENDER DEBUG]");
    console.log("userId:", userId);
    console.log("userVector:", userVector);
    console.log("userVecArr:", userVecArr);
    console.log("following:", following);
    console.log("followedVectors:", followedVectors);
    console.log("followedVecArr:", followedVecArr);
    console.log("globalVector:", globalVector);
    console.log("globalVecArr:", globalVecArr);
    console.log("allCategories:", allCategories);
    let combinedVec;
    if (userId && userVecArr.some(v => v > 0)) {
      // Weighted: 0.7 user, 0.3 follows
      combinedVec = userVecArr.map((v, i) => 0.7 * v + 0.3 * followedVecArr[i]);
      console.log("Using weighted user+followed vector (0.7/0.3)");
    } else {
      // Fallback: global
      combinedVec = globalVecArr;
      console.log("Using global fallback vector");
    }
    console.log("combinedVec:", combinedVec);

    // 6. Fetch all events (filter as needed)
    const eventsSnap = await db.collection("events").get();
    const events = [];
    eventsSnap.forEach(doc => {
      const data = doc.data();
      events.push({ id: doc.id, ...data });
    });


    // 7. Score each event
    // Scoring weights
    const α = 0.6, β = 0.2, γ1 = 0.1, γ2 = 0.1;

    // --- Get top categories for followed users for social boost ---
    let followedTopCategories = new Set();
    if (followedVectors.length > 0) {
      for (const vec of followedVectors) {
        // Get top category (or categories if tied)
        let max = 0;
        for (const val of Object.values(vec)) {
          if (val > max) max = val;
        }
        for (const [cat, val] of Object.entries(vec)) {
          if (val === max && max > 0) followedTopCategories.add(cat);
        }
      }
    }

    const recommendations = events.map(event => {
      // 1. Event vector (binary)
      const eventVec = allCategories.map(cat => (event.categories || []).includes(cat) ? 1 : 0);
      // 2. Cosine similarity
      const cosineSim = cosineSimilarity(combinedVec, eventVec);

      // 3. Distance weight
      let distanceWeight = 0;
      // Support both lat/lon and latitude/longitude in event.location
      const eventLat = event.location.lat !== undefined ? event.location.lat : event.location.latitude;
      const eventLon = event.location.lon !== undefined ? event.location.lon : event.location.longitude;
      // Only calculate distanceWeight if user location is present
      if (location && location.lat !== undefined && location.lon !== undefined && event.location && eventLat !== undefined && eventLon !== undefined) {
        const { weight } = calculateDistanceAndWeight(
          { lat: location.lat, lon: location.lon },
          { lat: eventLat, lon: eventLon }
        );
        distanceWeight = weight;
      } else {
        // Explicitly set to 0 if no user location
        distanceWeight = 0;
      }

      // 4. Social boosts
      let creatorBoost = 0;
      if (following.includes(event.createdBy)) creatorBoost = 1;
      let topCatBoost = 0;
      if ((event.categories || []).some(cat => followedTopCategories.has(cat))) topCatBoost = 1;

      // 5. Final score
      const score = α * cosineSim + β * distanceWeight + γ1 * topCatBoost + γ2 * creatorBoost;
      return { ...event, score, cosineSim, distanceWeight, topCatBoost, creatorBoost, followedTopCategories: Array.from(followedTopCategories), categories: event.categories };
    });

    // 8. Sort and return
    recommendations.sort((a, b) => b.score - a.score);
    res.json({ recommendations });

  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
};