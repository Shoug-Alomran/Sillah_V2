'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Calendar,
  Activity,
} from 'lucide-react';

export default function PatientsPage() {
  // Placeholder data — later we connect to SQLite
  const [patients] = useState([]);

  return (
    <div className="patients-page">
      <div className="patients-container">

        {/* Header */}
        <div className="patients-header">
          <div className="header-content">
            <h1 className="patients-title">
              <Users className="title-icon" />
              Patients
            </h1>
            <p className="patients-subtitle">
              View and manage your registered patients
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search patients..."
            className="search-input"
          />
        </div>

        {/* Patients List */}
        <div className="patients-section">
          {patients.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon" />
              <h3 className="empty-title">No Patients Found</h3>
              <p className="empty-text">
                Patients you add will appear here.
              </p>
            </div>
          ) : (
            <div className="patients-grid">
              {patients.map((patient) => (
                <div key={patient.id} className="patient-card">
                  <h3 className="patient-name">{patient.name}</h3>

                  <p className="patient-info">
                    <Calendar className="info-icon" />
                    Last Visit: {patient.lastVisit}
                  </p>

                  <p className="patient-info">
                    <Activity className="info-icon" />
                    Risk Score: {patient.riskScore}
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
