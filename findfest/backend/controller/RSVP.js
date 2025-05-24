const admin = require("../firebaseAdmin");

const sendEmail = require("../utils/email");
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { generateTicketPDF } = require('../utils/pdfGenerator');
// use preconfigured Cloudinary instance
const cloudinary = require('../cloudinary');
const streamifier = require('streamifier');

// RSVP to Event (check and create with default status if it doesn't exist)
exports.rsvpToEvent = async (req, res) => {
  const { userId, event } = req.body;
  const db = admin.firestore();
  try {
    const ref = db.collection('rsvps').doc(`${userId}_${event.id}`);
    const snap = await ref.get();
    // fetch user
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    const email = userDoc.data().email;
    const userName = userDoc.data().name || '';
    // confirm or create RSVP
    if (!snap.exists) {
      await ref.set({ userId, eventId: event.id, eventName: event.name, status: true, timestamp: new Date(), updatedAt: new Date() });
      // update user category freq
      const eventDoc = await db.collection('events').doc(event.id).get();
      const categories = eventDoc.data()?.categories || [];
      const freq = userDoc.data().categoryFrequency || {};
      categories.forEach(cat => { freq[cat] = (freq[cat] || 0) + 1; });
      await userRef.update({ categoryFrequency: freq });
      await recalculateGlobalCategoryFrequency(db);
    } else if (snap.data().status === false) {
      await ref.update({ status: true, updatedAt: new Date() });
    } else {
      console.log(`RSVP already exists for user ${userId}, event ${event.id}`);
      return res.status(200).json({ message: 'RSVP already exists' });
    }
    // generate ticket
    const ticketId = uuidv4();
    const qrData = `ticket:${ticketId}`;
    const qrImage = await QRCode.toDataURL(qrData);
    await db.collection('tickets').doc(ticketId).set({ ticketId, eventId: event.id, userId, qrData, createdAt: Date.now() });
    // fetch official event name from Firestore to ensure it's defined
    const eventDoc = await db.collection('events').doc(event.id).get();
    // fetch DB event data for name and image
    const eventDataFromDb = eventDoc.exists ? eventDoc.data() : { name: event.name, imageUrl: '' };
    const officialEventName = eventDataFromDb.name;
    const photoUrl = eventDataFromDb.imageUrl;
    const pdfBuffer = await generateTicketPDF({
      ticketId,
      eventName: officialEventName,
      userName,
      qrImage,
      photoUrl
    });
    // upload PDF to Cloudinary with .pdf extension in public_id
    const uploadResult = await new Promise((resolve, reject) => {
      console.log('[Cloudinary] uploading PDF with .pdf in public_id');
      const cldStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'tickets', public_id: `ticket-${ticketId}.pdf` },
        (err, result) => err ? reject(err) : resolve(result)
      );
      streamifier.createReadStream(pdfBuffer).pipe(cldStream);
    });
    console.log('[Cloudinary] uploadResult:', uploadResult);
    // Use the Cloudinary base URL (no analytics params) for links
    const fileUrl = uploadResult.url; // example: https://res.cloudinary.com/.../ticket-xxx.pdf
    console.log('[Cloudinary] link URL:', fileUrl);
    await db.collection('tickets').doc(ticketId).update({ url: fileUrl });
    // send ticket email
    console.log('[RSVP] Sending ticket email to:', email);
    try {
      const emailOptions = {
        to: [email],
        subject: 'Your FindFest Ticket',
        html: `<p>Hi ${userName}, your ticket is attached.</p>`,
        attachments: [{ filename: `ticket-${ticketId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
      };
      console.log('[RSVP] Email options:', emailOptions);
      const emailResult = await sendEmail(emailOptions);
      console.log('[RSVP] Email sent result:', emailResult);
    } catch (emailErr) {
      console.error('[RSVP] Error sending ticket email:', emailErr);
    }
    console.log(`[Ticket] Generated ticket ${ticketId} for user ${userId}`);
    // respond with ticketId and Cloudinary URL
    return res.status(200).json({ message: 'RSVP confirmed and ticket generated', ticketId, url: fileUrl });
  } catch (err) {
    console.error('RSVP error:', err);
    return res.status(500).json({ error: 'Failed to RSVP' });
  }
};

// --- Helper: Recalculate global categoryFrequency ---
async function recalculateGlobalCategoryFrequency(db) {
  const usersSnapshot = await db.collection("users").get();
  const globalFreq = {};
  usersSnapshot.forEach(userDoc => {
    const freq = userDoc.data().categoryFrequency || {};
    for (const [cat, count] of Object.entries(freq)) {
      globalFreq[cat] = (globalFreq[cat] || 0) + count;
    }
  });
  await db.collection("meta").doc("categoryFrequency").set(globalFreq);
  console.log("[RSVP] Global categoryFrequency recalculated:", globalFreq);
}

// Cancel RSVP (delete RSVP document)
exports.cancelRSVP = async (req, res) => {
  const { userId, eventId } = req.body;

  try {
    const db = admin.firestore();
    const ref = db.collection("rsvps").doc(`${userId}_${eventId}`);
    await ref.delete();
    console.log(`[RSVP] User ${userId} cancelled RSVP for event ${eventId}`);

    // --- Update user categoryFrequency ---
    const eventDoc = await db.collection("events").doc(eventId).get();
    const categories = eventDoc.exists ? (eventDoc.data().categories || []) : [];
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const currentFreq = userDoc.exists && userDoc.data().categoryFrequency ? userDoc.data().categoryFrequency : {};
    for (const category of categories) {
      if (currentFreq[category]) {
        currentFreq[category] -= 1;
        if (currentFreq[category] <= 0) delete currentFreq[category];
      }
    }
    await userRef.update({ categoryFrequency: currentFreq });

    // --- Recalculate global categoryFrequency ---
    await recalculateGlobalCategoryFrequency(db);

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
