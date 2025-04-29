const admin = require("firebase-admin");

// GET /api/events/:id
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Requested event ID:`, id);
    const eventSnap = await admin.firestore().collection("events").doc(id).get();
    console.log(`[DEBUG] Firestore eventSnap.exists:`, eventSnap.exists);
    if (!eventSnap.exists) {
      console.log(`[DEBUG] Event not found for ID:`, id);
      return res.status(404).json({ error: "Event not found" });
    }
    const event = { id: eventSnap.id, ...eventSnap.data() };
    console.log(`[DEBUG] Event data fetched:`, event);
    res.json(event);
  } catch (err) {
    console.error("Error fetching event by ID:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
};
