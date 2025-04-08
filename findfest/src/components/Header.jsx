import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Searchbar from "./Searchbar";
import "./Header.css";

const Header = ({ searchQuery, setSearchQuery, resetFilters }) => {
    const navigate = useNavigate();

    const handleSearch = (query) => {
        setSearchQuery(query);
        navigate("/", { state: { searchQuery: query } });
    };

    const handleFindFestClick = () => {
        resetFilters();
        navigate("/", { state: { searchQuery: "", selectedDays: 30, selectedCategory: "All" } });
    };

    return (
        <header className="page-header">
            <div className="header-container">
                <Link to="/" className="logo" onClick={handleFindFestClick}>FindFest</Link>
                <Searchbar searchQuery={searchQuery} onSearch={handleSearch} />
            </div>
        </header>
    );
};

export default Header;
