import { Link } from "react-router-dom";
import "./AdminView.css";

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date._seconds) {
    return new Date(date._seconds * 1000).toLocaleString();
  }
  return '';
}

const AdminView = ({ events }) => {
  return (
    <div className="admin-view">
      <h2>Your Created Events</h2>
      {events.length === 0 ? (
        <p>You haven't created any events yet.</p>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              {event.imageUrl && (
                <img src={event.imageUrl} alt={event.name} className="event-image" />
              )}
              <div className="event-details">
                <h3>{event.name}</h3>
                <p>{event.description}</p>
                <p><strong>📍 {event.venue}</strong></p>
                <p>🗓️ {formatDate(event.date)}</p>
                <Link to={`/admin/event/${event.id}`} className="manage-btn">
                  Manage Event ➡️
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminView;
