import { useFilter } from "./FilterContext.jsx";

const CategoryFilter = ({ categories }) => {
    const { selectedCategory, setSelectedCategory } = useFilter();
    return (
        <div className="category-filters">
            {["All", ...categories].map((category) => (
                <button
                    key={category}
                    className={`category-button ${selectedCategory === category ? "active" : ""}`}
                    onClick={() => setSelectedCategory(category)}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
