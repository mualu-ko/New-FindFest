const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../findfest-305ea-firebase-adminsdk-bim0g-8d8fb1b572.json");

const app = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApp();

const database = getFirestore(app);

module.exports = { database };
