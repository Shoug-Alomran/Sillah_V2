"use client";

export default function RoleToggle({ role, setRole }) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      
      {/* Patient Button */}
      <button
        type="button"
        onClick={() => setRole("citizen")}
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "10px",
          border: role === "citizen" ? "2px solid #0a4d68" : "1px solid #ccc",
          background: role === "citizen" ? "#e0f7fa" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: "pointer",
        }}
      >
        {/* Patient Icon (inline SVG) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a4d68">
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
          border: role === "provider" ? "2px solid #0a4d68" : "1px solid #ccc",
          background: role === "provider" ? "#e0f7fa" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: "pointer",
        }}
      >
        {/* Doctor Icon (inline SVG) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a4d68">
          <circle cx="12" cy="6" r="4" />
          <path d="M19 21v-2c0-3-3-6-7-6s-7 3-7 6v2h14z" />
          <path d="M8 11h8v2H8z" />
        </svg>
        Doctor
      </button>

    </div>
  );
}
