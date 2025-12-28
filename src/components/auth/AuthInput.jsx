"use client";

export default function AuthInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{ fontSize: "14px", color: "#444" }}>{label}</label>
      )}

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontSize: "15px",
        }}
      />
    </div>
  );
}
