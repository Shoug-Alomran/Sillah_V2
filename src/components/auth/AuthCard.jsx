"use client";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "40px auto",
        padding: "30px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "4px", color: "#0a4d68" }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{ marginBottom: "20px", color: "#666" }}>{subtitle}</p>
      )}

      {children}
    </div>
  );
}
