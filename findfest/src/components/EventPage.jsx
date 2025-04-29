import { useContext, useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { EventContext } from "./EventContext";
import EventDetails from "./EventDetails";
import api from "../utils/axios";

const EventPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { events, loading, error } = useContext(EventContext);
    const [fetchedEvent, setFetchedEvent] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");

    // Try to get event from navigation state
    const eventFromState = location.state?.event;
    // Try to get event from context
    const eventFromContext = events.find((e) => e.id?.toString() === id);
    // Decide which event to use
    const event = eventFromState || eventFromContext || fetchedEvent;

    useEffect(() => {
        // If not found in state or context, fetch from backend
        if (!event && id) {
            setFetching(true);
            setFetchError("");
            api.get(`/api/events/${id}`)
                .then(res => setFetchedEvent(res.data))
                .catch(err => setFetchError("Event not found."))
                .finally(() => setFetching(false));
        }
    }, [id, event]);

    if (loading || fetching) return <p>Loading event details...</p>;
    if (error || fetchError) return <p>Error: {error || fetchError}</p>;
    if (!event) return <p>Event not found.</p>;

    return (
        <div className="event-page">
            <EventDetails event={event} />
        </div>
    );
};

export default EventPage;
