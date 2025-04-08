import { useContext } from "react";
import { useParams } from "react-router-dom";
import { EventContext } from "./EventContext";
import EventDetails from "./EventDetails";

const EventPage = () => {
    const { id } = useParams();
    const { events, loading, error } = useContext(EventContext);

    if (loading) return <p>Loading event details...</p>;
    if (error) return <p>Error: {error}</p>;

    const event = events.find((e) => e.id.toString() === id);
    if (!event) return <p>Event not found.</p>;

    return (
        <div className="event-page">
            <EventDetails event={event} />
        </div>
    );
};

export default EventPage;
