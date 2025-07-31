import { useContext, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useFilter } from "./FilterContext.jsx";
import { useNavigate } from "react-router-dom";
import { EventContext } from "./EventContext";

import CategoryFilter from "./CategoryFilter";
import Categories from "../constants/Categories";
import EventCard from "./EventCard";
import formatDate from "./utils/formatDate";
import axios from "../utils/axios";
import "./Home.css";

import { useOutletContext } from "react-router-dom";

const Home = () => {
  const { searchQuery, selectedCategory, selectedDays } = useFilter();
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 10;
  const { loading, error, userLocation } = useContext(EventContext);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [errorRecommendations, setErrorRecommendations] = useState("");
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const navigate = useNavigate();

  // Get daysFilter from layout context (fallback to context if not present)
  const { daysFilter = selectedDays } = useOutletContext?.() || {};

  // Fetch recommended events from backend recommender
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      setErrorRecommendations("");
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const userId = currentUser ? currentUser.uid : undefined;
        const hasLocation = userLocation && userLocation.lat && userLocation.lon;
        const payload = {
          userId,
          searchQuery,
          category: selectedCategory === "All" ? null : selectedCategory,
          days: null, // always null, since backend ignores it
          location: hasLocation ? { lat: userLocation.lat, lon: userLocation.lon } : undefined
        };
        
        
        const res = await axios.post("/api/recommendations", payload);
        setRecommendedEvents(res.data.recommendations || []);
        if (Array.isArray(res.data.recommendations)) {
          res.data.recommendations.forEach(ev => {
            
          });
        }
     
      } catch (err) {
        setErrorRecommendations("Failed to fetch recommendations.");
        setRecommendedEvents([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, [searchQuery, selectedCategory, daysFilter]);

  // Fetch nearby events if user location exists
  useEffect(() => {
    if (userLocation && userLocation.lat && userLocation.lon) {
      fetchNearbyEvents(userLocation.lat, userLocation.lon);
    }
    // eslint-disable-next-line
  }, [userLocation && userLocation.lat, userLocation && userLocation.lon]);

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

      
      // Do NOT overwrite event.date with formatted string; keep raw date for filtering
      setNearbyEvents(response.data);
    } catch (err) {
      console.error("Error fetching nearby events:", err);
    }
  };

  // No longer needed: handleCategoryFilter (use context's setSelectedCategory in CategoryFilter and EventCard)
  const handleCategoryFilter = undefined;

  // Helper: filter by search query
  const filterBySearchQuery = (list) =>
    !searchQuery || searchQuery.trim() === ""
      ? list
      : list.filter(event =>
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

  // Helper: filter by category
  const filterByCategory = (list) =>
    selectedCategory === "All"
      ? list
      : list.filter(event =>
          Array.isArray(event.categories) && event.categories.includes(selectedCategory)
        );

  // Helper: filter by date
  const filterByDate = (list) => {
    if (!daysFilter || daysFilter === 0) return list;
    const now = new Date();
    const maxDate = new Date(now.getTime() + daysFilter * 24 * 60 * 60 * 1000);
    return list.filter(event => {
      let eventDate;
      // Handle Firestore Timestamp object
      if (event.date && typeof event.date === "object" && (event.date._seconds || event.date.seconds)) {
        const seconds = event.date._seconds || event.date.seconds;
        eventDate = new Date(seconds * 1000);
      } else {
        eventDate = new Date(event.date);
      }
      return eventDate >= now && eventDate <= maxDate;
    });
  };

  // Combined filter for recommended events
  const filteredEvents = filterBySearchQuery(filterByDate(filterByCategory(recommendedEvents)));

  // Pagination logic for filteredEvents
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Filter nearby events by category and date
  const filteredNearbyEvents = filterByDate(filterByCategory(nearbyEvents));

  return (
    <div className="home-container">
      {/* Category Filter */}
      <CategoryFilter
        categories={Categories}
      />

      {/* PAGINATED EVENTS SECTION (now using recommended events) */}
      {loadingRecommendations ? (
        <p>Loading recommendations...</p>
      ) : errorRecommendations ? (
        <p className="error-text">{errorRecommendations}</p>
      ) : (
        <div className="event-grid">
          {paginatedEvents.length > 0 ? (
            paginatedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <p className="no-events-text">No recommendations at this time.</p>
          )}
        </div>
      )}
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}

      {/* EVENTS NEAR YOU SECTION */}
      {userLocation && userLocation.lat && userLocation.lon ? (
        filteredNearbyEvents.length > 0 ? (
          <>
            <h2 className="section-title">Events Near You</h2>
            <div className="event-grid">
              {filteredNearbyEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <p className="no-events-text">No events found near your location for this category at the moment.</p>
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
