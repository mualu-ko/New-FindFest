import { createContext, useState, useEffect } from "react";
import api from "../utils/axios"; // Import the axios instance from utils/api.js
import formatDate from "./utils/formatDate";

export const EventContext = createContext();

const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);



    // Fetch data from backend using axios
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get("/api/events"); // Use axios to make the GET request
                const formattedEvents = response.data.map(event => {
                    // Format the date and replace the original date field with the formatted date string
                    const formattedDate = formatDate(event.date);

                    return {
                        ...event,
                        date: formattedDate, // Replace the original date object with the formatted date string
                    };
                });
                setEvents(formattedEvents); // Store formatted events data in the state
            } catch (err) {
                setError(err.message); // If there's an error, store the error message
            } finally {
                setLoading(false); // Once fetching is done, set loading to false
            }
        };

        const fetchUserProfile = async () => {
            try {
                // Import getAuth from firebase/auth at the top if not already imported
                // import { getAuth } from "firebase/auth";
                const { getAuth } = await import("firebase/auth");
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) return setUserLocation(null);
                const token = await user.getIdToken();
                const res = await api.get("/api/user/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.data && res.data.location) {
                    setUserLocation(res.data.location);
                } else {
                    setUserLocation(null);
                }
            } catch (err) {
                setUserLocation(null);
            }
        };


        fetchEvents(); // Call the fetch function on component mount
        fetchUserProfile(); // Fetch user profile (location) on mount
    }, []); // Empty dependency array means it runs once when component mounts

    return (
        <EventContext.Provider value={{ events, loading, error, userLocation }}>
            {children} {/* Render children components with event data */}
        </EventContext.Provider>
    );
};

export default EventProvider;
