const express = require("express");
const router = express.Router();
const {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
} = require("../controller/follow");

// Follow a user
router.post("/follow/:currentUid/:targetUid", followUser);
// Unfollow a user
router.post("/unfollow/:currentUid/:targetUid", unfollowUser);
// Check if following
router.get("/status/:currentUid/:targetUid", isFollowing);
// Get followers
router.get("/followers/:uid", getFollowers);
// Get following
router.get("/following/:uid", getFollowing);

module.exports = router;
