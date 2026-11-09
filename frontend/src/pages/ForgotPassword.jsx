import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";
import "./Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.detail);
    } catch {
      setError("We could not process your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="login">
    <Link to="/" className="auth__brand">amazon<span>clone</span></Link>
    <div className="login__container">
      <p className="auth__eyebrow">Account recovery</p>
      <h1>Forgot password?</h1>
      <p className="auth__subtitle">Enter your account email and we’ll send a link to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        <button className="login__button" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send reset link"}</button>
      </form>
      {message && <p className="login__message">{message}</p>}
      {error && <p className="login__error">{error}</p>}
      <div className="register__signin"><Link to="/login">Back to sign in</Link></div>
    </div>
  </div>;
};

export default ForgotPassword;
