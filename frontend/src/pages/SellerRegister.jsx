import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { amazonLogoWhite as brandLogo } from "../assets";
import "./Seller.css";
import { registerSeller, setSellerSession, getCategories } from "../mock/marketplace";

const SellerRegister = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    categoryFocus: "",
    registrationId: "",
    businessDescription: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setForm((f) => (f.categoryFocus ? f : { ...f, categoryFocus: cats[0] || "" }));
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.businessDescription.trim().length < 20) {
      setError(
        "Please add a bit more detail about your business (at least 20 characters) — this is what our team reviews before verifying you."
      );
      return;
    }

    try {
      const seller = await registerSeller(form);
      setSellerSession(seller);
      navigate("/seller/dashboard");
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data || err.message || "Registration failed.";
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
          <h1>Open your storefront on Amazon Clone.</h1>
          <p>Tell us about your business. Here's what happens next:</p>

          <div className="sellerPortal__steps">
            <div className="sellerPortal__step">
              <div className="sellerPortal__step-index">1</div>
              <div>
                <strong>Submit your details</strong>
                <span>Business info, contact details, and a short description.</span>
              </div>
            </div>
            <div className="sellerPortal__step">
              <div className="sellerPortal__step-index">2</div>
              <div>
                <strong>Our team reviews it</strong>
                <span>An admin checks your background before you go live.</span>
              </div>
            </div>
            <div className="sellerPortal__step">
              <div className="sellerPortal__step-index">3</div>
              <div>
                <strong>Get verified &amp; start listing</strong>
                <span>Once verified, your products appear to every customer.</span>
              </div>
            </div>
          </div>
        </div>
        <div className="brand-divider" />
        <p style={{ fontSize: 13, color: "#8891A0" }}>
          You can add products right away — they'll only appear on the storefront
          once your account is verified.
        </p>
      </aside>

      <main className="sellerPortal__main">
        <div className="sellerPortal__card">
          <h2>Become a seller</h2>
          <div className="subtitle">Create your Amazon Clone seller account</div>

          <form className="sellerForm" onSubmit={handleSubmit}>
            <label>Business name</label>
            <input name="businessName" value={form.businessName} onChange={handleChange} required />

            <label>Owner / contact name</label>
            <input name="ownerName" value={form.ownerName} onChange={handleChange} required />

            <div className="form-row">
              <div>
                <label>Business email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>
              <div>
                <label>Confirm password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <label>Primary category</label>
            <select name="categoryFocus" value={form.categoryFocus} onChange={handleChange}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label>Business registration / tax ID (optional)</label>
            <input name="registrationId" value={form.registrationId} onChange={handleChange} placeholder="e.g. GSTIN, business license no." />

            <label>Tell us about your business</label>
            <textarea
              name="businessDescription"
              value={form.businessDescription}
              onChange={handleChange}
              placeholder="What do you sell, how long have you been operating, where are you based..."
              required
            />

            {error && <div className="sellerForm__error">{error}</div>}

            <button type="submit">Submit for review</button>
          </form>

          <div className="sellerPortal__switch">
            Already registered? <Link to="/seller/login">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerRegister;
