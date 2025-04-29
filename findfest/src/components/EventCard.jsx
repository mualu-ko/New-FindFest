import { useNavigate } from "react-router-dom";
import "./EventCard.css";
import { useFilter } from "./FilterContext.jsx";
import formatDate from "./utils/formatDate";

const EventCard = ({ event }) => {
    const navigate = useNavigate();
    const { setSelectedCategory } = useFilter();

    const handleCategoryClick = (e, category) => {
        e.stopPropagation(); // Prevent navigation to event details
        setSelectedCategory(category);
    };

 

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
