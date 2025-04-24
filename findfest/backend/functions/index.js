/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
import * as functions from "firebase-functions";
import Resend from "resend";

const resend = new Resend(functions.config().resend.api_key);


// Cloud function to send email notifications
export const sendNotificationEmail = functions.https.onCall(async (data) => {
  const { toEmail, subject, message } = data;

  if (!toEmail || !subject || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required parameters");
  }

  try {
    const emailResponse = await resend.sendEmail({
      to: toEmail,
      from: "kmwaluko.wambua@students.uonbi.ac.ke",  // Use a valid and verified email
      subject: subject,
      html: message,  // HTML body of the email
    });

    console.log("Email sent successfully:", emailResponse);
    return { status: "success", response: emailResponse };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", "Email sending failed");
  }
});
