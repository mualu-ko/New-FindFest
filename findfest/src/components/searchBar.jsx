import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Searchbar.css";

const Searchbar = ({ onSearch, searchQuery }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [inputValue, setInputValue] = useState(searchQuery || "");

    // ✅ Sync input with external searchQuery changes (ONLY when it actually changes)
    useEffect(() => {
        if (searchQuery !== undefined && searchQuery !== inputValue) {
            setInputValue(searchQuery);
            console.log("Search Query Updated:", searchQuery);
        }
    }, [searchQuery]);

    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSearch = () => {
        const trimmedQuery = inputValue.trim();

        if (typeof onSearch === "function") {
            onSearch(trimmedQuery);
        }

        if (location.pathname !== "/") {
            navigate("/", { state: { ...location.state, searchQuery: trimmedQuery } });
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
                value={inputValue}
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
