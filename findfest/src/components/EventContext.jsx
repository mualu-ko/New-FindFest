import { createContext, useState, useEffect } from "react";

export const EventContext = createContext();

const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch("/data.json"); // Adjust path if needed
                if (!response.ok) {
                    throw new Error("Failed to load events");
                }
                const data = await response.json();
                setEvents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <EventContext.Provider value={{ events, loading, error }}>
            {children}
        </EventContext.Provider>
    );
};

export default EventProvider;
