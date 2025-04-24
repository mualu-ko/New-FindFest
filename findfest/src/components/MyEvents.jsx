import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../config/firebase";
import api from "../utils/axios";
import AdminView from "./AdminView"; // ✅ Importing AdminView
import "./MyEvents.css";

function formatDateOnly(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  if (date._seconds) {
    return new Date(date._seconds * 1000).toLocaleDateString();
  }
  return '';
}

const MyEvents = () => {
  const [userCreatedEvents, setUserCreatedEvents] = useState([]);
  const [rsvpedEvents, setRsvpedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const [created, rsvps] = await Promise.all([
            api.get(`/api/events/created/${user.uid}`),
            api.get(`/api/events/rsvp/${user.uid}`)
          ]);
          setUserCreatedEvents(created.data || []);
          setRsvpedEvents(rsvps.data || []);
        } catch (err) {
          console.error("Failed to fetch events:", err);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading your events...</p>;

  return (
    <div className="my-events-page">
      <h1>🎉 My Events</h1>

      {/* 👇 Admin View for Created Events */}
      <AdminView events={userCreatedEvents} />

      {/* 👇 RSVP'd Events Section */}
      <div className="rsvp-section">
        <h2>Your RSVP'd Events</h2>
        {rsvpedEvents.length === 0 ? (
          <p>You haven't RSVP'd to any events yet.</p>
        ) : (
          <div className="event-list">
            {rsvpedEvents.map((event) => (
              <div key={event.id} className="event-card">
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.name} className="event-image" />
                )}
                <div className="event-details">
                  <h3>{event.name}</h3>
                  <p>{event.description}</p>
                  <p><strong>📍 {event.venue}</strong></p>
                  <p>🗓️ {formatDateOnly(event.date)}</p>
                  <Link to={`/event/${event.id}`} className="view-btn">
                    View Event ➡️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
