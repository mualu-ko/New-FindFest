// utils/email.js
// load environment variables in this module
const dotenv = require('dotenv');
dotenv.config();

const { Resend } = require("resend");
// ensure API key presence
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set. Email sending will fail.');
}
const resend = new Resend(process.env.RESEND_API_KEY);
// debug: ensure API key is loaded
console.log('🔑 Resend API Key present:', Boolean(process.env.RESEND_API_KEY));

/**
 * Send an email using Resend
 * @param {Object} options - { to, subject, html, attachments }
 */
// `attachments` is an optional array of { filename, content: Buffer, contentType }
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    console.log('📧 sendEmail called with:', { to, subject, html, attachments });
    // prepare Resend attachments
    const resendAttachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content.toString('base64'), // must use `content` key for base64 data
      type: att.contentType,
    }));
    const result = await resend.emails.send({
      from: "FindFest <onboarding@resend.dev>", // Customize this to match your verified domain
      to,
      subject,
      html,
      attachments: resendAttachments,
    });
    console.log('📧 Resend response:', result);
    console.log("✅ Email sent to:", to);
    return result;
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
};

module.exports = sendEmail;
