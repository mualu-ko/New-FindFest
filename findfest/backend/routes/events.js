// In routes/events.js
const express = require("express");
const router = express.Router();
const createEvent = require("../controller/create");
const { getEvents } = require("../controller/eventFetch");
const { getNearbyEvents } = require("../controller/getNearEvents");
const { verifyToken } = require("../controller/profile");
const { 
    rsvpToEvent, 
    cancelRSVP, 
    checkRSVP, 
    updateRSVPStatus, 
    getRSVPCount 
} = require("../controller/RSVP");
const { getCreatedEvents, getRSVPedEvents } = require("../controller/adminEvent");
const { editEvent } = require("../controller/edit");
const { getEventById } = require("../controller/event");
// Event routes
router.post("/", createEvent);
router.get("/", getEvents);
router.get("/near", getNearbyEvents);

// RSVP routes
router.post("/rsvp", rsvpToEvent);
router.post("/rsvp/cancel", cancelRSVP);
router.post("/rsvp/update", updateRSVPStatus);
router.get("/rsvp/check", checkRSVP);
router.get("/rsvp/count/:eventId", getRSVPCount);

// Admin view routes
router.get("/created/:userId", getCreatedEvents);
router.get("/rsvp/:userId", getRSVPedEvents);
router.put('/:id', editEvent);
// Get single event by ID
router.get('/:id', getEventById);

module.exports = router;
