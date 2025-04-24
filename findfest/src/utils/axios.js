import axios from "axios";

// Create an axios instance with the baseURL and headers
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,  // Use import.meta.env for environment variables in Vite
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
