const admin = require("../firebaseAdmin");
const sendEmail = require("../utils/email");

// RSVP to Event (check and create with default status if it doesn't exist)
exports.rsvpToEvent = async (req, res) => {
  const { userId, event } = req.body;

  try {
    const db = admin.firestore();
    const ref = db.collection("rsvps").doc(`${userId}_${event.id}`);
    const snap = await ref.get();

    if (!snap.exists) {
      // Create new RSVP
      await ref.set({
        userId,
        eventId: event.id,
        eventName: event.name,
        status: true, // Auto-confirmed
        timestamp: new Date(),
        updatedAt: new Date(),
      });

      // ✅ Get current confirmed RSVP count
      const rsvpSnap = await db
        .collection("rsvps")
        .where("eventId", "==", event.id)
        .where("status", "==", true)
        .get();

      const count = rsvpSnap.size;

      // ✅ If count is a multiple of 10, notify organizer
      if (count % 10 === 0 && event.organizerEmail) {
        await sendEmail({
          to: event.organizerEmail,
          subject: `🎉 ${count} People Have RSVPed to Your Event "${event.name}"!`,
          html: `<p>Your event <strong>${event.name}</strong> has reached <strong>${count}</strong> RSVPs! 🎉</p>`,
        });
      }

      return res.status(200).json({ message: "RSVP created and confirmed" });
    }

    res.status(200).json({ message: "RSVP already exists" });
  } catch (err) {
    console.error("RSVP error:", err);
    res.status(500).json({ error: "Failed to RSVP" });
  }
};

// Cancel RSVP (delete RSVP document)
exports.cancelRSVP = async (req, res) => {
  const { userId, eventId } = req.body;

  try {
    const db = admin.firestore();
    const ref = db.collection("rsvps").doc(`${userId}_${eventId}`);
    await ref.delete();
    res.status(200).json({ message: "RSVP cancelled" });
  } catch (err) {
    console.error("Cancel RSVP error:", err);
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
};

// Check RSVP Status (create default if doesn't exist)
exports.checkRSVP = async (req, res) => {
  const { userId, eventId } = req.query;

  try {
    const db = admin.firestore();
    const ref = db.collection("rsvps").doc(`${userId}_${eventId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        userId,
        eventId,
        status: false,
        timestamp: new Date(),
        updatedAt: new Date(),
      });
      return res.status(200).json({ isRSVPed: false });
    }

    res.status(200).json({ isRSVPed: snap.data().status });
  } catch (err) {
    console.error("Check RSVP error:", err);
    res.status(500).json({ error: "Failed to check RSVP status" });
  }
};

// Update RSVP Status
exports.updateRSVPStatus = async (req, res) => {
  const { userId, eventId, status } = req.body;

  try {
    const db = admin.firestore();
    const ref = db.collection("rsvps").doc(`${userId}_${eventId}`);

    await ref.set({
      status,
      updatedAt: new Date(),
    }, { merge: true });

    res.status(200).json({ message: `RSVP status updated to ${status}` });
  } catch (err) {
    console.error("Update RSVP status error:", err);
    res.status(500).json({ error: "Failed to update RSVP status" });
  }
};

// Get RSVP Count for Event
exports.getRSVPCount = async (req, res) => {
  const { eventId } = req.params;

  try {
    const db = admin.firestore();
    const snap = await db
      .collection("rsvps")
      .where("eventId", "==", eventId)
      .where("status", "==", true)
      .get();

    res.status(200).json({ count: snap.size });
  } catch (err) {
    console.error("Get RSVP count error:", err);
    res.status(500).json({ error: "Failed to count RSVPs" });
  }
};
