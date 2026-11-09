import React, { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Navbar.css";
import { FaBars, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Navbar = () => {
  const centerRef = useRef(null);
  const navigate = useNavigate();
  const [showArrows, setShowArrows] = useState(false);

  const items = [
    "Today's Deals",
    "Customer Service",
    "Gift Cards",
    "Sell",
    "Electronics",
    "Mobiles",
    "Fashion",
    "Books",
    "Home & Kitchen",
  ];

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;

    const check = () => setShowArrows(el.scrollWidth > el.clientWidth + 4);

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav className="navbar">

      {/* Left Section */}
      <div className="navbar__left">
        <div className="navbar__item">
          <FaBars />
          <span>All</span>
        </div>
      </div>

      {/* Center Section */}
      <div className="navbar__centerWrap">
        {showArrows && (
          <button className="navScrollBtn left" onClick={() => {
            const el = centerRef.current;
            if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
          }} aria-label="Scroll left"><FaChevronLeft /></button>
        )}

        <div className="navbar__center" ref={centerRef}>
          {items.map((it) => (
            <button
              key={it}
              className="navbar__item navLink"
              onClick={() => {
                if (it === "Sell") navigate("/seller/login");
                else if (it === "Customer Service") navigate("/help");
                else navigate(`/shop?category=${encodeURIComponent(it)}`);
              }}
            >
              {it}
            </button>
          ))}
        </div>

        {showArrows && (
          <button className="navScrollBtn right" onClick={() => {
            const el = centerRef.current;
            if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
          }} aria-label="Scroll right"><FaChevronRight /></button>
        )}
      </div>

      {/* Right Section */}
      <div className="navbar__right">

          <Link to="/admin/login" className="navbar__item" style={{marginLeft: 12}}>Admin</Link>
      </div>

    </nav>
  );
};

export default Navbar;