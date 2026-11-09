import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { registerAdmin } from "../services/authService";

import "./Admin.css";

const AdminRegister = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await registerAdmin({
        username,
        email: username,
        password,
        password2: confirm,
        first_name: "",
        last_name: "",
      });
      const adminUser = response.user || { username };
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
      navigate("/admin/panel");
    } catch (err) {
      console.error("Admin registration failed:", err);
      const message = err.response?.data || err.message || "Registration failed";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    }
  };

  return (
    <>
      <Header />
      <Navbar />

      <div className="adminPage">
        <h1>Admin Register</h1>
        <form className="adminForm" onSubmit={handleSubmit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

          {error && <div style={{color:'red', marginTop:8}}>{error}</div>}

          <button className="saveBtn" type="submit">Register</button>

          <div style={{marginTop:12}}>Have account? <Link to="/admin/login">Login</Link></div>
        </form>
      </div>

      <Footer />
    </>
  );
};

export default AdminRegister;
