import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { confirmPasswordReset } from "../services/authService";
import "./Login.css";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await confirmPasswordReset(uid, token, { new_password: newPassword, confirm_password: confirmPassword });
      setMessage(response.detail);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "This reset link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="login">
    <Link to="/" className="auth__brand">amazon<span>clone</span></Link>
    <div className="login__container">
      <p className="auth__eyebrow">Account recovery</p>
      <h1>Set a new password</h1>
      <p className="auth__subtitle">Choose a password with at least six characters.</p>
      <form onSubmit={handleSubmit}>
        <label>New Password</label>
        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength="6" />
        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength="6" />
        <button className="login__button" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Reset password"}</button>
      </form>
      {message && <p className="login__message">{message} <Link to="/login">Sign in</Link></p>}
      {error && <p className="login__error">{error}</p>}
    </div>
  </div>;
};

export default ResetPassword;
