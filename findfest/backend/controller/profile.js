const admin = require("../firebaseAdmin");

// 🔐 Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

// 🚀 Get user profile (no need for query string anymore)
const getUserProfile = async (req, res) => {
  const uid = req.user.uid;

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(userDoc.data());
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Error fetching user profile", error: err.message });
  }
};

// 🛠 Update user profile, including name, profile picture, and location
const updateUserProfile = async (req, res) => {
  const uid = req.user.uid;
  const { name, profilePic, location, emailPublic } = req.body;

  console.log("Received data:", req.body);
  console.log("Raw location:", location);

  // Prepare location data if provided
  let locationData = null;
  if (location?.latitude && location?.longitude) {
    locationData = {
      lat: location.latitude,
      lon: location.longitude,
      venue: location.venue || "Unknown",
    };
  }

  console.log("Location data:", locationData);

  try {
    const userRef = admin.firestore().collection("users").doc(uid);

    const updateData = {};

    if (name) updateData.name = name;
    if (profilePic) updateData.profilePic = profilePic;
    if (locationData) updateData.location = locationData;
    if (typeof emailPublic !== 'undefined') updateData.emailPublic = emailPublic;

    console.log("Data to be saved:", updateData);

    await userRef.update(updateData);

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Error updating user profile", error: err.message });
  }
};

// 🚀 Get user by UID (public profile)
const getUserById = async (req, res) => {
  const { uid } = req.params;

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ uid, ...userDoc.data() });
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Error fetching user by ID", error: err.message });
  }
};

// 🛠 Endpoint to update user location (moved to updateUserProfile)
const updateUserLocation = async (req, res) => {
  const uid = req.user.uid;
  const { latitude, longitude, venue } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  const location = {
    lat: latitude,
    lon: longitude,
    venue: venue || "Unknown",
  };

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    await userRef.update({
      location: location,
    });

    res.status(200).json({ message: "Location updated successfully" });
  } catch (err) {
    console.error("Error updating user location:", err);
    res.status(500).json({ message: "Error updating user location", error: err.message });
  }
};

module.exports = {
  verifyToken,
  getUserProfile,
  updateUserProfile,
  getUserById,
  updateUserLocation, // This is now optional
};
