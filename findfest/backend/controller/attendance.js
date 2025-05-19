const admin = require("../firebaseAdmin");

// Get all RSVPed users for an event, with their attendance status
exports.getAttendanceList = async (req, res) => {
  const { eventId } = req.params;
  try {
    const db = admin.firestore();
    const rsvpsSnap = await db
      .collection("rsvps")
      .where("eventId", "==", eventId)
      .where("status", "==", true)
      .get();

    const users = [];
    for (const doc of rsvpsSnap.docs) {
      const data = doc.data();
      const userDoc = await db.collection("users").doc(data.userId).get();
      users.push({
        userId: data.userId,
        attended: !!data.attended,
        name: userDoc.exists ? userDoc.data().name : "",
        email: userDoc.exists ? userDoc.data().email : "",
      });
    }
    res.json(users);
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch attendance list" });
  }
};

// Update attendance for multiple users
exports.setAttendance = async (req, res) => {
  const { eventId } = req.params;
  const { attendance } = req.body; // [{ userId, attended }]
  if (!Array.isArray(attendance)) {
    return res.status(400).json({ error: "Attendance must be an array" });
  }
  try {
    const db = admin.firestore();
    const batch = db.batch();
    attendance.forEach(({ userId, attended }) => {
      const ref = db.collection("rsvps").doc(`${userId}_${eventId}`);
      batch.update(ref, { attended: !!attended });
    });
    await batch.commit();
    res.json({ message: "Attendance updated" });
  } catch (err) {
    console.error("Attendance update error:", err);
    res.status(500).json({ error: "Failed to update attendance" });
  }
};
