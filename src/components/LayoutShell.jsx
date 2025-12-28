'use client';
import Nav from './Nav';

export default function LayoutShell({ children }) {
  return (
    <div className="layout-shell">
      <Nav />
      <main className="main-content">{children}</main>
    </div>
  );
}
