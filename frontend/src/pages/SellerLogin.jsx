import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { amazonLogoWhite as brandLogo } from "../assets";
import "./Seller.css";
import { authenticateSeller, setSellerSession } from "../mock/marketplace";

const SellerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const seller = await authenticateSeller(email, password);
      setSellerSession(seller);
      navigate("/seller/dashboard");
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data || err.message || "Login failed.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    }
  };

  return (
    <div className="sellerPortal">
      <aside className="sellerPortal__aside">
        <div>
          <div className="sellerPortal__aside-top">
            <Link to="/">
              <img src={brandLogo} alt="Amazon Clone" style={{ width: 150 }} />
            </Link>
          </div>
          <h1>Reach more customers on Amazon Clone.</h1>
          <p>
            Sign in to manage your listings, track your verification
            status, and add new products to your storefront.
          </p>
        </div>
        <div className="brand-divider" />
        <p style={{ fontSize: 13, color: "#8891A0" }}>
          New here? Registration takes about two minutes — your storefront
          goes live as soon as our team verifies your business details.
        </p>
      </aside>

      <main className="sellerPortal__main">
        <div className="sellerPortal__card">
          <h2>Seller sign in</h2>
          <div className="subtitle">Access your seller dashboard</div>

          <form className="sellerForm" onSubmit={handleSubmit}>
            <label>Business email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <div className="sellerForm__error">{error}</div>}

            <button type="submit">Sign in</button>
          </form>

          <div className="sellerPortal__switch">
            New seller? <Link to="/seller/register">Create a seller account</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerLogin;
