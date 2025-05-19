const axios = require("axios");
const admin = require("../firebaseAdmin");

// Helper: Reverse geocode lat/lon to city/country using Nominatim
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "FindFest/1.0 (contact@findfest.com)" }
    });
    const address = res.data.address || {};
    return {
      city: address.city || address.town || address.village || address.hamlet || "",
      country: address.country || "",
    };
  } catch (err) {
    return { city: "", country: "" };
  }
}

// Endpoint: /api/events/:eventId/analytics
exports.getEventAnalytics = async (req, res) => {
  const { eventId } = req.params;
  try {
    const db = admin.firestore();
    // 1. Get all RSVPs for this event
    const rsvpsSnap = await db
      .collection("rsvps")
      .where("eventId", "==", eventId)
      .where("status", "==", true)
      .get();

    const rsvpCount = rsvpsSnap.size;
    if (rsvpCount === 0) {
      return res.json({ rsvpCount: 0, locations: [] });
    }

    // 2. Get userIds
    // 2. Get RSVP details (including attended status)
    const rsvpDetails = rsvpsSnap.docs.map(doc => ({
      ...doc.data(),
      attended: !!doc.data().attended
    }));
    const userIds = rsvpDetails.map(r => r.userId);

    // 3. Fetch user locations
    const userDocs = await Promise.all(userIds.map(uid => db.collection("users").doc(uid).get()));
    const locations = [];
    let attendedCount = 0;
    for (let i = 0; i < userDocs.length; i++) {
      const userDoc = userDocs[i];
      const userId = userIds[i];
      const rsvp = rsvpDetails[i];
      const loc = userDoc.exists ? userDoc.data().location : null;
      if (loc && loc.lat && loc.lon) {
        // 4. Reverse geocode
        const { city, country } = await reverseGeocode(loc.lat, loc.lon);
        locations.push({
          userId,
          lat: loc.lat,
          lon: loc.lon,
          venue: loc.venue || "",
          city,
          country,
          attended: !!rsvp.attended
        });
        if (rsvp.attended) attendedCount++;
        // Nominatim rate limit: 1 request/sec
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }

    // Attendance breakdown by city
    const attendanceByCity = {};
    locations.forEach(loc => {
      const key = loc.city || loc.country || "Unknown";
      if (!attendanceByCity[key]) attendanceByCity[key] = { attended: 0, total: 0 };
      attendanceByCity[key].total++;
      if (loc.attended) attendanceByCity[key].attended++;
    });
    const attendanceCityStats = Object.entries(attendanceByCity).map(([name, stats]) => ({
      name,
      attended: stats.attended,
      total: stats.total
    }));

    // --- Ratings Analytics ---
    // 1. Event ratings
    const ratingsSnap = await db.collection("ratings").where("eventId", "==", eventId).get();
    let ratingSum = 0;
    let ratingCount = 0;
    ratingsSnap.forEach(doc => {
      ratingSum += doc.data().rating;
      ratingCount++;
    });
    const eventAvgRating = ratingCount ? ratingSum / ratingCount : 0;

    // 2. Organizer rating
    // Find the event doc to get organizerId
    const eventDoc = await db.collection("events").doc(eventId).get();
    let organizerAvgRating = null;
    let organizerRatingCount = null;
    if (eventDoc.exists && eventDoc.data().organizerId) {
      const organizerId = eventDoc.data().organizerId;
      // Get all events by this organizer
      const eventsSnap = await db.collection("events").where("organizerId", "==", organizerId).get();
      const eventIds = eventsSnap.docs.map(doc => doc.id);
      let orgRatingSum = 0;
      let orgRatingCount = 0;
      if (eventIds.length > 0) {
        // Firestore 'in' supports max 10
        const chunks = [];
        for (let i = 0; i < eventIds.length; i += 10) {
          chunks.push(eventIds.slice(i, i + 10));
        }
        for (const chunk of chunks) {
          const orgRatingsSnap = await db.collection("ratings").where("eventId", "in", chunk).get();
          orgRatingsSnap.forEach(doc => {
            orgRatingSum += doc.data().rating;
            orgRatingCount++;
          });
        }
      }
      organizerAvgRating = orgRatingCount ? orgRatingSum / orgRatingCount : 0;
      organizerRatingCount = orgRatingCount;
    }

    res.json({
      rsvpCount,
      attendedCount,
      locations,
      attendanceCityStats,
      rsvpDetails,
      ratings: {
        eventAvg: eventAvgRating,
        eventCount: ratingCount,
        organizerAvg: organizerAvgRating,
        organizerCount: organizerRatingCount
      }
    });
  } catch (err) {
    console.error("Event analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
