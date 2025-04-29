import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./Navbar";
import Header from "./Header"; 
import Footer from "./Footer";
import { FilterProvider, useFilter } from "./FilterContext.jsx";

const LayoutInner = ({ user }) => {
    const { selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, selectedDays, setSelectedDays, resetFilters } = useFilter();
    const navigate = useNavigate();

    const handleSearch = (query) => {
        setSearchQuery(query);
        navigate("/", { state: { searchQuery: query, selectedCategory, daysFilter: selectedDays } });
    };

    const handleResetFilters = () => {
        resetFilters();
        navigate("/", { state: { searchQuery: "", selectedCategory: "All", daysFilter: 30 } });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Navbar onSearch={handleSearch} onFilter={setSelectedCategory} onDaysChange={setSelectedDays} />
            <Header searchQuery={searchQuery} setSearchQuery={handleSearch} resetFilters={handleResetFilters} />
            <main className="flex-grow container mx-auto px-4 py-6">
                <Outlet context={{ selectedCategory, searchQuery, daysFilter: selectedDays, setSelectedCategory }} />
            </main>
            <Footer />
        </div>
    );
};

export default LayoutInner;
