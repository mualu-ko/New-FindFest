import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import { getAuth } from "firebase/auth";
import "./AdminDashboard.css"
const AdminDashboard = ({ user }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user.isAdmin) return;
      setAdminLoading(true);
      setAdminError("");
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const token = await currentUser.getIdToken();
        // Fetch all users
        const usersRes = await axios.get("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllUsers(usersRes.data);
        // Fetch all events
        const eventsRes = await axios.get("/api/events");
        setAllEvents(eventsRes.data);
      } catch (err) {
        setAdminError("Failed to fetch admin data");
        console.error(err);
      } finally {
        setAdminLoading(false);
      }
    };
    fetchAdminData();
  }, [user.isAdmin]);

  // Admin actions
  const handleDeleteEvent = async (eventId) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();
      await axios.delete(`/api/admin/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      alert("Failed to delete event");
    }
  };
  // Ban Modal State
  const [banModal, setBanModal] = useState({ open: false, uid: null, name: '', error: '', reason: '' });

  const openBanModal = (uid, name) => {
    setBanModal({ open: true, uid, name, error: '', reason: '' });
  };
  const closeBanModal = () => {
    setBanModal({ open: false, uid: null, name: '', error: '', reason: '' });
  };
  const handleBanReasonChange = (e) => {
    setBanModal((prev) => ({ ...prev, reason: e.target.value }));
  };
  const handleBanSubmit = async () => {
    const { uid, reason } = banModal;
    if (!reason || reason.trim() === '') {
      setBanModal((prev) => ({ ...prev, error: 'Ban reason is required.' }));
      return;
    }
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (uid === currentUser.uid) {
      setBanModal((prev) => ({ ...prev, error: "You cannot ban yourself!" }));
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      await axios.post(`/api/admin/ban/${uid}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, banned: true } : u));
      closeBanModal();
    } catch (err) {
      setBanModal((prev) => ({ ...prev, error: 'Failed to ban user' }));
    }
  };


  const handlePromoteUser = async (uid) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();
      await axios.post("/api/admin/promote", { uid }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, isAdmin: true } : u));
    } catch (err) {
      alert("Failed to promote user to admin");
    }
  };

  const handleDemoteUser = async (uid) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (uid === currentUser.uid) {
      alert("You cannot demote yourself!");
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      await axios.post("/api/admin/demote", { uid }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, isAdmin: false } : u));
    } catch (err) {
      alert("Failed to demote user");
    }
  };


  return (
    <div className="admin-dashboard">
      <h3>Admin Dashboard</h3>
      <p>Welcome, {user.name || "Admin"}!</p>
      {adminLoading && <p>Loading admin data...</p>}
      {adminError && <p className="error">{adminError}</p>}
      {/* Ban Reason Modal */}
      {banModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h4>Ban User: {banModal.name}</h4>
            <label>
              Reason for ban:
              <textarea
                style={{ width: '100%', minHeight: 60, marginTop: 8 }}
                value={banModal.reason}
                onChange={handleBanReasonChange}
                placeholder="Enter reason for banning this user..."
              />
            </label>
            {banModal.error && <p style={{ color: 'red' }}>{banModal.error}</p>}
            <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={closeBanModal}>Cancel</button>
              <button onClick={handleBanSubmit} style={{ background: '#d32f2f', color: 'white' }}>Ban User</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div>
          <h4>All Events</h4>
          <ul>
            {allEvents.map(event => (
              <li key={event.id} style={{ marginBottom: 8 }}>
                <span>{event.name || event.id}</span>
                <button style={{ marginLeft: 8 }} onClick={() => handleDeleteEvent(event.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>All Users</h4>
          <ul>
            {allUsers.map(userObj => (
              <li key={userObj.uid} style={{ marginBottom: 8 }}>
                <span>{userObj.name || userObj.email || userObj.uid}</span>
                {userObj.uid === user.uid ? (
                  <>
                    <span style={{ marginLeft: 8, color: 'green' }}>(You)</span>
                    {userObj.isAdmin && (
                      <span style={{ marginLeft: 8, color: 'blue' }}>(Admin)</span>
                    )}
                  </>
                ) : (
                  <>
                    {userObj.banned ? (
                      <span style={{ marginLeft: 8, color: 'red' }}>(Banned)</span>
                    ) : (
                      <button style={{ marginLeft: 8 }} onClick={() => openBanModal(userObj.uid, userObj.name || userObj.email || userObj.uid)}>
                        Ban
                      </button>
                    )}
                    {userObj.isAdmin ? (
                      <button style={{ marginLeft: 8 }} onClick={() => handleDemoteUser(userObj.uid)}>
                        Demote from Admin
                      </button>
                    ) : (
                      <button style={{ marginLeft: 8 }} onClick={() => handlePromoteUser(userObj.uid)}>
                        Promote to Admin
                      </button>
                    )}
                    {userObj.isAdmin && (
                      <span style={{ marginLeft: 8, color: 'blue' }}>(Admin)</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
