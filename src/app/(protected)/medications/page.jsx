'use client';

import { useState } from 'react';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
} from 'lucide-react';

export default function MedicationsPage() {
  // Placeholder data — later we connect to SQLite
  const [medications] = useState([]);

  return (
    <div className="medications-page">
      <div className="medications-container">

        {/* Header */}
        <div className="medications-header">
          <div className="header-content">
            <h1 className="medications-title">
              <Pill className="title-icon" />
              Medications
            </h1>
            <p className="medications-subtitle">
              Track your prescriptions, dosages, and schedules
            </p>
          </div>

          <button className="add-medication-btn">
            <Plus className="btn-icon" />
            Add Medication
          </button>
        </div>

        {/* Medication List */}
        <div className="medications-section">
          {medications.length === 0 ? (
            <div className="empty-state">
              <Pill className="empty-icon" />
              <h3 className="empty-title">No Medications Added</h3>
              <p className="empty-text">
                Start by adding your first medication.
              </p>
              <button className="empty-action-btn">
                <Plus className="empty-action-icon" />
                Add Medication
              </button>
            </div>
          ) : (
            <div className="medications-grid">
              {medications.map((med) => (
                <div key={med.id} className="medication-card">
                  <h3 className="medication-name">{med.name}</h3>

                  <p className="medication-dosage">
                    <Pill className="info-icon" />
                    {med.dosage}
                  </p>

                  <p className="medication-frequency">
                    <Clock className="info-icon" />
                    {med.frequency}
                  </p>

                  <p className="medication-start">
                    <Calendar className="info-icon" />
                    Start: {med.start_date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
