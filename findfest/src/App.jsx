import AppRoutes from "./components/Routes";
import "./App.css";
import "leaflet/dist/leaflet.css"
import { FilterProvider } from "./components/FilterContext.jsx";

const App = () => {
    return (
        <FilterProvider>
            <AppRoutes />
        </FilterProvider>
    );
};

export default App;

