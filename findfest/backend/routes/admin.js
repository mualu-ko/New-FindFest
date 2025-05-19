const express = require("express");
const { verifyToken } = require("../controller/profile");
const { promoteToAdmin, requireAdmin } = require("../controller/admin");
const { deleteEvent, banUser } = require("../controller/adminActions");

const router = express.Router();

// Promote a user to admin (admin only)
router.post("/promote", verifyToken, requireAdmin, promoteToAdmin);
// Delete event (admin only)
router.delete("/event/:eventId", verifyToken, requireAdmin, deleteEvent);
// Ban user (admin only)
router.post("/ban/:uid", verifyToken, requireAdmin, banUser);
// Get all users (admin only)
router.get("/users", verifyToken, requireAdmin, require("../controller/adminActions").getAllUsers);
// Demote user from admin (admin only)
router.post("/demote", verifyToken, requireAdmin, require("../controller/adminActions").demoteFromAdmin);

module.exports = router;
