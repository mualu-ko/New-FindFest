const admin = require("../firebaseAdmin");
const sendEmail = require("../utils/email");

// POST /api/events/:eventId/send-email
// Body: { subject, message, toRSVPd, toAttended }
exports.sendEventEmail = async (req, res) => {
  const { eventId } = req.params;
  const { subject, message, toRSVPd, toAttended } = req.body;
  if (!subject || !message || (!toRSVPd && !toAttended)) {
    return res.status(400).json({ error: "Missing subject, message, or recipient selection." });
  }
  try {
    const db = admin.firestore();
    // Get all RSVPs for this event
    const rsvpsSnap = await db
      .collection("rsvps")
      .where("eventId", "==", eventId)
      .where("status", "==", true)
      .get();
    const emails = new Set();
    for (const doc of rsvpsSnap.docs) {
      const data = doc.data();
      if (toRSVPd) {
        // Get user email
        const userDoc = await db.collection("users").doc(data.userId).get();
        if (userDoc.exists && userDoc.data().email) {
          emails.add(userDoc.data().email);
        }
      }
      if (toAttended && data.attended) {
        // Get user email
        const userDoc = await db.collection("users").doc(data.userId).get();
        if (userDoc.exists && userDoc.data().email) {
          emails.add(userDoc.data().email);
        }
      }
    }
    if (emails.size === 0) {
      return res.status(400).json({ error: "No recipients found." });
    }
    // Send email
    await sendEmail({
      to: Array.from(emails),
      subject,
      html: `<div>${message.replace(/\n/g, '<br/>')}</div>`
    });
    res.json({ message: `Email sent to ${emails.size} recipient(s).` });
  } catch (err) {
    console.error("Event email send error:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
};
