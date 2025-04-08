import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./Navbar";
import Header from "./Header"; 
import Footer from "./Footer";

const Layout = ({ searchQuery: initialSearchQuery, setSearchQuery: parentSetSearchQuery, clearAllFilters, user }) => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
    const [daysFilter, setDaysFilter] = useState(0);

    const navigate = useNavigate();

    const handleSearch = (query) => {
        setSearchQuery(query);
        parentSetSearchQuery(query);
        navigate("/", { state: { searchQuery: query, selectedCategory, daysFilter } });
    };

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setDaysFilter(0);
        clearAllFilters();
        navigate("/", { state: { searchQuery: "", selectedCategory: "All", daysFilter: 0 } });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Navbar onSearch={handleSearch} onFilter={setSelectedCategory} onDaysChange={setDaysFilter} />
            <Header searchQuery={searchQuery} setSearchQuery={handleSearch} resetFilters={resetFilters} />
            <main className="flex-grow container mx-auto px-4 py-6">
                <Outlet context={{ selectedCategory, searchQuery, daysFilter, setSelectedCategory }} />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
