import { useNavigate } from "react-router-dom";
import "./EventCard.css";

import formatDate from "./utils/formatDate";

const EventCard = ({ event, onFilter }) => {
    const navigate = useNavigate();

    const handleCategoryClick = (e, category) => {
        e.stopPropagation(); // Prevent navigation to event details
        onFilter(category);
        navigate("/", { state: { selectedCategory: category } });
    };

    // Log the event to check if the imageUrl is present
    console.log(event);

    return (
        <div className="event-card" onClick={() => navigate(`/event/${event.id}`)}>
            {/* Ensure the image URL is correct */}
            <img className="event-image" src={event.imageUrl} alt={event.name} />
            <h2>{event.name}</h2>
            <p>📅 {formatDate(event.date)} | 📍 {event.venue}</p>

            {/* Clickable Event Tags */}
            <div className="event-tags">
                {event.categories.map((category, index) => (
                    <span
                        key={index}
                        className="event-tag"
                        onClick={(e) => handleCategoryClick(e, category)}
                    >
                        #{category}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default EventCard;
