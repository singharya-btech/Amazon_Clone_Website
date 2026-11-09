import React from "react";
import "./Header.css";
import { amazonLogoWhite as amazonLogo } from "../assets";
import { Link, useNavigate } from "react-router-dom";

import { FaSearch, FaMapMarkerAlt, FaShoppingCart, FaStore } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { logoutUser } from "../services/authService";
import { useState, useEffect, useRef } from "react";
import LocationModal from "./LocationModal";
import LanguageModal from "./LanguageModal";
import { getSearchSuggestions } from "../mock/marketplace";

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [location, setLocation] = useState("India");
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState({ flag: "🇮🇳", code: "EN" });
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ matches: [], related: [], relatedCategory: null });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);

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

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions({ matches: [], related: [], relatedCategory: null });
      return;
    }
    let cancelled = false;
    getSearchSuggestions(query).then((result) => {
      if (!cancelled) setSuggestions(result);
    });
    return () => { cancelled = true; };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToSearch = (term) => {
    setShowSuggestions(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) goToSearch(query.trim());
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
          alt="Amazon Clone Logo"
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
      <form className="header__search" ref={searchWrapRef} onSubmit={handleSearchSubmit}>

        <select className="search__category">
          <option>All</option>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Books</option>
          <option>Mobiles</option>
        </select>

        <input
          type="text"
          placeholder="Search Amazon Clone"
          className="search__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />

        <button className="search__button" type="submit">
          <FaSearch />
        </button>

        {showSuggestions && query.trim() && (suggestions.matches.length > 0 || suggestions.related.length > 0) && (
          <div className="search__suggestions">
            {suggestions.matches.length > 0 && (
              <div className="search__suggestions-group">
                <div className="search__suggestions-label">Products</div>
                {suggestions.matches.map((p) => (
                  <button
                    type="button"
                    key={`m-${p.id}`}
                    className="search__suggestion-item"
                    onClick={() => goToSearch(p.title)}
                  >
                    {p.image && <img src={p.image} alt="" />}
                    <span>{p.title}</span>
                    <span className="search__suggestion-price">₹{p.price}</span>
                  </button>
                ))}
              </div>
            )}
            {suggestions.related.length > 0 && (
              <div className="search__suggestions-group">
                <div className="search__suggestions-label">
                  {suggestions.matches.length > 0
                    ? `More in ${suggestions.relatedCategory}`
                    : `Did you mean: ${suggestions.relatedCategory}`}
                </div>
                {suggestions.related.map((p) => (
                  <button
                    type="button"
                    key={`r-${p.id}`}
                    className="search__suggestion-item"
                    onClick={() => goToSearch(p.title)}
                  >
                    {p.image && <img src={p.image} alt="" />}
                    <span>{p.title}</span>
                    <span className="search__suggestion-price">₹{p.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </form>

      {/* Right Section */}
      <div className="header__right">

        <div className="header__option" onClick={handleAuthClick} style={{cursor: 'pointer'}}>
          <span>{user ? `Hello, ${user.fullName || user.email}` : "Hello, Sign in"}</span>
          <strong>{user ? "Sign Out" : "Account & Lists"}</strong>
        </div>

        <Link to="/orders" className="header__option">
          <span className="optionTop">Returns</span>
          <strong className="optionBottom">& Orders</strong>
        </Link>

        <Link to="/help" className="header__option">
          <span className="optionTop">Help &amp; Support</span>
          <strong className="optionBottom">Contact Us</strong>
        </Link>

        <Link to="/seller/login" className="header__option header__sell">
          <span className="optionTop"><FaStore /></span>
          <strong className="optionBottom">Sell on Amazon Clone</strong>
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