const sendEmail = require('../utils/email');

// 1. RSVP Threshold
const notifyOrganizerOnRSVP = async ({ organizerEmail, eventName, rsvpCount }) => {
  if (rsvpCount % 10 === 0) {
    const subject = `🎉 Your event "${eventName}" just hit ${rsvpCount} RSVPs!`;
    const html = `<p>Congrats! Your event <strong>${eventName}</strong> has reached <strong>${rsvpCount}</strong> RSVPs.</p>`;
    await sendEmail({ to: organizerEmail, subject, html });
    console.log(`[Notification] Email sent to ${organizerEmail} | Subject: ${subject}`);
  }
};

// 2. Event Updated
const notifyRSVPUsersOnEventUpdate = async ({ userEmails, eventName }) => {
  const subject = `🔔 Update: "${eventName}" has been changed`;
  const html = `<p>The event <strong>${eventName}</strong> you RSVPed to has been updated. Check the latest details in the app!</p>`;
  
  for (const email of userEmails) {
    await sendEmail({ to: email, subject, html });
    console.log(`[Notification] Email sent to ${email} | Subject: ${subject}`);
  }
};

// 3. New Event by Followed User
const notifyFollowersOnNewEvent = async ({ followerEmails, organizerName, eventName }) => {
  const subject = `✨ ${organizerName} just posted a new event: "${eventName}"`;
  const html = `<p>${organizerName} has a new event: <strong>${eventName}</strong>. Don't miss out!</p>`;
  
  for (const email of followerEmails) {
    await sendEmail({ to: email, subject, html });
    console.log(`[Notification] Email sent to ${email} | Subject: ${subject}`);
  }
};

// 4. New Follower
const notifyUserOnNewFollower = async ({ userEmail, followerName }) => {
  const subject = `👥 You have a new follower: ${followerName}`;
  const html = `<p><strong>${followerName}</strong> just followed you. Keep engaging and share more events!</p>`;
  await sendEmail({ to: userEmail, subject, html });
  console.log(`[Notification] Email sent to ${userEmail} | Subject: ${subject}`);
};

module.exports = {
  notifyOrganizerOnRSVP,
  notifyRSVPUsersOnEventUpdate,
  notifyFollowersOnNewEvent,
  notifyUserOnNewFollower,
  notifyUserOnBan: async ({ userEmail, reason }) => {
    const subject = "Your FindFest account has been banned";
    const html = `<p>Your account has been banned for the following reason:</p><p><strong>${reason}</strong></p>`;
    await sendEmail({ to: userEmail, subject, html });
    console.log(`[Notification] Email sent to ${userEmail} | Subject: ${subject}`);
  }
};
