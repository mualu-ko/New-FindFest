import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import RSVP from "./RSVP";
import api from "../utils/axios"; // ⬅️ Make sure this is imported
import "./EventDetails.css";

const MapView = lazy(() => import("./MapView"));

const EventDetails = ({ event }) => {
  const navigate = useNavigate();
  const { setSelectedCategory } = useOutletContext();
  const [isRSVP, setIsRSVP] = useState(false);
  const [creator, setCreator] = useState(null); // ⬅️ New state

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    navigate("/", { state: { selectedCategory: category } });
  };

  const handleShareEvent = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Event link copied!");
  };

  const venue = event.venue;
  const { latitude, longitude } = event.location || {};

  // 🔍 Fetch creator profile based on event.creatorId
  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const res = await api.get(`/api/user/${event.createdBy}`);
        setCreator(res.data);
      } catch (err) {
        console.error("Failed to load creator info", err);
      }
    };
  
    if (event.createdBy) {
      fetchCreator();
    }
  }, [event.createdBy]);
  

  const goToCreatorProfile = () => {
    if (creator?.uid) {
      navigate(`/user/${creator.uid}`);
    }
  };

  return (
    <div className="event-details">
      <img className="event-image" src={event.imageUrl} alt={event.name} />
      <h2>{event.name}</h2>

      {/* 🌟 Creator info */}
      {creator && (
        <p className="event-creator">
          Created by{" "}
          <span className="creator-name" onClick={goToCreatorProfile} style={{ color: "#0077cc", cursor: "pointer" }}>
            {creator.name}
          </span>
        </p>
      )}

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
      <p>📍 {venue}</p>
      <p className="event-description">{event.description}</p>

      <Suspense fallback={<div>Loading map...</div>}>
        {latitude && longitude ? (
          <MapView latitude={latitude} longitude={longitude} />
        ) : (
          <p>Map location not available</p>
        )}
      </Suspense>

      <RSVP event={event} isRSVP={isRSVP} setIsRSVP={setIsRSVP} />

      <button className="share-btn" onClick={handleShareEvent}>
        🔗 Share Event
      </button>
    </div>
  );
};

export default EventDetails;
