"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      alert("Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">

          {/* Header */}
          <div className="auth-header">
            <div className="brand-icon-large">
              <div className="brand-icon-large">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="brand-heart-large"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
            <h1 className="auth-title">Login</h1>
            <p className="auth-subtitle">Access your Sillah account</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                name="email"
                className="form-input"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button className="auth-submit-btn">Login</button>
          </form>

          <div className="auth-footer">
            Don’t have an account?{" "}
            <Link href="/auth/signup" className="auth-link">
              Sign up
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
