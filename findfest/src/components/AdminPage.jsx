import { useState, useEffect } from "react";
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
      <p>Coming soon: RSVP counts, check-ins, etc.</p>

      <button onClick={() => navigate(-1)} style={{ marginTop: 20 }}>← Back</button>
    </div>
  );
};

export default AdminPage;
