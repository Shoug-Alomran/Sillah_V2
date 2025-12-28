'use client';

import Link from 'next/link';

export default function StatCard({ href, label, value, icon: Icon, gradientClass }) {
  return (
    <Link href={href} className="stat-card">
      <div className="stat-card-content">
        <div className="stat-info">
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
        </div>
        <div className={`stat-icon-wrapper ${gradientClass}`}>
          <Icon className="stat-icon" />
        </div>
      </div>
    </Link>
  );
}
