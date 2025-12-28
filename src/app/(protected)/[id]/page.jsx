'use client';

import { useParams } from 'next/navigation';
import {
  User,
  Heart,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function FamilyMemberPage() {
  const { id } = useParams();

  // Placeholder — later we fetch from SQLite
  const member = null;

  return (
    <div className="family-member-page">
      <div className="family-member-container">

        {/* Back Button */}
        <Link href="/family-tree" className="back-btn">
          <ArrowLeft className="back-icon" />
          Back to Family Tree
        </Link>

        {/* Header */}
        <div className="member-header">
          <User className="member-icon" />
          <h1 className="member-title">Family Member</h1>
          <p className="member-subtitle">ID: {id}</p>
        </div>

        {/* Content */}
        {member === null ? (
          <div className="empty-state">
            <User className="empty-icon" />
            <h3 className="empty-title">No Data Yet</h3>
            <p className="empty-text">
              This member’s details will appear here once added.
            </p>
          </div>
        ) : (
          <div className="member-details">
            <h2 className="detail-name">{member.name}</h2>
            <p className="detail-relationship">{member.relationship}</p>

            <div className="detail-section">
              <Heart className="detail-icon" />
              <p>{member.health}</p>
            </div>

            <div className="detail-section">
              <Activity className="detail-icon" />
              <p>Risk Score: {member.riskScore}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
