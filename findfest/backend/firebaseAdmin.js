const admin = require('firebase-admin');
const serviceAccount = require('./findfest-305ea-firebase-adminsdk-bim0g-8d8fb1b572.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://findfest-305ea.firebaseio.com',
  });
}

module.exports = admin;
