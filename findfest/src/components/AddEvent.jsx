import React, { useState, useEffect } from "react";
import axios from "axios";
import CloudinaryUploadButton from "./ImageUpload"; // Cloudinary upload component
import VenueSearchMap from "./MapCreate";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./AddEvent.css";
import Categories from "../constants/Categories";
const AddEvent = () => {
    const [eventData, setEventData] = useState({
        name: "",
        date: "",
        description: "",
        venue: "",
        categories: [],
        imageUrl: null,
        latitude: null,
        longitude: null,
        price: "",      // Ticket price
        createdBy: "", // Placeholder for the creator's UID
    });

    const [showModal, setShowModal] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null); // State to hold the current user

    const availableCategories = Categories;

    // Firebase Auth listener to get the current user
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user); // Store the current user in state
                setEventData((prevState) => ({
                    ...prevState,
                    createdBy: user.uid, // Set createdBy to the user's UID
                }));
            } else {
                setCurrentUser(null);
            }
        });

        return () => unsubscribe(); // Clean up the listener on unmount
    }, []);

    const handleChange = (e) => {
        setEventData({
            ...eventData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        const selected = eventData.categories;

        if (selected.includes(value)) {
            setEventData({
                ...eventData,
                categories: selected.filter((cat) => cat !== value),
            });
        } else {
            if (selected.length < 3) {
                setEventData({
                    ...eventData,
                    categories: [...selected, value],
                });
            } else {
                alert("You can select up to 3 categories only.");
            }
        }
    };

    // Handle the image upload callback
    const handleImageUpload = (url) => {
        setEventData({
            ...eventData,
            imageUrl: url, // Store the URL of the uploaded image
        });
    };

    // Validate date (ensure it's not in the past)
    const isValidDate = (date) => {
        const today = new Date();
        const inputDate = new Date(date);
        return inputDate >= today;
    };

    const formatDateForBackend = (date) => {
        const d = new Date(date);
        return d.toISOString().split("T")[0]; // Return the date in YYYY-MM-DD format
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation checks before submission
        if (!eventData.imageUrl) {
            setErrorMessage("Please upload an image before submitting.");
            return;
        }
        if (eventData.categories.length === 0) {
            setErrorMessage("Please select at least one category.");
            return;
        }
        if (!eventData.date) {
            setErrorMessage("Please select a date for the event.");
            return;
        }
        if (!isValidDate(eventData.date)) {
            setErrorMessage("The event date cannot be in the past.");
            return;
        }

        // Format the date before submitting
        const formattedDate = formatDateForBackend(eventData.date);

        setErrorMessage(""); // Clear any previous error message
        setShowModal(true); // Show modal instead of immediate submit
        setEventData({
            ...eventData,
            date: formattedDate, // Set the formatted date in the eventData state
        });
    };

    const confirmSubmit = async () => {
        setShowModal(false);

        try {
            // Always set createdBy to currentUser.uid at submit time
            const dataToSend = { ...eventData, createdBy: currentUser?.uid };
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/events`, dataToSend);

            alert("🎉 Event added successfully!");
            setIsSuccess(true); // Show success screen

            setEventData({
                name: "",
                date: "",
                description: "",
                venue: "",
                categories: [],
                imageUrl: null, // Reset the imageUrl field
                latitude: null,
                longitude: null,
                price: "",      // Ticket price
                createdBy: "", // Reset createdBy field
            });
            setErrorMessage(""); // Reset error message after successful submission
        } catch (error) {
            console.error("Error submitting event:", error);
            if (error.response && error.response.data) {
                setErrorMessage(error.response.data.message || "An error occurred while submitting the event.");
            } else {
                setErrorMessage("Error submitting event. Please try again.");
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="success-screen">
                <h2>Event Added Successfully!</h2>
                <p>Your event has been successfully added to the system.</p>
                <button onClick={() => setIsSuccess(false)} className="back-btn">
                    Add Another Event
                </button>
            </div>
        );
    }

    if (!currentUser) {
        return <div>Please log in to add an event.</div>; // Handle case when the user is not logged in
    }

    return (
        <div className="add-event-container">
            <h2>Add a New Event</h2>
            <form onSubmit={handleSubmit} className="add-event-form">
                <label>Event Name:</label>
                <input
                    type="text"
                    name="name"
                    value={eventData.name}
                    onChange={handleChange}
                    required
                />

                <label>Date:</label>
                <input
                    type="date"
                    name="date"
                    value={eventData.date}
                    onChange={handleChange}
                    required
                />

                <label>Description:</label>
                <textarea
                    name="description"
                    value={eventData.description}
                    onChange={handleChange}
                    required
                />

                <label>Venue (selected from map):</label>
                <input
                    type="text"
                    name="venue"
                    value={eventData.venue}
                    readOnly
                />

                <label>Venue:</label>
                <input
                    type="text"
                    name="venue"
                    value={eventData.venue}
                    onChange={handleChange}
                    required
                />

                <label>Ticket Price (KES):</label>
                <input
                    type="number"
                    name="price"
                    value={eventData.price}
                    onChange={handleChange}
                    step="0.01"
                    required
                />

                <label>Select up to 3 Categories (at least 1 required):</label>
                <div className="category-checkboxes">
                    {availableCategories.map((category, index) => (
                        <label key={index}>
                            <input
                                type="checkbox"
                                value={category}
                                checked={eventData.categories.includes(category)}
                                onChange={handleCategoryChange}
                            />
                            {category}
                        </label>
                    ))}
                </div>

                <label>Upload Event Image:</label>
                <CloudinaryUploadButton
                    onUpload={handleImageUpload}  // Callback to handle uploaded image URL
                    folder="event_images"  // Event-specific folder in Cloudinary
                    label="Upload Event Image"
                />

                <button
                    type="submit"
                    disabled={!eventData.imageUrl}
                    className={`submit-btn ${!eventData.imageUrl ? "disabled" : ""}`}
                >
                    Add Event
                </button>

                {/* Display Error Message */}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </form>

            <div className="map-section">
                <h3>Select Venue Location on Map:</h3>
                <VenueSearchMap eventData={eventData} setEventData={setEventData} />
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Confirm Event Submission</h3>
                        <p>Are you sure you want to add this event?</p>
                        <div className="modal-actions">
                            <button onClick={confirmSubmit}>Yes, Submit</button>
                            <button onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddEvent;
