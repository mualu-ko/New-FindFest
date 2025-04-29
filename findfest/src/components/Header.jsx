import { Link, useNavigate } from "react-router-dom";
import Searchbar from "./Searchbar";
import "./Header.css";
import { useFilter } from "./FilterContext.jsx";

const Header = () => {
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery, resetFilters } = useFilter();

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
                <span className="logo" style={{cursor: 'pointer'}} onClick={handleFindFestClick}>FindFest</span>
                <Searchbar searchQuery={searchQuery} onSearch={handleSearch} />
            </div>
        </header>
    );
};

export default Header;
