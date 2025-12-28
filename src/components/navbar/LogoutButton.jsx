"use client";

export default function LogoutButton() {
  return (
    <button
      onClick={() => alert("Logging out...")}
      style={{
        padding: "8px 14px",
        background: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
