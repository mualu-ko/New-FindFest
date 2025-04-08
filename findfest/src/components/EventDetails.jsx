import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import RSVP from "./RSVP";
import { Suspense, lazy } from "react";

// Lazy load MapView component
const MapView = lazy(() => import('./MapView'));
import "./EventDetails.css";

const EventDetails = ({ event }) => {
    const navigate = useNavigate();
    const { setSelectedCategory } = useOutletContext();

    const [isRSVP, setIsRSVP] = useState(false);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        navigate("/", { state: { selectedCategory: category } });
    };

    const handleShareEvent = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Event link copied!");
    };

    return (
        <div className="event-details">
            <img className="event-image" src={event.image} alt={event.name} />
            <h2>{event.name}</h2>

            <div className="event-tags">
                {event.categories.map((category, index) => (
                    <span
                        key={index}
                        className="event-tag"
                        onClick={() => handleCategoryClick(category)}
                    >
                        #{category}
                    </span>
                ))}
            </div>

            <p>📅 {event.date} | 🕙 {event.time}</p>
            <p>📍 {event.location}</p>
            <p className="event-description">{event.description}</p>

            {/* Suspense for lazy-loaded MapView */}
            <Suspense fallback={<div>Loading map...</div>}>
                <MapView latitude={event.latitude} longitude={event.longitude} />
            </Suspense>

            {/* RSVP Component */}
            <RSVP event={event} isRSVP={isRSVP} setIsRSVP={setIsRSVP} />

            <button className="share-btn" onClick={handleShareEvent}>
                🔗 Share Event
            </button>
        </div>
    );
};

export default EventDetails;
