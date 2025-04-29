const express = require("express");
const router = express.Router();
const recommenderController = require("../controller/recommender");

// POST /api/recommendations
router.post("/", recommenderController.getRecommendations);

module.exports = router;
