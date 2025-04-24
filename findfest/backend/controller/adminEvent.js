// controllers/eventsController.js
const admin = require("firebase-admin");
const db = admin.firestore();

// Get all events created by a user
exports.getUserCreatedEvents = async (req, res) => {
  const { userId } = req.params;

  try {
    const snapshot = await db
      .collection("events")
      .where("createdBy", "==", userId)
      .get();

    // Fetch creator's name for each event
    const events = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      let creatorName = data.createdBy;
      if (data.createdBy) {
        const userDoc = await db.collection("users").doc(data.createdBy).get();
        if (userDoc.exists) {
          creatorName = userDoc.data().name || data.createdBy;
        }
      }
      return {
        id: doc.id,
        ...data,
        creatorName,
      };
    }));

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching user-created events:", error);
    res.status(500).json({ message: "Failed to fetch events." });
  }
};

// Get RSVP analytics for an event
exports.getEventAnalytics = async (req, res) => {
  const { eventId } = req.params;

  try {
    const snapshot = await db
      .collection("rsvps")
      .where("eventId", "==", eventId)
      .get();

    const count = snapshot.size;

    res.status(200).json({ rsvpCount: count });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics." });
  }
};

// AdminView routes for events created and RSVPed
exports.getCreatedEvents = async (req, res) => {
  // Reuse the logic from getUserCreatedEvents
  return exports.getUserCreatedEvents(req, res);
};

exports.getRSVPedEvents = async (req, res) => {
  const { userId } = req.params;
  try {
    // Find all rsvps by user
    const rsvpSnapshot = await db
      .collection("rsvps")
      .where("userId", "==", userId)
      .get();
    const eventIds = rsvpSnapshot.docs.map(doc => doc.data().eventId);
    if (eventIds.length === 0) {
      return res.status(200).json([]);
    }
    // Fetch events by IDs
    const eventsSnapshot = await db
      .collection("events")
      .where(admin.firestore.FieldPath.documentId(), "in", eventIds)
      .get();
    // Fetch creator's name for each event
    const events = await Promise.all(eventsSnapshot.docs.map(async doc => {
      const data = doc.data();
      let creatorName = data.createdBy;
      if (data.createdBy) {
        const userDoc = await db.collection("users").doc(data.createdBy).get();
        if (userDoc.exists) {
          creatorName = userDoc.data().name || data.createdBy;
        }
      }
      return {
        id: doc.id,
        ...data,
        creatorName,
      };
    }));
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching RSVPed events:", error);
    res.status(500).json({ message: "Failed to fetch RSVPed events." });
  }
};
