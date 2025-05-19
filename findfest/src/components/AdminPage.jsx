import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import api from "../utils/axios";
import VenueSearchMap from "./MapCreate";
import CloudinaryUploadButton from "./ImageUpload";
import "./AdminPage.css";

// Convert Firestore timestamp or string to date input value (YYYY-MM-DD)
function formatDateInput(date) {
  if (!date) return '';
  if (typeof date === "string") return new Date(date).toISOString().split("T")[0];
  if (date._seconds) return new Date(date._seconds * 1000).toISOString().split("T")[0];
  return '';
}

// Format date for display as 'Monthname day, year'
function formatDateDisplay(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : (date._seconds ? new Date(date._seconds * 1000) : new Date(date));
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Format date for backend as YYYY-MM-DD
const formatDateForBackend = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};
const AdminPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [rsvpCount, setRsvpCount] = useState(null); // RSVP analytics state
const [attendedCount, setAttendedCount] = useState(null); // Attendance analytics
const [locationStats, setLocationStats] = useState([]); // Array for city/country analytics
const [attendanceCityStats, setAttendanceCityStats] = useState([]); // Attendance breakdown by city
const [analyticsLoading, setAnalyticsLoading] = useState(false);
const [analyticsError, setAnalyticsError] = useState("");
const [ratings, setRatings] = useState({ eventAvg: null, eventCount: null, organizerAvg: null, organizerCount: null });

