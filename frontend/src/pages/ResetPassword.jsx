import React, { useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "../services/authService";
import "./Login.css";

const ResetPassword = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = params.token || searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
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
    if (!token) {
      setError("Reset token is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await confirmPasswordReset(token, newPassword);
      setMessage(response.message || "Password has been successfully reset!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "This reset link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <Link to="/" className="auth__brand">amazon<span>clone</span></Link>
      <div className="login__container">
        <p className="auth__eyebrow">Account Recovery</p>
        <h1>Set New Password</h1>
        <p className="auth__subtitle">Choose a secure password of at least 6 characters.</p>

        <form onSubmit={handleSubmit}>
          {!tokenParam && (
            <>
              <label>Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                required
              />
            </>
          )}

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            placeholder="Re-enter password"
          />

          <button className="login__button" type="submit" disabled={submitting}>
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && <p className="login__message text-emerald-600 font-semibold">{message}</p>}
        {error && <p className="login__error">{error}</p>}

        <div className="register__signin">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
