"use client";

import LayoutShell from "@/components/LayoutShell";
import LogoutButton from "@/components/navbar/LogoutButton";

export default function ProtectedLayout({ children }) {
  return (
    <LayoutShell>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <LogoutButton />
      </div>
      {children}
    </LayoutShell>
  );
}
