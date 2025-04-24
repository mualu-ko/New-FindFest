const admin = require("../firebaseAdmin");
const calculateDistanceAndWeight = require("../utils/distanceCalculator");
const { verifyToken } = require("../controller/profile");

const getNearbyEvents = async (req, res, next) => {
  verifyToken(req, res, async (err) => {
    if (err) return; // verifyToken already handled the response

    const uid = req.user.uid;
    console.log("getNearbyEvents called for UID:", uid);

    try {
    // Get user data including location
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data();
    console.log("Fetched userData:", userData);

    if (!userData.location || !userData.location.lat || !userData.location.lon) {
      return res.status(400).json({ message: "User location not set" });
    }

    const userLocation = userData.location;
    console.log("userLocation:", userLocation);

    // Get upcoming events (could add more filters later)
    const eventsSnapshot = await admin.firestore()
      .collection("events")
      // .where("date", ">=", new Date()) // Only future events
      .get();
    console.log("eventsSnapshot size:", eventsSnapshot.size);

    const nearbyEvents = [];

    eventsSnapshot.forEach((doc) => {
      const event = doc.data();
      console.log("Raw event data:", event);
      const eventLocation = event.location;
      let eventLat = null, eventLon = null;
      if (eventLocation) {
        eventLat = eventLocation.lat ?? eventLocation.latitude;
        eventLon = eventLocation.lon ?? eventLocation.longitude;
      }

      if (eventLat != null && eventLon != null) {
        const { distanceKm, weight } = calculateDistanceAndWeight(
          userLocation,
          { lat: eventLat, lon: eventLon }
        );
        console.log(`Event: ${event.name || doc.id}`);
        console.log("  Event Location:", eventLocation);
        console.log("  Distance to user (km):", distanceKm);
        console.log("  Weight:", weight);

        if (weight >= 0.8) {
          nearbyEvents.push({
            id: doc.id,
            ...event,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            distanceWeight: weight,
          });
        }
      }
    });

    console.log("Final nearbyEvents array:", nearbyEvents);
    res.status(200).json(nearbyEvents);
    } catch (err) {
      console.error("Error getting nearby events:", err);
      res.status(500).json({ message: "Failed to fetch nearby events" });
    }
  });
};

module.exports = { getNearbyEvents };
