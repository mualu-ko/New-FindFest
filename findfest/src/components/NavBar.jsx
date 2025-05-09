import React, { useContext, useEffect, useCallback, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { EventContext } from "./EventContext";
import Searchbar from "./Searchbar";
import CategoryFilter from "./CategoryFilter";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { database } from "../config/firebase";
import "./Navbar.css";
import Categories from "../constants/Categories";
import { useFilter } from "./FilterContext.jsx";
const Navbar = ({ onSearch, onFilter, onDaysChange }) => {
    const { events } = useContext(EventContext);
    const navigate = useNavigate();
    const location = useLocation();

    const { selectedCategory, setSelectedCategory, selectedDays, setSelectedDays, searchQuery, setSearchQuery, resetFilters } = useFilter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return "U";
        const words = name.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();
        return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const userDocRef = doc(database, "users", currentUser.uid);
                    const userSnapshot = await getDoc(userDocRef);
                    if (userSnapshot.exists()) {
                        setProfileData(userSnapshot.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setProfileData(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        alert("Logged out successfully!");
    };

    const categories = Categories;
    useEffect(() => {


    }, [location.state, searchQuery, selectedDays, setSearchQuery, setSelectedDays, onSearch, onDaysChange]);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);
    const toggleFilters = useCallback(() => setFiltersVisible(prev => !prev), []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") closeSidebar();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [closeSidebar]);

    const handleFilterChange = (category) => {
        setSelectedCategory(category);
        onFilter(category);
    };

    const handleDaysChange = (days) => {
        setSelectedDays(days);
        // No navigation or router state update; just update context
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        onSearch(query);
        navigate("/", { state: { ...location.state, searchQuery: query } });
    };

    const clearAllFilters = () => {
        resetFilters();
        // No navigation or state update here; resetFilters already sets days to 0 (all events)
    };

    return (
        <div className="sidebar-container">
            <button 
                className={`menu-btn ${sidebarOpen ? "shift-right" : ""}`} 
                onClick={toggleSidebar} 
                aria-label="Toggle Sidebar"
            >
                {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            <div className={`overlay ${sidebarOpen ? "show" : ""}`} onClick={closeSidebar}></div>

            <nav className={`navbar ${sidebarOpen ? "open" : ""}`}>
                <div className="navbar-header">
                    <div className="logo">
                        <Link to="/" className="home-link" onClick={(e) => {
                             e.preventDefault();
                             clearAllFilters();
                             navigate("/");
                             closeSidebar();
                         }}>
                             FindFest
                         </Link>
                    </div>
                </div>

                <div className="searchbar-container">
                    <Searchbar onSearch={handleSearch} searchQuery={searchQuery} />
                </div>

                <button className="hide-filters-btn" onClick={toggleFilters}>
                    {filtersVisible ? "Hide Filters" : "Show Filters"}
                </button>

                {filtersVisible && (
                    <div className="filters-container">
                        <CategoryFilter 
                            categories={categories} 
                            onFilter={handleFilterChange} 
                            selectedCategory={selectedCategory}
                        />
                        <div className="date-filter">
                            <label>Show events in:</label>
                            <select onChange={(e) => handleDaysChange(Number(e.target.value))} value={selectedDays}>
                                <option value="0">All Events</option>
                                <option value="7">Next 7 days</option>
                                <option value="30">Next 30 days</option>
                                <option value="90">Next 90 days</option>
                                <option value="365">Next Year</option>
                            </select>
                        </div>
                        <div className="selected-filter">
                            Category: {selectedCategory} | Days: {selectedDays === 0 ? "All Events" : `Next ${selectedDays} Days`}
                        </div>
                        <button className="clear-filters-btn" onClick={clearAllFilters}>
                            Clear All Filters
                        </button>
                    </div>
                )}

                <div className="nav-links">
                    <Link to="/" onClick={(e) => {
                        e.preventDefault();
                        clearAllFilters();
                        navigate("/");
                        closeSidebar();
                    }}>
                        Home
                    </Link>
                    <Link to="/my-events" onClick={closeSidebar}>My Events</Link>
                    <Link to="/add-event" onClick={closeSidebar}>Add Event</Link>
                    <Link to="/about" onClick={closeSidebar}>About Us</Link>
                    <Link to="/contact" onClick={closeSidebar}>Contact Us</Link>
                </div>

                <div className="auth-section">
                    {user ? (
                        <>
                            <Link to="/my-account" onClick={closeSidebar} className="account-preview">
                                {profileData?.profilePic ? (
                                    <img 
                                        src={profileData.profilePic} 
                                        alt="Profile" 
                                        className="account-avatar" 
                                    />
                                ) : (
                                    <div className="initials-avatar">
                                        {getInitials(profileData?.name || user.displayName || "User")}
                                    </div>
                                )}
                                <span className="account-name">
                                    {profileData?.name || user.displayName || "My Account"}
                                </span>
                            </Link>
                            <button className="logout-btn" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <Link to="/sign-in" className="login-btn" onClick={closeSidebar}>
                            Login / Sign Up
                        </Link>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
