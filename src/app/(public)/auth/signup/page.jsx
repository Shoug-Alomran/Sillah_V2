"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AuthInput from "@/components/auth/AuthInput";
import SubmitButton from "@/components/auth/SubmitButton";

export default function UnifiedSignupPage() {
  const [role, setRole] = useState("citizen"); // patient default
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

  // Fetch doctors dynamically
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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(to bottom right, #e0f7fa, #d1c4e9)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "30px",
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        {/* Heart Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Image
            src="/heart.png" // your original logo, unchanged
            alt="Sillah Logo"
            width={64}
            height={64}
            style={{ borderRadius: "12px" }}
          />
        </div>

        <h1
          style={{
            fontSize: "24px",
            marginBottom: "4px",
            color: "#0a4d68",
            textAlign: "center",
          }}
        >
          Join Sillah (صلة)
        </h1>
        <p style={{ marginBottom: "20px", color: "#666", textAlign: "center" }}>
          Create your account
        </p>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Role Toggle */}
          <label style={{ fontSize: "14px", color: "#444" }}>I am a</label>

          <div style={{ display: "flex", gap: "12px" }}>
            {/* Patient Button */}
            <button
              type="button"
              onClick={() => setRole("citizen")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "10px",
                border:
                  role === "citizen" ? "2px solid #0a4d68" : "1px solid #ccc",
                background: role === "citizen" ? "#e0f7fa" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              {/* Patient Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#0a4d68"
              >
                <circle cx="12" cy="7" r="5" />
                <path d="M12 14c-5 0-9 3-9 6v2h18v-2c0-3-4-6-9-6z" />
              </svg>
              Patient
            </button>

            {/* Doctor Button */}
            <button
              type="button"
              onClick={() => setRole("provider")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "10px",
                border:
                  role === "provider" ? "2px solid #0a4d68" : "1px solid #ccc",
                background: role === "provider" ? "#e0f7fa" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              {/* Stethoscope Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#0a4d68"
                stroke="#0a4d68"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3v6a6 6 0 0 0 12 0V3" />
                <circle cx="18" cy="20" r="2" />
                <path d="M18 18v-2a4 4 0 0 0-4-4H8" />
              </svg>
              Doctor
            </button>
          </div>

          {/* Full Name */}
          <AuthInput
            label="Full Name"
            name="full_name"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={handleChange}
          />

          {/* Email */}
          <AuthInput
            label="Email Address"
            name="email"
            placeholder="your.email@example.com"
            value={form.email}
            onChange={handleChange}
          />

          {/* Phone */}
          <AuthInput
            label="Phone Number (Optional)"
            name="phone"
            placeholder="+966 50 123 4567"
            value={form.phone}
            onChange={handleChange}
          />

          {/* Doctor Select (only for patients) */}
          {role === "citizen" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", color: "#444" }}>
                Select Your Doctor
              </label>

              {loadingDoctors ? (
                <p style={{ color: "#666" }}>Loading doctors...</p>
              ) : doctors.length === 0 ? (
                <p style={{ color: "#b33", fontSize: "14px" }}>
                  ⚠️ No doctors available yet. You can still sign up and select a doctor later.
                </p>
              ) : (
                <select
                  name="doctor_id"
                  value={form.doctor_id}
                  onChange={handleChange}
                  style={{
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    fontSize: "15px",
                  }}
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
          <AuthInput
            label="Password"
            name="password"
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={handleChange}
          />

          {/* Confirm Password */}
          <AuthInput
            label="Confirm Password"
            name="confirm"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirm}
            onChange={handleChange}
          />

          <SubmitButton>Sign Up</SubmitButton>
        </form>

        <p style={{ marginTop: "16px", textAlign: "center" }}>
          Already have an account? <a href="/auth/login">Login</a>
        </p>
      </div>
    </div>
  );
}
