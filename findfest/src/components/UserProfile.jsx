import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { auth } from "../config/firebase";
import api from "../utils/axios";
import {
  followUser,
  unfollowUser,
  checkIfFollowing,
  getFollowers,
  getFollowing,
} from "./FollowService";
import "./UserProfile.css";

// Utility to convert Firestore Timestamp to readable string
function formatDate(ts) {
  if (!ts) return "";
  if (typeof ts === "object" && "_seconds" in ts) {
    return new Date(ts._seconds * 1000).toLocaleDateString();
  }
  return ts.toString();
}

const UserProfile = () => {
  const { uid } = useParams();
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [mutualEvents, setMutualEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUid(user.uid);
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || "You",
          profilePic: user.photoURL || "",
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/user/${uid}`);
        setUser(res.data);

        const [status, followersData, followingData] = await Promise.all([
          currentUid ? checkIfFollowing(currentUid, uid) : null,
          getFollowers(uid),
          getFollowing(uid),
        ]);

        setIsFollowing(status?.data?.isFollowing);
        setFollowers(followersData?.data?.followers || []);
        setFollowing(followingData?.data?.following || []);

        const createdEventsRes = await api.get(`/api/events/created/${uid}`);
        setUserEvents(createdEventsRes.data || []);

        if (currentUid && currentUid !== uid) {
          const [currentRSVPs, targetRSVPs] = await Promise.all([
            api.get(`/api/events/rsvp/${currentUid}`),
            api.get(`/api/events/rsvp/${uid}`),
          ]);

          const currentIds = new Set(currentRSVPs.data.map((e) => e.id));
          const mutual = targetRSVPs.data.filter((e) =>
            currentIds.has(e.id)
          );
          setMutualEvents(mutual);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    if (uid) fetchProfile();
  }, [uid, currentUid]);

  const handleFollowToggle = async () => {
    if (!currentUid || currentUid === uid) return;

    try {
      if (isFollowing) {
        setIsFollowing(false);
        setFollowers((prev) => prev.filter((f) => f.uid !== currentUid));
        await unfollowUser(currentUid, uid);
      } else {
        setIsFollowing(true);
        setFollowers((prev) => [
          ...prev,
          {
            uid: currentUid,
            name: currentUser?.name || "You",
            profilePic: currentUser?.profilePic || "",
          },
        ]);
        await followUser(currentUid, uid);
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="user-profile-page">
      <img
        src={user.profilePic}
        alt="Profile"
        className="profile-image"
      />
      <h2>{user.name}</h2>
      {user.emailPublic && <p>{user.email}</p>}

      <p>
        <strong>{user.followersCount ?? followers.length}</strong> followers ·{" "}
        <strong>{user.followingCount ?? following.length}</strong> following
      </p>

      {currentUid && currentUid !== uid && (
        <button onClick={handleFollowToggle}>
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      )}

      <h3>Followers</h3>
      <ul>
        {followers.map((f) => (
          <li key={typeof f === 'string' ? f : f.uid}>
            <Link to={`/user/${typeof f === 'string' ? f : f.uid}`}>
              {typeof f === 'string' ? f : f.name}
            </Link>
          </li>
        ))}
      </ul>

      <h3>Following</h3>
      <ul>
        {following.map((f) => (
          <li key={typeof f === 'string' ? f : f.uid}>
            <Link to={`/user/${typeof f === 'string' ? f : f.uid}`}>
              {typeof f === 'string' ? f : f.name}
            </Link>
          </li>
        ))}
      </ul>

      <hr />
      <h3>Events Created by {user.name}</h3>
      <ul className="event-list">
        {userEvents.length > 0 ? (
          userEvents.map((event) => (
            <li key={event.id} className="event-card">
              <a href={`/event/${event.id}`}>
                <h4>{event.name}</h4>
                <p>{formatDate(event.date)}</p>
              </a>
            </li>
          ))
        ) : (
          <p>No events created yet.</p>
        )}
      </ul>

      {currentUid && currentUid !== uid && (
        <>
          <hr />
          <h3>Mutual Events</h3>
          <ul className="event-list">
            {mutualEvents.length > 0 ? (
              mutualEvents.map((event) => (
                <li key={event.id} className="event-card">
                  <a href={`/event/${event.id}`}>
                    <h4>{event.name}</h4>
                    <p>{formatDate(event.date)}</p>
                  </a>
                </li>
              ))
            ) : (
              <p>No mutual events found.</p>
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default UserProfile;
