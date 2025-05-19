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
const { getEventAnalytics } = require("../controller/eventAnalytics");
const { getAttendanceList, setAttendance } = require("../controller/attendance");
const { editEvent } = require("../controller/edit");
const { getEventById } = require("../controller/event");
const { sendEventEmail } = require("../controller/eventEmail");
const { rateEvent, getEventRatings } = require("../controller/ratings");
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
// Analytics endpoint for event admin or global admin
router.get('/analytics/:eventId', verifyToken, getEventAnalytics);
// Attendance endpoints
router.get('/attendance/:eventId', verifyToken, getAttendanceList);
router.post('/attendance/:eventId', verifyToken, setAttendance);
// Email blast endpoint
router.post('/send-email/:eventId', verifyToken, sendEventEmail);
// Event rating endpoints
router.post('/rate/:eventId', verifyToken, rateEvent);
router.get('/ratings/:eventId', verifyToken, getEventRatings);
// Get single event by ID
router.get('/:id', getEventById);

module.exports = router;
