import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EventContext } from "./EventContext";
import EventCard from "./EventCard";
import formatDate from "./utils/formatDate";
import axios from "../utils/axios"; // Import your custom axios instance
import "./Home.css";

const Home = ({ searchQuery: propSearchQuery }) => {
  const {
    events,
    loading,
    error,
    userLocation
  } = useContext(EventContext);

  // If you have selectedCategory, setSelectedCategory, etc., provide them here or manage locally
  const selectedCategory = "All";
  const contextSearchQuery = "";
  const daysFilter = 0;
  const setSelectedCategory = () => {};

  const searchQuery = propSearchQuery || contextSearchQuery;
  const navigate = useNavigate();

  const [filteredEvents, setFilteredEvents] = useState([]);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    console.log("userLocation in Home.jsx:", userLocation);
    if (!events || events.length === 0) return;

    const today = new Date();
    const filterDate = new Date();
    filterDate.setDate(today.getDate() + daysFilter);

    const filtered = events.filter((event) => {
      if (!event || !event.name) return false;
      const eventDate = new Date(event.date);

      const matchesCategory =
        selectedCategory === "All" || (event.categories || []).includes(selectedCategory);
      const matchesSearch =
        searchQuery.trim() === "" || event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = daysFilter === 0 || (eventDate >= today && eventDate <= filterDate);

      return matchesCategory && matchesSearch && matchesDate;
    });

    setFilteredEvents(filtered);
    setCurrentPage(1);

    // Fetch nearby events if user location exists
    if (userLocation && userLocation.lat && userLocation.lon) {
      fetchNearbyEvents(userLocation.lat, userLocation.lon);
    }
  }, [events, selectedCategory, searchQuery, daysFilter, userLocation]);

  const fetchNearbyEvents = async (latitude, longitude) => {
    try {
      // Get Firebase Auth token
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error("User not logged in, cannot fetch nearby events");
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.get("/api/events/near", {
        params: { latitude, longitude },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Nearby events API response:", response.data);
      // Format dates for nearby events before setting state
const formattedNearbyEvents = response.data.map(event => ({
  ...event,
  date: formatDate(event.date),
}));
setNearbyEvents(formattedNearbyEvents);
    } catch (err) {
      console.error("Error fetching nearby events:", err);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    navigate("/", { state: { selectedCategory: category, searchQuery, daysFilter } });
  };

  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + pageSize);

  console.log("nearbyEvents state:", nearbyEvents);
  return (
    <div className="home-container">
      {/* RECOMMENDED EVENTS SECTION */}
      <h1 className="home-title">Recommended Events</h1>
      <div className="event-grid">
        {currentEvents.length > 0 ? (
          currentEvents.map((event) => (
            <EventCard key={event.id} event={event} onFilter={handleCategoryFilter} />
          ))
        ) : (
          <p className="no-events-text">No events match your search criteria.</p>
        )}
      </div>

      {filteredEvents.length > pageSize && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* EVENTS NEAR YOU SECTION */}
      {userLocation && userLocation.lat && userLocation.lon ? (
        nearbyEvents.length > 0 ? (
          <>
            <h2 className="section-title">Events Near You</h2>
            <div className="event-grid">
              {nearbyEvents.map((event) => (
                <EventCard key={event.id} event={event} onFilter={handleCategoryFilter} />
              ))}
            </div>
          </>
        ) : (
          <p className="no-events-text">No events found near your location at the moment.</p>
        )
      ) : (
        <p className="location-placeholder">
          Add your location for more localized event recommendations.
        </p>
      )}
    </div>
  );
};

export default Home;
