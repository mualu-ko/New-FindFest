const admin = require("../firebaseAdmin");

// POST /api/events/:eventId/rate
// Body: { rating } (1-5)
// Auth: user must be authenticated
exports.rateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { rating } = req.body;
  const userId = req.user.uid;
  if (!eventId || !userId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid event, user, or rating value." });
  }
  try {
    const db = admin.firestore();
    const ratingRef = db.collection("ratings").doc(`${eventId}_${userId}`);
    await ratingRef.set({ eventId, userId, rating, timestamp: new Date() });
    res.json({ message: "Rating submitted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit rating." });
  }
};

// GET /api/events/:eventId/ratings
// Returns: { average, count, ratings: [optional] }
exports.getEventRatings = async (req, res) => {
  const { eventId } = req.params;
  let userId = null;
  if (req.user && req.user.uid) userId = req.user.uid;
  try {
    const db = admin.firestore();
    const snap = await db.collection("ratings").where("eventId", "==", eventId).get();
    let sum = 0;
    let count = 0;
    let myRating = null;
    snap.forEach(doc => {
      const data = doc.data();
      sum += data.rating;
      count++;
      if (userId && data.userId === userId) {
        myRating = data.rating;
      }
    });
    res.json({ average: count ? sum / count : 0, count, myRating });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event ratings." });
  }
};

// GET /api/organizers/:organizerId/ratings
// Returns: { average, count }
exports.getOrganizerRatings = async (req, res) => {
  const { organizerId } = req.params;
  try {
    const db = admin.firestore();
    // Find all events by this organizer
    const eventsSnap = await db.collection("events").where("organizerId", "==", organizerId).get();
    const eventIds = eventsSnap.docs.map(doc => doc.id);
    if (eventIds.length === 0) return res.json({ average: 0, count: 0 });
    // Get all ratings for these events
    const ratingsSnap = await db.collection("ratings").where("eventId", "in", eventIds.slice(0, 10)).get(); // Firestore 'in' supports max 10
    let sum = 0;
    let count = 0;
    ratingsSnap.forEach(doc => {
      sum += doc.data().rating;
      count++;
    });
    res.json({ average: count ? sum / count : 0, count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organizer ratings." });
  }
};
