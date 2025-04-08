import { Link } from "react-router-dom";
import "./Footer.css";
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-links">
                <Link to="/About">About Us</Link>
                <Link to="/Contact">Contact Us</Link>
            </div>
            <p className="copyright">© 2025 FindFest. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
