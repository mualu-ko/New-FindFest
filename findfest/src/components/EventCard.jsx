import { useNavigate } from "react-router-dom";
import "./EventCard.css";

const EventCard = ({ event, onFilter }) => {
    const navigate = useNavigate();

    const handleCategoryClick = (e, category) => {
        e.stopPropagation(); // Prevent navigation to event details
        onFilter(category);
        navigate("/", { state: { selectedCategory: category } });
    };

    return (
        <div className="event-card" onClick={() => navigate(`/event/${event.id}`)}>
            <img className="event-image" src={event.image} alt={event.name} />
            <h2>{event.name}</h2>
            <p>📅 {event.date} | 📍 {event.location}</p>

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
