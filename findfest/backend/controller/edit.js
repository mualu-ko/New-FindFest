const admin = require("firebase-admin");
const db = admin.firestore();
const sendEmailNotification = require("../utils/email"); // Import email utility

exports.editEvent = async (req, res) => {
  try {
    const { name, description, venue, date, latitude, longitude, imageUrl } = req.body;
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Event ID is required." });

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (venue) updateData.venue = venue;
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) {
        console.error("Invalid date provided:", date);
        return res.status(400).json({ message: "Invalid date format." });
      }
      updateData.date = parsedDate;
    }
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (latitude && longitude) {
      if (isNaN(latitude) || isNaN(longitude)) {
        console.error("Invalid coordinates provided:", latitude, longitude);
        return res.status(400).json({ message: "Invalid coordinates." });
      }
      updateData.location = { latitude, longitude };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    // Update the event in the database
    await db.collection("events").doc(id).update(updateData);

    // Retrieve all users who RSVP'd for this event
    const rsvpsSnap = await db.collection("rsvps").where("eventId", "==", id).where("status", "==", true).get();

    // Get email addresses of users who have RSVPed to the event
    const rsvpUsers = [];
    rsvpsSnap.forEach((doc) => {
      const rsvpData = doc.data();
      rsvpUsers.push(rsvpData.userId);
    });

    // Retrieve users' email addresses
    const userPromises = rsvpUsers.map((userId) => db.collection("users").doc(userId).get());
    const userSnapshots = await Promise.all(userPromises);

    const emailRecipients = userSnapshots.map((userDoc) => {
      const userData = userDoc.data();
      return userData.email;
    });

    // Send a batch email to all RSVPed users informing them of the event update
    const validEmails = emailRecipients.filter(email => !!email);
    if (validEmails.length > 0) {
    // Prepare event details for the email
    const eventDetails = {
      name: updateData.name || "No title",
      description: updateData.description || "No description",
      venue: updateData.venue || "No venue",
      date: updateData.date ? updateData.date.toLocaleDateString() : "No date",
    };

    // Use batch email sending via Resend (only this logic)
    if (validEmails.length > 0) {
      const eventLink = `${process.env.VITE_API_URL}/event/${id}`;
      await sendEmailNotification({
        to: validEmails,
        subject: `Event Updated: ${eventDetails.name}`,
        html: `
          <p>Hello! The event <strong>${eventDetails.name}</strong> has been updated. Here are the details:</p>
          <ul>
            <li><strong>Name:</strong> ${eventDetails.name}</li>
            <li><strong>Description:</strong> ${eventDetails.description || "No description"}</li>
            <li><strong>Venue:</strong> ${eventDetails.venue || "No venue"}</li>
            <li><strong>Date:</strong> ${eventDetails.date || "No date"}</li>
          </ul>
          <p>Stay tuned for more details!</p>
          <p>View the event: <a href="${eventLink}">${eventLink}</a></p>
        `,
      });
    }

    res.status(200).json({ message: "Event updated successfully and notifications sent to RSVPed users." });
  }} catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event.", error: error.message });
  }
};
