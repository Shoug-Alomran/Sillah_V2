// frontend/src/Prototype/Pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      await login(cleanEmail, password);

      // If login succeeds, session exists -> go to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      const msg = String(err?.message || "");

      // Common Supabase cases (helpful UX)
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError("Your email isn’t confirmed yet. Check your inbox and confirm, then try again.");
      } else if (msg.toLowerCase().includes("invalid login credentials")) {
        setError("Invalid email or password.");
      } else {
        setError(msg || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-icon-large">
              <Heart className="brand-heart-large" />
            </div>
            <h1 className="auth-title">Welcome to Sillah (صلة)</h1>
            <p className="auth-subtitle">Login to your account</p>
          </div>

          {error && (
            <div className="auth-error" role="alert" aria-live="polite">
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                <Mail className="form-label-icon" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="your.email@example.com"
                required
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                <Lock className="form-label-icon" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}