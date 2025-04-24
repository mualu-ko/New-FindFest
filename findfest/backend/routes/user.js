const express = require("express");
const {
  verifyToken,
  getUserProfile,
  updateUserProfile,
  updateUserLocation,
} = require("../controller/profile");
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require("../controller/follow");

const router = express.Router();

// GET /api/user/profile
router.get("/profile", verifyToken, getUserProfile);

// Public profile by UID (both singular and plural for compatibility)
router.get("/:uid", require("../controller/profile").getUserById);
router.get("/users/:uid", require("../controller/profile").getUserById);

// PUT /api/user/profile
router.put("/profile", verifyToken, updateUserProfile, updateUserLocation);

router.post("/follow/:currentUid/:targetUid", verifyToken, followUser);
router.delete("/unfollow/:currentUid/:targetUid", verifyToken, unfollowUser);
router.get("/followers/:currentUid", verifyToken, getFollowers);
router.get("/following/:currentUid", verifyToken, getFollowing);
module.exports = router;
