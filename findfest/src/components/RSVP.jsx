import { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import api from "../utils/axios";
import "./RSVP.css";

const RSVP = ({ event = {} }) => {
    const [isRSVP, setIsRSVP] = useState(false);
    const [rsvpCount, setRsvpCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser && event.id) {
                checkRSVPStatus(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [event]);

    useEffect(() => {
        if (event.id) fetchRSVPCount();
    }, [event]);

    const checkRSVPStatus = async (userId) => {
        try {
            const response = await api.get("/api/events/rsvp/check", {
                params: { userId, eventId: event.id }
            });

            if (!response.data.isRSVPed) {
                // RSVP doesn't exist, create with default status (backend handles it)
                await api.post("/api/events/rsvp", {
                    userId: userId,
                    event: {
                        id: event.id,
                        name: event.name
                    }
                });
            }

            setIsRSVP(response.data.isRSVPed);
        } catch (error) {
            console.error("Error checking RSVP status:", error);
        }
    };

    const fetchRSVPCount = async () => {
        try {
            const response = await api.get(`/api/events/rsvp/count/${event.id}`);
            setRsvpCount(response.data.count || 0);
        } catch (error) {
            console.error("Error fetching RSVP count:", error);
        }
    };

    const handleRSVP = async () => {
        if (!user) {
            alert("You need to be signed in to RSVP!");
            return;
        }

        try {
            if (isRSVP) {
                // Cancel RSVP
                await api.post("/api/events/rsvp/cancel", {
                    userId: user.uid,
                    eventId: event.id
                });
                setIsRSVP(false);
                setRsvpCount(prevCount => prevCount - 1); // Decrease the count when cancelled
            } else {
                // Confirm RSVP
                await api.post("/api/events/rsvp", {
                    userId: user.uid,
                    event: {
                        id: event.id,
                        name: event.name
                    }
                });
                
                // Update RSVP status to true
                await api.post("/api/events/rsvp/update", {
                    userId: user.uid,
                    eventId: event.id,
                    status: true  // Set the status to true when RSVPed
                });

                setIsRSVP(true);
                setRsvpCount(prevCount => prevCount + 1); // Increase the count when RSVPed
            }

            setShowPopup(false);
        } catch (error) {
            console.error("Error handling RSVP:", error);
        }
    };

    const getGoogleCalendarLink = () => {
        if (!event.date) return "#";

        const startDate = event.date.replace(/-/g, "");
        const endDate = startDate;
        const startTime = "1000"; // 10:00 AM
        const endTime = "1200"; // 12:00 PM
        const title = encodeURIComponent(event.name || "Event");
        const details = encodeURIComponent(event.description || "");
        const location = encodeURIComponent(event.location || "");

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}T${startTime}00/${endDate}T${endTime}00&details=${details}&location=${location}&sf=true&output=xml`;
    };

    return (
        <div>
            <button
                className={`rsvp-btn ${isRSVP ? "rsvp-cancel" : ""}`}
                onClick={() => setShowPopup(true)}
            >
                {isRSVP ? "Cancel RSVP ❌" : "RSVP ✅"}
            </button>

            <p className="rsvp-count">✅ {rsvpCount} people have RSVP'd</p>

            {showPopup && (
                <div className="popup-overlay" tabIndex="0">
                    <div className="popup-content">
                        <button className="popup-close-btn" onClick={() => setShowPopup(false)} aria-label="Close">
                            ✖
                        </button>

                        <h2>{isRSVP ? "Cancel Your RSVP?" : "Confirm Your RSVP"}</h2>
                        <p>{isRSVP ? "Are you sure you want to cancel your RSVP?" : "Would you like to add this event to your Google Calendar?"}</p>

                        <div className="popup-buttons">
                            {!isRSVP ? (
                                <>
                                    <button className="calendar-btn" onClick={() => window.open(getGoogleCalendarLink(), "_blank")}>
                                        📅 Add to Google Calendar
                                    </button>
                                    <button className="rsvp-confirm-btn" onClick={handleRSVP}>✅ Confirm RSVP</button>
                                </>
                            ) : (
                                <button className="cancel-btn" onClick={handleRSVP}>❌ Yes, Cancel</button>
                            )}
                            <button className="close-btn" onClick={() => setShowPopup(false)}>❌ Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSVP;
