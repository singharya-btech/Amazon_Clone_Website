import React from "react";
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
          <a href="#">Amazon Science</a>
        </div>

        <div className="footer__column">
          <h3>Connect with Us</h3>
          <a href="#">Facebook</a>
          <a href="#">Twitter</a>
          <a href="#">Instagram</a>
        </div>

        <div className="footer__column">
          <h3>Make Money with Us</h3>
          <a href="#">Sell on Amazon</a>
          <a href="#">Become an Affiliate</a>
          <a href="#">Advertise Your Products</a>
          <a href="#">Amazon Pay</a>
        </div>

        <div className="footer__column">
          <h3>Let Us Help You</h3>
          <a href="#">Your Account</a>
          <a href="#">Returns Centre</a>
          <a href="#">100% Purchase Protection</a>
          <a href="#">Help</a>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="footer__bottom">
        <p>© 2025 Amazon Clone | Built with React.js</p>
      </div>
    </footer>
  );
};

export default Footer;