import React from "react";
import Auth from "./auth"; // ✅ Import Auth component
import "./SignIn.css";
const SignIn = () => {
    return (
        <div className="auth-container">
            <Auth /> {/* ✅ Render Auth Component */}
        </div>
    );
};

export default SignIn;
