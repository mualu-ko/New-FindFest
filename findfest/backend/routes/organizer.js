const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controller/profile");
const { getOrganizerRatings } = require("../controller/ratings");

// Organizer rating endpoint
router.get("/ratings/:organizerId", verifyToken, getOrganizerRatings);

module.exports = router;
