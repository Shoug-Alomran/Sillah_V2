'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Plus,
  Shield,
} from 'lucide-react';

export default function MyHealthPage() {
  // Placeholder data — later we will connect this to SQLite
  const [records] = useState([]);

  return (
    <div className="my-health-page">
      <div className="my-health-container">

        {/* Header */}
        <div className="my-health-header">
          <div className="header-content">
            <h1 className="my-health-title">
              <Heart className="title-icon" />
              My Health
            </h1>
            <p className="my-health-subtitle">
              Track your personal health history and hereditary conditions
            </p>
          </div>

          <button className="add-record-btn">
            <Plus className="btn-icon" />
            Add Record
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <Shield className="privacy-icon" />
          <div className="privacy-content">
            <p>
              Your health information is securely stored and only visible to you.
              You can choose to share it with your doctor if needed.
            </p>
          </div>
        </div>

        {/* Records List */}
        <div className="records-section">
          {records.length === 0 ? (
            <div className="empty-state">
              <Heart className="empty-icon" />
              <h3 className="empty-title">No Health Records Yet</h3>
              <p className="empty-text">
                Start by adding your first health record.
              </p>
              <button className="empty-action-btn">
                <Plus className="empty-action-icon" />
                Add Record
              </button>
            </div>
          ) : (
            <div className="records-grid">
              {records.map((record) => (
                <div key={record.id} className="record-card">
                  <h3 className="record-title">{record.condition}</h3>
                  <p className="record-details">
                    Age of onset: {record.age_of_onset || 'Unknown'}
                  </p>
                  <p className="record-notes">{record.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
