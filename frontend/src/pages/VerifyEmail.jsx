import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import "./Login.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get("token") || "";
  const [token, setToken] = useState(urlToken);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (urlToken) {
      handleVerify(urlToken);
    }
  }, [urlToken]);

  const handleVerify = async (tokenToUse) => {
    const t = tokenToUse || token;
    if (!t) {
      setErrorText("Please enter a verification token.");
      return;
    }
    setLoading(true);
    setErrorText("");
    setStatusText("");
    try {
      const res = await verifyEmail(t);
      setVerified(true);
      setStatusText(res.message || "Email verified successfully!");
    } catch (err) {
      setErrorText(err.response?.data?.error || "Invalid or expired verification token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <Link to="/" className="auth__brand">
        amazon<span>clone</span>
      </Link>
      <div className="login__container">
        <p className="auth__eyebrow">Account Security</p>
        <h1>Verify Email Address</h1>
        <p className="auth__subtitle">
          Enter the verification code sent to your registered email address.
        </p>

        {verified ? (
          <div className="space-y-4 text-center py-4">
            <div className="text-4xl text-emerald-500">✓</div>
            <p className="login__message text-emerald-700">{statusText}</p>
            <Link
              to="/profile"
              className="login__button block text-center mt-4"
            >
              Go to Your Profile
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(token);
            }}
          >
            <label>Verification Token / Code</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste verification token here"
              required
            />
            <button
              className="login__button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        )}

        {errorText && <p className="login__error">{errorText}</p>}

        <div className="register__signin">
          <Link to="/profile">Back to Profile</Link> &bull; <Link to="/">Home</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
