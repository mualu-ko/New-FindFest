import { useState, useContext, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { EventContext } from "./EventContext";
import Searchbar from "./Searchbar";
import CategoryFilter from "./CategoryFilter";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./Navbar.css";

const Navbar = ({ onSearch, onFilter, onDaysChange }) => {
    const { events } = useContext(EventContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedDays, setSelectedDays] = useState(location.state?.selectedDays ?? 30);
    const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery ?? "");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        alert("Logged out successfully!");
    };

    const categories = [...new Set(events.flatMap(event => event.categories || []))];

    useEffect(() => {
        if (location.state?.searchQuery !== undefined && location.state.searchQuery !== searchQuery) {
            setSearchQuery(location.state.searchQuery);
            onSearch(location.state.searchQuery);
        }
        if (location.state?.selectedDays !== undefined && location.state.selectedDays !== selectedDays) {
            setSelectedDays(location.state.selectedDays);
            onDaysChange(location.state.selectedDays);
        }
    }, [location.state]);

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
        onDaysChange(days);
        navigate("/", { state: { ...location.state, selectedDays: days } });
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        onSearch(query);
        navigate("/", { state: { ...location.state, searchQuery: query } });
    };

    const clearAllFilters = () => {
        setSelectedCategory("All");
        setSelectedDays(0);
        setSearchQuery("");
        onFilter("All");
        onDaysChange(0);
        onSearch("");
        navigate("/", { state: { searchQuery: "", selectedDays: 0, selectedCategory: "All" } });
    };

    return (
        <div className="sidebar-container">
            {/* ✅ Toggle Menu Button */}
            <button 
                className={`menu-btn ${sidebarOpen ? "shift-right" : ""}`} 
                onClick={toggleSidebar} 
                aria-label="Toggle Sidebar"
            >
                {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* ✅ Overlay */}
            <div className={`overlay ${sidebarOpen ? "show" : ""}`} onClick={closeSidebar}></div>

            {/* ✅ Sidebar */}
            <nav className={`navbar ${sidebarOpen ? "open" : ""}`}>
                <div className="navbar-header">
                    <div className="logo">
                        <Link to="/" className="home-link" onClick={(e) => {
                            e.preventDefault(); 
                            clearAllFilters();
                        }}>
                            FindFest
                        </Link>
                    </div>
                </div>

                {/* ✅ Search Bar */}
                <div className="searchbar-container">
                    <Searchbar onSearch={handleSearch} searchQuery={searchQuery} />
                </div>

                {/* ✅ Show/Hide Filters Button */}
                <button className="hide-filters-btn" onClick={toggleFilters}>
                    {filtersVisible ? "Hide Filters" : "Show Filters"}
                </button>

                {/* ✅ Filters */}
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

                {/* ✅ Navigation Links */}
                <div className="nav-links">
                    <Link to="/" onClick={(e) => {
                        e.preventDefault();
                        clearAllFilters();
                    }}>
                        Home
                    </Link>
                    <Link to="/my-events" onClick={closeSidebar}>My Events</Link>
                    <Link to="/add-event" onClick={closeSidebar}>Add Event</Link>
                    <Link to="/about" onClick={closeSidebar}>About Us</Link>
                    <Link to="/contact" onClick={closeSidebar}>Contact Us</Link>
                </div>

                {/* ✅ Auth Buttons */}
                <div className="auth-section">
                    {user ? (
                        <>
                            <span>Welcome, {user.displayName || "User"}!</span>
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
