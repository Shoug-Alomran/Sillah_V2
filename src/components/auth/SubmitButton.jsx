"use client";

export default function SubmitButton({ children }) {
  return (
    <button
      type="submit"
      style={{
        width: "100%",
        padding: "12px",
        background: "#0a4d68",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
        marginTop: "10px",
      }}
    >
      {children}
    </button>
  );
}
