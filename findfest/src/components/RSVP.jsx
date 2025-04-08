import { useState, useEffect } from "react";
import { auth, database } from "../config/firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import "./RSVP.css";

const RSVP = ({ event = {} }) => {
    const [isRSVP, setIsRSVP] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser) checkRSVPStatus(currentUser.uid);
        });
        return () => unsubscribe();
    }, []);

    const checkRSVPStatus = async (userId) => {
        if (!event.id) return;
        const rsvpRef = doc(database, "rsvps", `${userId}_${event.id}`);
        const rsvpSnap = await getDoc(rsvpRef);
        setIsRSVP(rsvpSnap.exists());
    };

    const handleRSVP = async () => {
        if (!user) {
            alert("You need to be signed in to RSVP!");
            return;
        }
        const rsvpRef = doc(database, "rsvps", `${user.uid}_${event.id}`);
        if (isRSVP) {
            await deleteDoc(rsvpRef);
        } else {
            await setDoc(rsvpRef, {
                userId: user.uid,
                eventId: event.id,
                eventName: event.name,
                timestamp: new Date(),
            });
        }
        setIsRSVP(!isRSVP);
        setShowPopup(false);
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
