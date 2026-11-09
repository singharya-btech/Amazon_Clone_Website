import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="footer">
      {/* Back to Top */}
      <div className="footer__top" onClick={scrollToTop}>
        Back to top
      </div>

      {/* Footer Links */}
      <div className="footer__links">
        <div className="footer__column">
          <h3>Get to Know Us</h3>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Press Releases</a>
          <a href="#">Amazon Clone Journal</a>
        </div>

        <div className="footer__column">
          <h3>Connect with Us</h3>
          <a href="#">Facebook</a>
          <a href="#">Twitter</a>
          <a href="#">Instagram</a>
        </div>

        <div className="footer__column">
          <h3>Make Money with Us</h3>
          <Link to="/seller/login">Sell on Amazon Clone</Link>
          <a href="#">Become an Affiliate</a>
          <a href="#">Advertise Your Products</a>
          <a href="#">Amazon Clone Pay</a>
        </div>

        <div className="footer__column">
          <h3>Let Us Help You</h3>
          <Link to="/orders">Your Account &amp; Orders</Link>
          <Link to="/orders">Returns Centre</Link>
          <a href="#">100% Purchase Protection</a>
          <Link to="/help">Help &amp; Support</Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="footer__bottom">
        <p>© 2026 Amazon Clone | Built with React &amp; Django</p>
      </div>
    </footer>
  );
};

export default Footer;