import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";
import "./Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tokenHint, setTokenHint] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    setTokenHint("");
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message || "Password reset link has been dispatched to your email.");
      if (response.reset_token) {
        setTokenHint(response.reset_token);
      }
    } catch {
      setError("We could not process your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <Link to="/" className="auth__brand">amazon<span>clone</span></Link>
      <div className="login__container">
        <p className="auth__eyebrow">Account Recovery</p>
        <h1>Forgot Password?</h1>
        <p className="auth__subtitle">Enter your account email and we’ll send a link to reset your password.</p>

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <button className="login__button" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-emerald-50 rounded border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800">{message}</p>
            {tokenHint && (
              <div className="mt-2 text-xs text-gray-700">
                <span className="font-bold">Reset Token (Dev mode):</span>
                <code className="block bg-white p-1 rounded font-mono text-[11px] mt-1 break-all select-all">
                  {tokenHint}
                </code>
                <Link
                  to={`/reset-password?token=${tokenHint}`}
                  className="mt-2 inline-block text-amber-700 font-bold hover:underline"
                >
                  Click to proceed to password reset &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {error && <p className="login__error">{error}</p>}

        <div className="register__signin">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
