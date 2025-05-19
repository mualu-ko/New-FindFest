const dotenv = require('dotenv');
dotenv.config();  
const express = require("express");
const cors = require("cors");
const admin = require("./firebaseAdmin"); // Firebase Admin SDK setup
const cloudinaryRoutes = require("./routes/cloudinary"); // Cloudinary routes
const userRoutes = require("./routes/user"); // User routes
const followRoutes = require("./routes/follow"); // Follow routes
const eventRoutes = require("./routes/events"); // Event routes
const recommenderRoutes = require("./routes/recommender");
const adminRoutes = require("./routes/admin");
const organizerRoutes = require("./routes/organizer");
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Register routes
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/user", userRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/recommendations", recommenderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer", organizerRoutes);

// Firebase Auth Route
app.post("/auth", async (req, res) => {
  const { token, name } = req.body;

  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    // If user doesn't exist in Firestore, create new user
    if (!userDoc.exists) {
      await userRef.set({
        uid,
        name: name || decodedToken.name || "Anonymous",
        email: decodedToken.email,
        profilePic: decodedToken.picture || "",
        joinedAt: new Date().toISOString(),
        isAdmin: false // Add isAdmin by default
      });
    }

    // Fetch the user data
    const userData = (await userRef.get()).data();
    res.status(200).json(userData);
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
