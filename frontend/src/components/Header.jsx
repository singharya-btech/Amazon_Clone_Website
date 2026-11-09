import React from "react";
import "./Header.css";
import { amazonLogo } from "../assets";
import { Link, useNavigate } from "react-router-dom";

import { FaSearch, FaMapMarkerAlt, FaShoppingCart } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { logoutUser } from "../services/authService";
import { useState, useEffect } from "react";
import LocationModal from "./LocationModal";
import LanguageModal from "./LanguageModal";

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [location, setLocation] = useState("India");
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState({ flag: "🇮🇳", code: "EN" });

  useEffect(() => {
    try {
      const l = localStorage.getItem("deliveryLocation");
      if (l) setLocation(l);
    } catch (e) {}
    try {
      const lang = JSON.parse(localStorage.getItem("language"));
      if (lang) setLanguage(lang);
    } catch (e) {}
  }, []);

  const saveLocation = (val) => {
    setLocation(val);
    try { localStorage.setItem("deliveryLocation", val); } catch (e) {}
  };

  const saveLanguage = (val) => {
    setLanguage(val);
    try { localStorage.setItem("language", JSON.stringify(val)); } catch (e) {}
  };

  const handleAuthClick = () => {
    if (user) {
      logoutUser();
      logout();
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="header">

      {/* Left Section */}
      <div className="header__left">
        <img
          src={amazonLogo}
          alt="Amazon Logo"
          className="header__logo"
        />

        <div className="header__location" onClick={() => setLocOpen(true)} style={{cursor: 'pointer'}}>
          <FaMapMarkerAlt className="location__icon" />
          <div>
            <span className="location__top">Deliver to</span>
            <span className="location__bottom">{location}</span>
          </div>
        </div>
      </div>

      <LocationModal open={locOpen} current={location} onClose={() => setLocOpen(false)} onSave={saveLocation} />

      {/* Search Bar */}
      <div className="header__search">

        <select className="search__category">
          <option>All</option>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Books</option>
          <option>Mobiles</option>
        </select>

        <input
          type="text"
          placeholder="Search Amazon"
          className="search__input"
        />

        <button className="search__button">
          <FaSearch />
        </button>

      </div>

      {/* Right Section */}
      <div className="header__right">

        <div className="header__option" onClick={handleAuthClick} style={{cursor: 'pointer'}}>
          <span>{user ? `Hello, ${[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}` : "Hello, Sign in"}</span>
          <strong>{user ? "Sign Out" : "Account & Lists"}</strong>
        </div>

        {user && (
          <Link to="/profile" className="header__option">
            <span>Your</span>
            <strong>Profile</strong>
          </Link>
        )}

        <Link to="/orders" className="header__option">
          <span className="optionTop">Returns</span>
          <strong className="optionBottom">& Orders</strong>
        </Link>

        <div className="header__option language" onClick={() => setLangOpen(true)} style={{cursor: 'pointer'}}>
          <span>{language.flag} {language.code}</span>
        </div>

        <LanguageModal open={langOpen} current={language} onClose={() => setLangOpen(false)} onSave={saveLanguage} />

        <Link to="/cart" className="header__cart">
          <FaShoppingCart className="cart__icon" />
          <span className="cart__count">{cartItems.reduce((s, i) => s + (i.quantity || 1), 0)}</span>
          <strong>Cart</strong>
        </Link>

      </div>

    </header>
  );
};

export default Header;