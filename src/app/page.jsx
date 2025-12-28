"use client";

import AuthCard from "../components/auth/AuthCard";
import SubmitButton from "../components/auth/SubmitButton";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
      <AuthCard title="Welcome to Sillah (صلة)" subtitle="Your gateway to health, family, and care.">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          <Link href="/auth/login">
            <SubmitButton>Login</SubmitButton>
          </Link>

          <Link href="/auth/signup">
            <SubmitButton>Patient Signup</SubmitButton>
          </Link>

          <Link href="/auth/signup-doctor">
            <SubmitButton>Doctor Signup</SubmitButton>
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
