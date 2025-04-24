// controllers/eventFetch.js
const { database } = require("../config/firebase");

const getEvents = async (req, res) => {
    try {
        const snapshot = await database.collection("events").get();
        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Failed to fetch events" });
    }
};

module.exports = { getEvents };
