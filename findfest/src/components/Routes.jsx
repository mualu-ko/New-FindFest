import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "../config/firebase";
import Auth from "./auth";
import Layout from "./Layout";
import Home from "./Home";
import MyEvents from "./MyEvents";
import AddEvent from "./AddEvent";
import EventPage from "./EventPage";
import AboutUs from "./About";
import ContactUs from "./Contact";
import SignIn from "./SignIn"; // 🔥 New Sign-In Page
import EventProvider from "./EventContext";

const ProtectedRoute = ({ user, children }) => {
    return user ? children : <Navigate to="/sign-in" replace />;
};

const AppRoutes = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    const clearAllFilters = () => {
        setSearchQuery("");
    };

    return (
        <EventProvider>
            <Routes>
                <Route
                    path="/"
                    element={<Layout searchQuery={searchQuery} setSearchQuery={setSearchQuery} clearAllFilters={clearAllFilters} user={user} />}
                >
                    <Route index element={<Home searchQuery={searchQuery} />} />
                    <Route path="event/:id" element={<EventPage />} />
                    <Route path="about" element={<AboutUs />} />
                    <Route path="contact" element={<ContactUs />} />
                    
                    {/* 🔒 Protected Routes */}
                    <Route path="my-events" element={<ProtectedRoute user={user}><MyEvents /></ProtectedRoute>} />
                    <Route path="add-event" element={<ProtectedRoute user={user}><AddEvent /></ProtectedRoute>} />
                    
                    {/* 🔥 Sign-In Route */}
                    <Route path="sign-in" element={<SignIn />} />
                </Route>
                <Route path="*" element={<Home searchQuery={searchQuery} />} />
            </Routes>
        </EventProvider>
    );
};

export default AppRoutes;
