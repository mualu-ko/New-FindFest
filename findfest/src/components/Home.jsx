import { useContext, useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { EventContext } from "./EventContext";
import EventCard from "./EventCard"; 
import "./Home.css";

const Home = ({ searchQuery: propSearchQuery }) => {
    const { events, loading, error } = useContext(EventContext);
    const context = useOutletContext() || {};
    const { selectedCategory = 'All', searchQuery: contextSearchQuery = '', daysFilter = 0, setSelectedCategory } = context;
    const searchQuery = propSearchQuery || contextSearchQuery;
    const navigate = useNavigate();

    const [filteredEvents, setFilteredEvents] = useState([]);

    useEffect(() => {
        if (!events || events.length === 0) return;

        const today = new Date();
        const filterDate = new Date();
        filterDate.setDate(today.getDate() + daysFilter);

        const newFilteredEvents = events.filter((event) => {
            if (!event || !event.name) return false;
            const eventDate = new Date(event.date);

            const matchesCategory = selectedCategory === "All" || (event.categories || []).includes(selectedCategory);
            const matchesSearch = searchQuery.trim() === "" || event.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDate = daysFilter === 0 || (eventDate >= today && eventDate <= filterDate);

            return matchesCategory && matchesSearch && matchesDate;
        });

        setFilteredEvents(newFilteredEvents);
    }, [events, selectedCategory, searchQuery, daysFilter]);

    // Function to update category when clicking a tag
    const handleCategoryFilter = (category) => {
        setSelectedCategory(category);
        navigate("/", { state: { selectedCategory: category, searchQuery, daysFilter } });
    };

    return (
        <div className="home-container">
            <h1 className="home-title">Recommended Events</h1>
            <div className="event-grid">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} onFilter={handleCategoryFilter} />
                    ))
                ) : (
                    <p className="no-events-text">No events match your search criteria.</p>
                )}
            </div>
        </div>
    );
};

export default Home;
