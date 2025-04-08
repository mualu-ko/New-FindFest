const CategoryFilter = ({ categories, onFilter, selectedCategory }) => {
    return (
        <div className="category-filters">
            {["All", ...categories].map((category) => (
                <button
                    key={category}
                    className={`category-button ${selectedCategory === category ? "active" : ""}`}
                    onClick={() => onFilter(category)}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
