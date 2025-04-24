// utils/email.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: "FindFest <onboarding@resend.dev>", // Customize this to match your verified domain
      to,
      subject,
      html,
    });
    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
};

module.exports = sendEmail;
