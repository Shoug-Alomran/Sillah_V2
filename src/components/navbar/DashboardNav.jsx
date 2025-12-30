// src/components/navbar/DashboardNav.jsx
"use client";

import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

export default function DashboardNav() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  const patientLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Appointments", href: "/appointments" },
    { label: "Family Tree", href: "/family-tree" },
    { label: "My Health", href: "/my-health" },
    { label: "Clinics", href: "/clinics" },
    { label: "Awareness Hub", href: "/awareness-hub" },
  ];

  const doctorLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Appointments", href: "/appointments" },
    { label: "Patients", href: "/patients" },
    { label: "Medications", href: "/medications" },
    { label: "Alerts", href: "/alerts" },
    { label: "Risk Assessment", href: "/risk-assessment" },
    { label: "Events", href: "/events" },
  ];

  const links = role === "provider" ? doctorLinks : patientLinks;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "#f0f4f8",
        borderBottom: "1px solid #ccc",
      }}
    >
      <div style={{ display: "flex", gap: "16px" }}>
        {links.map((link) => (
          <a key={link.href} href={link.href} style={{ color: "#0a4d68" }}>
            {link.label}
          </a>
        ))}
      </div>

      <LogoutButton />
    </nav>
  );
}
