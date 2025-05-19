import { useState, useEffect } from "react";
import api from "../utils/axios";

function StarDisplay({ value, size = 22 }) {
  // value: float, e.g. 4.25
  // Renders 5 stars, filled according to value (supports half-stars)
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push(<span key={i} style={{ color: '#FFD700', fontSize: size }}>★</span>);
    } else if (value >= i - 0.5) {
      stars.push(<span key={i} style={{ color: '#FFD700', fontSize: size }}>☆</span>);
    } else {
      stars.push(<span key={i} style={{ color: '#ccc', fontSize: size }}>★</span>);
    }
  }
  return <span>{stars}</span>;
}

export default function EventRating({ eventId }) {
  const [myRating, setMyRating] = useState(null);
  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/events/ratings/${eventId}`);
        setAvg(res.data.average);
        setCount(res.data.count);
        if (typeof res.data.myRating === 'number') setMyRating(res.data.myRating);
      } catch (err) {
        setError("Failed to load ratings");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId]);

  const handleRate = async (rating) => {
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/events/rate/${eventId}`, { rating });
      setMyRating(rating);
      setEditMode(false);
      // Refresh average/count
      const res = await api.get(`/api/events/ratings/${eventId}`);
      setAvg(res.data.average);
      setCount(res.data.count);
    } catch (err) {
      setError("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (activeRating, clickable) => (
    <div style={{ fontSize: 28, margin: '8px 0' }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{
            color: activeRating >= star ? '#FFD700' : '#ccc',
            cursor: clickable && !submitting ? 'pointer' : 'default',
            transition: 'color 0.2s',
          }}
          onClick={() => clickable && !submitting && handleRate(star)}
          role={clickable ? "button" : undefined}
          aria-label={clickable ? `Rate ${star} stars` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ margin: '18px 0' }}>
      <div style={{ fontWeight: 600 }}>Rate this Event:</div>
      {myRating && !editMode ? (
        <>
          {renderStars(myRating, false)}
          <button onClick={() => setEditMode(true)} style={{ marginLeft: 10, padding: '2px 12px', fontSize: 14 }}>Edit</button>
        </>
      ) : (
        renderStars(myRating || 0, true)
      )}
      {loading ? (
        <span>Loading rating...</span>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : count === 0 ? (
        <span>No ratings yet.</span>
      ) : (
        <span>
          <StarDisplay value={avg} size={22} />
          <span style={{ marginLeft: 8, color: '#666', fontSize: 16 }}>
            {avg.toFixed(2)} / 5 ({count} ratings)
          </span>
        </span>
      )}
      {myRating && (
        <div style={{ color: '#1976d2' }}>Your rating: {myRating} ★</div>
      )}
    </div>
  );
}