// Fetch RSVP analytics (count + locations + attendance)
useEffect(() => {
  if (!event || !event.id) return;
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const res = await api.get(`/api/events/analytics/${event.id}`);
      setRsvpCount(res.data.rsvpCount ?? 0);
      setAttendedCount(res.data.attendedCount ?? 0);
      // For pie chart
      // For city stats bar chart
      setAttendanceCityStats(res.data.attendanceCityStats || []);
      // Ratings analytics
      if (res.data.ratings) {
        setRatings(res.data.ratings);
      } else {
        setRatings({ eventAvg: null, eventCount: null, organizerAvg: null, organizerCount: null });
      }
      // For RSVP by city (legacy, still used for city-only bar)
      const cityMap = {};
      (res.data.locations || []).forEach(loc => {
        const key = loc.city || loc.country || "Unknown";
        cityMap[key] = (cityMap[key] || 0) + 1;
      });
      const stats = Object.entries(cityMap).map(([name, count]) => ({ name, count }));
      setLocationStats(stats);
    } catch (err) {
      setRsvpCount(null);
      setAttendedCount(null);
      setLocationStats([]);
      setAttendanceCityStats([]);
      setRatings({ eventAvg: null, eventCount: null, organizerAvg: null, organizerCount: null });
      setAnalyticsError("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };
  fetchAnalytics();
}, [event]);


  // 🔄 Fetch Event Function
  const fetchEventData = async (userId) => {
    try {
      const res = await api.get(`/api/events/created/${userId}`);
      if (!Array.isArray(res.data)) {
        setError("Unexpected response from server.");
        setLoading(false);
        return;
      }
      if (res.data.length === 0) {
        setError("You have not created any events yet.");
        setLoading(false);
        return;
      }
      const foundEvent = res.data.find(ev => ev.id === id);
      if (!foundEvent) {
        setError("Event not found or you do not have permission to view it.");
        setLoading(false);
        return;
      }
      setEvent(foundEvent);
      setFormData({
        name: foundEvent.name,
        description: foundEvent.description,
        venue: foundEvent.venue,
        date: formatDateInput(foundEvent.date),
        imageUrl: foundEvent.imageUrl,
        latitude: foundEvent.location?.latitude || '',
        longitude: foundEvent.location?.longitude || '',
      });
      setError("");
    } catch (err) {
      setError("Failed to fetch your events. " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError("You must be signed in to view this page.");
        setLoading(false);
        return;
      }
      await fetchEventData(user.uid);
    });

    return () => unsubscribe();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      imageUrl,
    }));
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        venue: formData.venue,
        // Send JS Date object so backend can store as Firestore Timestamp
        date: formData.date ? new Date(formData.date) : '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl,
      };
      await api.put(`/api/events/${id}`, payload);

      const user = auth.currentUser;
      if (user) await fetchEventData(user.uid); // Refresh state with updated data

      alert("Event updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update event.");
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete this event?");
    if (!confirm) return;
    try {
      await api.delete(`/api/events/${id}`);
      alert("Event deleted.");
      navigate("/my-events");
    } catch (err) {
      console.error(err);
      alert("Failed to delete event.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!event) return null;

  const currentImage = formData.imageUrl || event.imageUrl;

  return (
    <div className="admin-event-page">
      <h1>Admin Panel: {event.name}</h1>

      {currentImage && (
        <img
          src={currentImage}
          alt="Event"
          onError={(e) => {
            console.warn("Image failed to load:", currentImage);
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/400?text=Image+Not+Found";
          }}
          style={{ maxWidth: 400, borderRadius: 8, marginBottom: 16 }}
        />
      )}

      {!isEditing ? (
        <>
          <p>{event.description}</p>
          <p><strong>📍 Venue:</strong> {event.venue}</p>
          <p><strong>🗓️ Date:</strong> {formatDateDisplay(event.date)}</p>

          <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
          <button onClick={handleDelete} className="delete-btn">🗑️ Delete</button>
        </>
      ) : (
        <>
          <div>
            <label>Name:</label>
            <input name="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div>
            <label>Description:</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} />
          </div>
          <div>
            <label>Venue:</label>
            <input
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              placeholder="Search or select venue"
            />
          </div>
          <div>
            <label>Date:</label>
            <input type="date" name="date" value={formatDateInput(formData.date)} onChange={handleInputChange} />
          </div>

          {/* Cloudinary image upload */}
          <CloudinaryUploadButton 
            onUpload={handleImageUpload} 
            folder="event_images" 
            label="Upload Event Image"
          />

          {/* Map for location */}
          <VenueSearchMap eventData={formData} setEventData={setFormData} />

          <button onClick={handleUpdate}>💾 Save</button>
          <button onClick={() => setIsEditing(false)} style={{ marginLeft: 10 }}>Cancel</button>
        </>
      )}

      <hr />
      <h2>📊 Analytics</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>RSVP Count:</strong>{' '}
        {analyticsLoading ? <span>Loading...</span> : rsvpCount !== null ? <span>{rsvpCount}</span> : <span>N/A</span>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Attendance:</strong>{' '}
        {analyticsLoading ? <span>Loading...</span> : attendedCount !== null ? <span>{attendedCount} / {rsvpCount}</span> : <span>N/A</span>}
      </div>
      {/* Ratings Analytics */}
      <div style={{ marginBottom: 16 }}>
        <strong>Event Rating:</strong>{' '}
        {analyticsLoading ? <span>Loading...</span> : ratings.eventAvg !== null ? <span>{ratings.eventAvg.toFixed(2)} / 5 ({ratings.eventCount} ratings)</span> : <span>N/A</span>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Organizer Rating:</strong>{' '}
        {analyticsLoading ? <span>Loading...</span> : ratings.organizerAvg !== null ? <span>{ratings.organizerAvg.toFixed(2)} / 5 ({ratings.organizerCount} ratings)</span> : <span>N/A</span>}
      </div>
      {analyticsError && <div style={{ color: 'red' }}>{analyticsError}</div>}
      {/* Pie Chart: Attended vs Not Attended */}
      {rsvpCount > 0 && attendedCount !== null && (
        <div style={{ width: 350, margin: '0 auto' }}>
          <h3>Attendance Ratio</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Attended', value: attendedCount },
                  { name: 'Not Attended', value: rsvpCount - attendedCount }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                <Cell key="attended" fill="#4caf50" />
                <Cell key="notattended" fill="#f44336" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Bar Chart: Attendance by City */}
      {attendanceCityStats.length > 0 && (
        <div style={{ height: 300, width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <h3>Attendance by City</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceCityStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attended" fill="#4caf50" name="Attended" />
              <Bar dataKey="total" fill="#8884d8" name="RSVPs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Email Blast Section */}
      <hr style={{ margin: '32px 0' }} />
      <h2>📧 Email Blast</h2>
      <EmailBlast eventId={event.id} />
      {/* For future: Add more analytics here, e.g., check-ins, revenue, engagement, etc. */}

      <button
        onClick={() => navigate(`/admin/event/${event.id}/attendance`)}
        style={{ marginTop: 20, marginRight: 12 }}
      >
        📝 Manage Attendance
      </button>
      <button onClick={() => navigate(-1)} style={{ marginTop: 20 }}>← Back</button>
    </div>
  );
};

// --- Email Blast Component ---
import { useState as useStateReact } from "react";

function EmailBlast({ eventId }) {
  const [subject, setSubject] = useStateReact("");
  const [message, setMessage] = useStateReact("");
  const [toRSVPd, setToRSVPd] = useStateReact(true);
  const [toAttended, setToAttended] = useStateReact(false);
  const [sending, setSending] = useStateReact(false);
  const [result, setResult] = useStateReact("");
  const [error, setError] = useStateReact("");

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult("");
    setError("");
    try {
      const res = await api.post(`/api/events/send-email/${eventId}`, {
        subject,
        message,
        toRSVPd,
        toAttended,
      });
      setResult(res.data.message || "Email sent!");
      setSubject("");
      setMessage("");
      setToRSVPd(true);
      setToAttended(false);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to send email. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} style={{ maxWidth: 600, margin: '0 auto', padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <div style={{ marginBottom: 12 }}>
        <label><strong>Subject:</strong></label><br />
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label><strong>Message:</strong></label><br />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
          required
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label><strong>Send to:</strong></label><br />
        <label style={{ marginRight: 16 }}>
          <input
            type="checkbox"
            checked={toRSVPd}
            onChange={e => setToRSVPd(e.target.checked)}
          />{' '}
          All who RSVPd
        </label>
        <label>
          <input
            type="checkbox"
            checked={toAttended}
            onChange={e => setToAttended(e.target.checked)}
          />{' '}
          All who Attended
        </label>
      </div>
      <button type="submit" disabled={sending || (!toRSVPd && !toAttended)} style={{ padding: '8px 20px', fontWeight: 600, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
        {sending ? "Sending..." : "Send Email"}
      </button>
      {result && <div style={{ color: 'green', marginTop: 12 }}>{result}</div>}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </form>
  );
}

export default AdminPage;
