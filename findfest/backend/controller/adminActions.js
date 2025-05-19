const admin = require("../firebaseAdmin");
const sendEmail = require("../utils/email");
const { notifyUserOnBan } = require("./notification.js");

// Delete any event (admin only)
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  try {
    // Get all RSVPs for this event
    const rsvpSnapshot = await admin.firestore().collection("rsvps").where("eventId", "==", eventId).get();
    const rsvpUserEmails = [];
    for (const rsvpDoc of rsvpSnapshot.docs) {
      const rsvpData = rsvpDoc.data();
      // Delete RSVP
      await rsvpDoc.ref.delete();
      // Get user email for notification
      if (rsvpData.userId) {
        const rsvpUserDoc = await admin.firestore().collection("users").doc(rsvpData.userId).get();
        if (rsvpUserDoc.exists && rsvpUserDoc.data().email) {
          rsvpUserEmails.push(rsvpUserDoc.data().email);
        } else {
          console.warn(`RSVP user ${rsvpData.userId} not found or missing email for event ${eventId}`);
        }
      }
    }
    // Send notification to all RSVPed users
    if (rsvpUserEmails.length > 0) {
      for (const email of rsvpUserEmails) {
        if (email) {
          try {
            await sendEmail({
              to: email,
              subject: "Event Cancelled",
              html: `<p>An event you RSVPed to has been cancelled by an admin.</p>`
            });
          } catch (emailErr) {
            console.error(`Failed to send cancellation email to ${email}:`, emailErr);
          }
        }
      }
    }
    await admin.firestore().collection("events").doc(eventId).delete();
    res.status(200).json({ message: `Event ${eventId} deleted and RSVPed users notified.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete event and notify RSVPed users", error: err.message });
  }
};

// Ban a user (admin only)
exports.banUser = async (req, res) => {
  console.log("[banUser] called", { params: req.params, body: req.body });
  const { uid } = req.params;
  const { reason } = req.body;
  const currentUid = req.user.uid;
  if (uid === currentUid) {
    return res.status(400).json({ message: "You cannot ban yourself." });
  }
  if (!reason || reason.trim() === "") {
    return res.status(400).json({ message: "Ban reason is required." });
  }
  try {
    await admin.firestore().collection("users").doc(uid).update({ banned: true, banReason: reason });
    // Fetch user email
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (userData && userData.email) {
      // Send ban notification using notification service
      if (typeof notifyUserOnBan === "function") {
        await notifyUserOnBan({ userEmail: userData.email, reason });
      } else {
        // fallback to direct email
        await sendEmail({
          to: userData.email,
          subject: "Your FindFest account has been banned",
          html: `<p>Your account has been banned for the following reason:</p><p><strong>${reason}</strong></p>`
        });
      }
    }

    // Delete all events created by this user
    const eventsSnapshot = await admin.firestore().collection("events").where("createdBy", "==", uid).get();
    const batch = admin.firestore().batch();
    const deletedEventIds = [];
    for (const doc of eventsSnapshot.docs) {
      batch.delete(doc.ref);
      deletedEventIds.push(doc.id);
    }
    await batch.commit();

    // For each deleted event, delete RSVPs and notify RSVPed users
    for (const eventId of deletedEventIds) {
      // Get all RSVPs for this event
      const rsvpSnapshot = await admin.firestore().collection("rsvps").where("eventId", "==", eventId).get();
      const rsvpUserEmails = [];
      for (const rsvpDoc of rsvpSnapshot.docs) {
        const rsvpData = rsvpDoc.data();
        // Delete RSVP
        await rsvpDoc.ref.delete();
        // Get user email for notification
        if (rsvpData.userId) {
          const rsvpUserDoc = await admin.firestore().collection("users").doc(rsvpData.userId).get();
          if (rsvpUserDoc.exists && rsvpUserDoc.data().email) {
            rsvpUserEmails.push(rsvpUserDoc.data().email);
          } else {
            console.warn(`RSVP user ${rsvpData.userId} not found or missing email for event ${eventId}`);
          }
        }
      }
      // Send notification to all RSVPed users
      if (rsvpUserEmails.length > 0) {
        for (const email of rsvpUserEmails) {
          if (email) {
            try {
              await sendEmail({
                to: email,
                subject: "Event Cancelled",
                html: `<p>An event you RSVPed to has been cancelled because the organizer was banned.</p>`
              });
            } catch (emailErr) {
              console.error(`Failed to send cancellation email to ${email}:`, emailErr);
            }
          }
        }
      }
    }
    const response = { message: `User ${uid} banned, their events deleted, and RSVPed users notified.` };
    console.log("[banUser] completed successfully", response);
    res.status(200).json(response);
  } catch (err) {
    console.error("[banUser] error:", err);
    res.status(500).json({ message: "Failed to ban user and clean up events", error: err.message });
  }
};

// Demote a user from admin (admin only)
exports.demoteFromAdmin = async (req, res) => {
  const { uid } = req.body;
  const currentUid = req.user.uid;
  if (uid === currentUid) {
    return res.status(400).json({ message: "You cannot demote yourself." });
  }
  try {
    await admin.firestore().collection("users").doc(uid).update({ isAdmin: false });
    res.status(200).json({ message: `User ${uid} demoted from admin.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to demote user", error: err.message });
  }
};

// Fetch all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("users").get();
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};
