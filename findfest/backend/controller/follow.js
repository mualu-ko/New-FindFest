const admin = require("../firebaseAdmin");
const sendEmail = require("../utils/email");

// Follow User
const followUser = async (req, res) => {
  // Try to get from params first (since route uses /follow/:currentUid/:targetUid)
  const currentUserId = req.params.currentUid || req.body.currentUserId;
  const targetUserId = req.params.targetUid || req.body.targetUserId;

  try {
    const db = admin.firestore();

    // Add targetUserId to currentUser's 'following' subcollection
    await db.collection("users").doc(currentUserId)
      .collection("following").doc(targetUserId)
      .set({ followedAt: new Date().toISOString() });

    // Add currentUserId to targetUser's 'followers' subcollection
    await db.collection("users").doc(targetUserId)
      .collection("followers").doc(currentUserId)
      .set({ followedAt: new Date().toISOString() });

    // (Optional) Send email notification to target user
    const targetUserDoc = await db.collection("users").doc(targetUserId).get();
    const targetUserEmail = targetUserDoc.exists ? targetUserDoc.data().email : "";

    // Fetch follower's name
    const followerDoc = await db.collection("users").doc(currentUserId).get();
    const followerName = followerDoc.exists ? followerDoc.data().name || currentUserId : currentUserId;

    if (targetUserEmail) {
      sendEmail({
        to: targetUserEmail,
        subject: `You have a new follower!`,
        html: `<p>${followerName} is now following you.</p>`,
      });
    }
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// Unfollow User
const unfollowUser = async (req, res) => {
  // Use params as per your route: /unfollow/:currentUid/:targetUid
  const currentUserId = req.params.currentUid;
  const targetUserId = req.params.targetUid;

  try {
    const db = admin.firestore();

    // Remove targetUserId from currentUser's 'following' subcollection
    await db.collection("users").doc(currentUserId)
      .collection("following").doc(targetUserId)
      .delete();

    // Remove currentUserId from targetUser's 'followers' subcollection
    await db.collection("users").doc(targetUserId)
      .collection("followers").doc(currentUserId)
      .delete();

    res.status(200).json({ message: "User unfollowed successfully." });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};

// Get Followers of a User
const getFollowers = async (req, res) => {
  const { uid } = req.params;
  try {
    const db = admin.firestore();
    const followersSnapshot = await db.collection("users").doc(uid).collection("followers").get();
        const followers = [];
    for (const doc of followersSnapshot.docs) {
      const followerUid = doc.id;
      const userDoc = await db.collection("users").doc(followerUid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        followers.push({
          uid: followerUid,
          name: userData.name || "",
          profilePic: userData.profilePic || "",
        });
      }
    }
    res.status(200).json({ followers });
  } catch (err) {
    console.error("Error getting followers:", err);
    res.status(500).json({ error: "Failed to retrieve followers" });
  }
};

// Get Following of a User
const getFollowing = async (req, res) => {
  const { uid } = req.params;
  try {
    const db = admin.firestore();
    const followingSnapshot = await db.collection("users").doc(uid).collection("following").get();
        const following = [];
    for (const doc of followingSnapshot.docs) {
      const followingUid = doc.id;
      const userDoc = await db.collection("users").doc(followingUid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        following.push({
          uid: followingUid,
          name: userData.name || "",
          profilePic: userData.profilePic || "",
        });
      }
    }
    res.status(200).json({ following });
  } catch (err) {
    console.error("Error getting following:", err);
    res.status(500).json({ error: "Failed to retrieve following" });
  }
};

// Check if currentUid is following targetUid
const isFollowing = async (req, res) => {
  const { currentUid, targetUid } = req.params;
  try {
    const db = admin.firestore();
    const followRef = db.collection("followers").doc(currentUid);
    const snap = await followRef.get();
    if (snap.exists) {
      const followingList = snap.data().following || [];
      const result = followingList.includes(targetUid);
      return res.status(200).json({ isFollowing: result });
    } else {
      return res.status(200).json({ isFollowing: false });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
};
  