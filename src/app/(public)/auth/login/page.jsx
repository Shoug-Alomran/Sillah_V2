"use client";

import { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import SubmitButton from "@/components/auth/SubmitButton";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Invalid login");
    }
  };

  return (
    <AuthCard title="Login" subtitle="Access your Sillah account">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <AuthInput
          label="Email"
          name="email"
          placeholder="your.email@example.com"
          value={form.email}
          onChange={handleChange}
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
        />

        <SubmitButton>Login</SubmitButton>
      </form>

      <p style={{ marginTop: "16px", textAlign: "center" }}>
        Don’t have an account? <Link href="/auth/signup">Sign up</Link>
      </p>
    </AuthCard>
  );
}
