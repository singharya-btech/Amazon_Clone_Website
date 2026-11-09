import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { amazonLogo } from "../assets";
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
      <Link to="/">
        <img
          src={amazonLogo}
          alt="Amazon Clone Logo"
          className="login__logo"
        />
      </Link>

      <div className="login__container">
        <h1>Sign In</h1>

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

          <button type="submit" className="login__button">
            Sign In
          </button>
        </form>

        <p>
          By continuing, you agree to Amazon Clone's Conditions of Use &
          Privacy Notice.
        </p>

        <Link to="/register">
          <button className="register__button">
            Create your Amazon Clone Account
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Login;