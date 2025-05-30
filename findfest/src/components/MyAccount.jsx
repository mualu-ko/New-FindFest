import { getAuth } from "firebase/auth";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios";
import CloudinaryUploadButton from "./ImageUpload";
import VenueSearchMap from "./MapCreate";
import AdminDashboard from "./AdminDashboard";
import "./MyAccount.css";

const MyAccount = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    profilePic: "",
    emailPublic: false,
    location: {
      venue: "",
      latitude: "",
      longitude: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const auth = getAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await axios.get(`/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data || {};
        setUser({
          name: data.name ?? "",
          email: data.email ?? "",
          profilePic: data.profilePic ?? "",
          emailPublic: data.emailPublic ?? false,
          location: data.location || { venue: "", latitude: "", longitude: "" },
          isAdmin: data.isAdmin ?? false,
        });
        console.log("[MyAccount] user.isAdmin:", data.isAdmin);
      } catch (err) {
        setError("Failed to fetch user profile.");
        console.error(err);
      }
    };

    fetchUserProfile();
  }, [auth]);

  const handleProfileUpdate = async (updatedProfile) => {
    setLoading(true);
    setSuccessMessage("");

    try {
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();

      await axios.put(`/api/user/profile`, { ...updatedProfile, emailPublic: user.emailPublic }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser((prev) => ({ ...prev, ...updatedProfile }));
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (imageUrl) => {
    handleProfileUpdate({ profilePic: imageUrl });
  };

  const handleLocationUpdate = (newLocation) => {
    const locationData = {
      venue: newLocation.venue,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
    };

    console.log("Updating location with the following data:", locationData);

    handleProfileUpdate({ location: locationData });
  };

  const handleUseCurrentLocation = () => {
    setLocationLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          await handleProfileUpdate({
            location: {
              latitude,
              longitude,
              venue: "Current Location",
            },
          });
        } catch (err) {
          console.error("Location update failed:", err);
          setError("Failed to update location.");
        }

        setLocationLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Could not retrieve location.");
        setLocationLoading(false);
      }
    );
  };

  // --- Admin Dashboard State and Logic ---
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
  }, [user.isAdmin, auth]);

  // Admin actions
  const handleDeleteEvent = async (eventId) => {
    try {
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
  const handleBanUser = async (uid) => {
    try {
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();
      await axios.post(`/api/admin/ban/${uid}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, banned: true } : u));
    } catch (err) {
      alert("Failed to ban user");
    }
  };

  return (
    <div className="my-account">
      {/* Admin Dashboard (above My Account) */}
      {user.isAdmin && <AdminDashboard user={user} />}

      <h2>My Account</h2>

      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}

      <div className="profile-info">
        <img
          src={user.profilePic || "default-profile-pic.png"}
          alt="Profile"
          className="profile-pic"
        />
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <label style={{ display: 'block', marginTop: '8px' }}>
            <input
              type="checkbox"
              checked={user.emailPublic}
              onChange={e => setUser(prev => ({ ...prev, emailPublic: e.target.checked }))}
            />
            Show my email on my public profile
          </label>
          {/* Button/link to User Profile page */}
          {auth.currentUser && (
            <Link to={`/user/${auth.currentUser.uid}`} className="view-profile-link">
              View Public Profile
            </Link>
          )}
        </div>
      </div>

      <div className="profile-update">
        <h3>Update Profile</h3>
        <input
          type="text"
          placeholder="Update name"
          value={user.name}
          onChange={(e) =>
            setUser((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <CloudinaryUploadButton
          onUpload={handleImageUpload}
          folder="profile_pics"
          label="Upload New Profile Picture"
        />
        <button onClick={() => handleProfileUpdate(user)} disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </div>

      <div className="location-update">
        <h3>Update Location</h3>
        <VenueSearchMap
          eventData={user.location}
          setEventData={handleLocationUpdate}
        />
        <button
          onClick={handleUseCurrentLocation}
          disabled={locationLoading}
          style={{ marginTop: "10px" }}
        >
          {locationLoading ? "Getting location..." : "📍 Use Current Location"}
        </button>
        <button onClick={() => handleProfileUpdate(user)} disabled={loading}>
          {loading ? "Updating..." : "Update Location"}
        </button>
      </div>

      
    </div>
  );
};

export default MyAccount;
