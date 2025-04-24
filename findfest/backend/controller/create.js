const { database } = require("../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const sendEmail = require("../utils/email"); // Import your email utility

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      name,
      date,
      description,
      venue,
      categories,
      imageUrl,
      latitude,
      longitude
    } = req.body;

    // Get the authenticated user's UID
    const {
      createdBy
    } = req.body;

    if (!name || !date || !description || !categories || !imageUrl || !createdBy) {
      return res.status(400).json({ message: "Missing required fields (including createdBy)." });
    }

    const validDate = /^(\d{4})-(\d{2})-(\d{2})$/.test(date);
    if (!validDate) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    if ((latitude && isNaN(latitude)) || (longitude && isNaN(longitude))) {
      return res.status(400).json({ message: "Invalid coordinates." });
    }

    // 🔥 Correct Firestore Admin usage here
    const docRef = await database.collection("events").add({
      name,
      date: new Date(date),
      description,
      venue,
      categories,
      imageUrl,
      location: latitude && longitude ? { latitude, longitude } : null,
      createdBy: createdBy || null,
      createdAt: Timestamp.now(),
    });

    // Fetch follower UIDs from the 'followers' subcollection
    const followersSnap = await database.collection("users").doc(createdBy).collection("followers").get();
    const followerUIDs = followersSnap.docs.map(doc => doc.id);

    // Fetch creator's name for the email
    const creatorDoc = await database.collection("users").doc(createdBy).get();
    const creatorData = creatorDoc.data();
    const creatorName = creatorData && creatorData.name ? creatorData.name : "A user";

    // Gather all follower emails
    const followerEmails = [];
    for (let followerId of followerUIDs) {
      const followerRef = await database.collection("users").doc(followerId).get();
      const follower = followerRef.data();
      if (follower && follower.email) {
        followerEmails.push(follower.email);
      }
    }

    // Send a batch email notification to all followers
    if (followerEmails.length > 0) {
      const eventLink = `${process.env.VITE_API_URL}/event/${docRef.id}`;
      console.log("Calling sendEmail for new event notification. Recipients:", followerEmails);
      await sendEmail({
        to: followerEmails,
        subject: `New Event Created by ${creatorName}`,
        html: `
          <p>Hi,</p>
          <p>${creatorName} has just created a new event: <strong>${name}</strong>.</p>
          <p>Check it out here: <a href="${eventLink}">${eventLink}</a></p>
        `,
      });
    }

    res.status(200).json({ message: "Event created", id: docRef.id });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
