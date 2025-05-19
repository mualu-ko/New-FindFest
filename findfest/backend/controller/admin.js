const admin = require("../firebaseAdmin");

// Promote a user to admin (set isAdmin: true)
exports.promoteToAdmin = async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ message: "Missing uid" });

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    await userRef.update({ isAdmin: true });
    res.status(200).json({ message: `User ${uid} promoted to admin.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to promote user", error: err.message });
  }
};

// Middleware to check if the user is admin
exports.requireAdmin = async (req, res, next) => {
  const uid = req.user.uid;
  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Failed to verify admin", error: err.message });
  }
};
