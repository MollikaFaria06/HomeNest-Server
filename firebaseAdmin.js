const admin = require("firebase-admin");
const serviceAccount = require("./homenest-firebase-adminsdk.json"); // path adjust

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
