import { useNavigate, useLocation } from "react-router-dom";
import "./Searchbar.css";
import { useFilter } from "./FilterContext.jsx";

const Searchbar = () => {
    const { searchQuery, setSearchQuery } = useFilter();
    const navigate = useNavigate();
    const location = useLocation();
    const handleChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearch = () => {
        // Optional: re-trigger navigation to "/" if not already there
        if (location.pathname !== "/") {
            navigate("/", { state: { ...location.state, searchQuery } });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="search-container">
            <input
                type="text"
                value={searchQuery}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Search events..."
                className="search-input"
            />
            <button className="search-button" onClick={handleSearch}>
                🔍
            </button>
        </div>
    );
};

export default Searchbar;
