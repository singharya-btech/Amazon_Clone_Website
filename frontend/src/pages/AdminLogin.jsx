import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { loginAdmin } from "../services/authService";

import "./Admin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginAdmin({ username, password });
      const adminUser = response.user || { username };
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
      navigate("/admin/panel");
    } catch (err) {
      console.error("Admin login failed:", err);
      const message = err.response?.data || err.message || "Invalid credentials";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    }
  };

  return (
    <>
      <Header />
      <Navbar />

      <div className="adminPage">
        <h1>Admin Login</h1>
        <form className="adminForm" onSubmit={handleSubmit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <div style={{color:'red', marginTop:8}}>{error}</div>}

          <button className="saveBtn" type="submit">Login</button>

          <div style={{marginTop:12}}>No account? <Link to="/admin/register">Register</Link></div>
        </form>
      </div>

      <Footer />
    </>
  );
};

export default AdminLogin;
