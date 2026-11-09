import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { amazonLogo } from "../assets";
import "./Register.css";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/authService";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const nameParts = formData.fullName.trim().split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      const response = await registerUser({
        username: formData.email,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        first_name,
        last_name,
      });

      register(response.user);
      navigate("/");
    } catch (error) {
      console.error("Registration failed:", error);
      const message = error.response?.data || error.message || "Registration failed";
      alert(JSON.stringify(message));
    }
  };

  return (
    <div className="register">
      <Link to="/">
        <img
          src={amazonLogo}
          alt="Amazon Clone Logo"
          className="register__logo"
        />
      </Link>

      <div className="register__container">
        <h1>Create Account</h1>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="register__button"
          >
            Create your Amazon Clone Account
          </button>
        </form>

        <p>
          By creating an account, you agree to Amazon Clone's
          Conditions of Use and Privacy Notice.
        </p>

        <div className="register__signin">
          <span>Already have an account?</span>

          <Link to="/login">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;