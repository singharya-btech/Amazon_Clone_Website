import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser({
        username: formData.email,
        password: formData.password,
      });

      login(response.user);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.response?.data || error.message || "Login failed";
      alert(JSON.stringify(message));
    }
  };

  return (
    <div className="login">
      <Link to="/" className="auth__brand">amazon<span>clone</span></Link>

      <div className="login__container">
        <p className="auth__eyebrow">Welcome back</p>
        <h1>Sign In</h1>
        <p className="auth__subtitle">Access your orders, profile and saved products.</p>

        <form onSubmit={handleSubmit}>

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Link to="/forgot-password" className="login__forgotPassword">Forgot password?</Link>

          <button type="submit" className="login__button">
            Sign In
          </button>
        </form>

        <p className="auth__terms">
          By continuing, you agree to Amazon Clone's Conditions of Use &
          Privacy Notice.
        </p>

        <Link to="/register">
          <button className="register__button">
            Create your Amazon Account
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Login;
