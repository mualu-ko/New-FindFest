import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";

const AdminAttendance = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/events/attendance/${eventId}`);
        setAttendanceList(res.data);
      } catch (err) {
        setError("Failed to fetch attendance list");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [eventId]);

  const handleCheck = (idx) => {
    setAttendanceList(list => list.map((item, i) => i === idx ? { ...item, attended: !item.attended } : item));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/events/attendance/${eventId}`,
        { attendance: attendanceList.map(({ userId, attended }) => ({ userId, attended })) }
      );
      alert("Attendance updated successfully!");
    } catch (err) {
      setError("Failed to update attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading attendance...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="admin-attendance-page">
      <h1>Attendance Checklist</h1>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← Back</button>
      <table style={{ width: '100%', maxWidth: 600, margin: '0 auto', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Attended</th>
          </tr>
        </thead>
        <tbody>
          {attendanceList.map((user, idx) => (
            <tr key={user.userId}>
              <td>{user.name || 'Unknown'}</td>
              <td>{user.email || 'Unknown'}</td>
              <td style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={!!user.attended}
                  onChange={() => handleCheck(idx)}
                  disabled={saving}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSave} disabled={saving} style={{ marginTop: 20 }}>
        {saving ? "Saving..." : "Save Attendance"}
      </button>
    </div>
  );
};

export default AdminAttendance;
