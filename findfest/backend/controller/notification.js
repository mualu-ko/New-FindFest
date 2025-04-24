import { sendEmail } from '../utils/email.js';

// 1. RSVP Threshold
export const notifyOrganizerOnRSVP = async ({ organizerEmail, eventName, rsvpCount }) => {
  if (rsvpCount % 10 === 0) {
    const subject = `🎉 Your event "${eventName}" just hit ${rsvpCount} RSVPs!`;
    const html = `<p>Congrats! Your event <strong>${eventName}</strong> has reached <strong>${rsvpCount}</strong> RSVPs.</p>`;
    await sendEmail({ to: organizerEmail, subject, html });
  }
};

// 2. Event Updated
export const notifyRSVPUsersOnEventUpdate = async ({ userEmails, eventName }) => {
  const subject = `🔔 Update: "${eventName}" has been changed`;
  const html = `<p>The event <strong>${eventName}</strong> you RSVPed to has been updated. Check the latest details in the app!</p>`;
  
  for (const email of userEmails) {
    await sendEmail({ to: email, subject, html });
  }
};

// 3. New Event by Followed User
export const notifyFollowersOnNewEvent = async ({ followerEmails, organizerName, eventName }) => {
  const subject = `✨ ${organizerName} just posted a new event: "${eventName}"`;
  const html = `<p>${organizerName} has a new event: <strong>${eventName}</strong>. Don't miss out!</p>`;
  
  for (const email of followerEmails) {
    await sendEmail({ to: email, subject, html });
  }
};

// 4. New Follower
export const notifyUserOnNewFollower = async ({ userEmail, followerName }) => {
  const subject = `👥 You have a new follower: ${followerName}`;
  const html = `<p><strong>${followerName}</strong> just followed you. Keep engaging and share more events!</p>`;
  await sendEmail({ to: userEmail, subject, html });
};
