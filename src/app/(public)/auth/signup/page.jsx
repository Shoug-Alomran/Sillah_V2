"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  const [role, setRole] = useState("citizen");
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    doctor_id: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("/api/doctors");
        const data = await res.json();
        setDoctors(data);
      } catch (err) {
        console.error("Failed to load doctors", err);
      } finally {
        setLoadingDoctors(false);
      }
    }

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    const payload = {
      ...form,
      role,
      doctor_id: role === "citizen" ? form.doctor_id : null,
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      window.location.href = "/auth/login";
    } else {
      alert("Signup failed");
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
            <h1 className="auth-title">Join Sillah (صلة)</h1>
            <p className="auth-subtitle">Create your account</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>

            {/* User Type */}
            <div className="user-type-selector">
              <button
                type="button"
                className={`user-type-btn ${role === "citizen" ? "active" : ""}`}
                onClick={() => setRole("citizen")}
              >
                <span className="user-type-icon">👤</span>
                Patient
              </button>

              <button
                type="button"
                className={`user-type-btn ${role === "provider" ? "active" : ""}`}
                onClick={() => setRole("provider")}
              >
                <span className="user-type-icon">🩺</span>
                Doctor
              </button>
            </div>

            {/* Full Name */}
            <div className="form-field">
              <label className="form-label">Full Name</label>
              <input
                name="full_name"
                className="form-input"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="form-field">
              <label className="form-label">Email Address</label>
              <input
                name="email"
                className="form-input"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div className="form-field">
              <label className="form-label">Phone Number (Optional)</label>
              <input
                name="phone"
                className="form-input"
                placeholder="+966 50 123 4567"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            {/* Doctor Select */}
            {role === "citizen" && (
              <div className="form-field">
                <label className="form-label">Select Your Doctor</label>

                {loadingDoctors ? (
                  <p>Loading doctors...</p>
                ) : doctors.length === 0 ? (
                  <div
                    style={{
                      background: "#fef9c3",
                      border: "1px solid #fde047",
                      color: "#92400e",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                    No doctors available yet. You can still sign up and select a doctor later.
                  </div>

                ) : (
                  <select
                    name="doctor_id"
                    className="form-input"
                    value={form.doctor_id}
                    onChange={handleChange}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Password */}
            <div className="form-field">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {/* Confirm Password */}
            <div className="form-field">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                className="form-input"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={handleChange}
              />
            </div>

            <button className="auth-submit-btn">Sign Up</button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link href="/auth/login" className="auth-link">
              Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
