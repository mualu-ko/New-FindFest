import { useState } from "react";

const AddEvent = () => {
    const [eventData, setEventData] = useState({
        name: "",
        date: "",
        description: "",
        venue: "",
        category: "", // ✅ New category field
        image: null,
        imagePreview: null,
    });

    const handleChange = (e) => {
        setEventData({
            ...eventData,
            [e.target.name]: e.target.value,
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setEventData({
                ...eventData,
                image: file,
                imagePreview: imageUrl,
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Event Data Submitted:", eventData);
        alert("Event added successfully!");
    };

    return (
        <div className="add-event-container">
            <h2>Add a New Event</h2>
            <form onSubmit={handleSubmit} className="add-event-form">
                <label>Event Name:</label>
                <input type="text" name="name" value={eventData.name} onChange={handleChange} required />

                <label>Date:</label>
                <input type="date" name="date" value={eventData.date} onChange={handleChange} required />

                <label>Description:</label>
                <textarea name="description" value={eventData.description} onChange={handleChange} required />

                <label>Venue:</label>
                <input type="text" name="venue" value={eventData.venue} onChange={handleChange} required />

                {/* ✅ Category Dropdown */}
                <label>Category:</label>
                <select name="category" value={eventData.category} onChange={handleChange} required>
                    <option value="">Select a category</option>
                    <option value="Tech">Tech</option>
                    <option value="Music">Music</option>
                    <option value="Food">Food</option>
                    <option value="Sports">Sports</option>
                    <option value="Education">Education</option>
                </select>

                <label>Upload Event Image:</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />

                {eventData.imagePreview && (
                    <div className="image-preview">
                        <p>Image Preview:</p>
                        <img src={eventData.imagePreview} alt="Event Preview" />
                    </div>
                )}

                <button type="submit">Add Event</button>
            </form>
        </div>
    );
};

export default AddEvent;
