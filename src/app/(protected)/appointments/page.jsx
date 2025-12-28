'use client';

import { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  CheckCircle,
} from 'lucide-react';

export default function AppointmentsPage() {
  // Placeholder data — later we connect to SQLite
  const [appointments] = useState([]);

  // Filter state
  const [filter, setFilter] = useState('upcoming');

  return (
    <div className="appointments-page">
      <div className="appointments-container">

        {/* Header */}
        <div className="appointments-header">
          <div className="header-content">
            <h1 className="appointments-title">
              <Calendar className="title-icon" />
              Appointments
            </h1>
            <p className="appointments-subtitle">
              Manage your upcoming and past medical appointments
            </p>
          </div>

          <button className="add-appointment-btn">
            <Plus className="btn-icon" />
            Add Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>

          <button
            className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>

        {/* Appointment List */}
        <div className="appointments-section">
          {appointments.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-icon" />
              <h3 className="empty-title">No Appointments</h3>
              <p className="empty-text">
                You don’t have any {filter} appointments yet.
              </p>
              <button className="empty-action-btn">
                <Plus className="empty-action-icon" />
                Add Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-grid">
              {appointments
                .filter((appt) => appt.type === filter)
                .map((appt) => (
                  <div key={appt.id} className="appointment-card">
                    <div className="appointment-info">
                      <h3 className="appointment-title">{appt.title}</h3>
                      <p className="appointment-date">
                        <Clock className="info-icon" />
                        {appt.date}
                      </p>
                      <p className="appointment-location">
                        <MapPin className="info-icon" />
                        {appt.location}
                      </p>
                    </div>

                    {filter === 'past' && (
                      <div className="appointment-status">
                        <CheckCircle className="status-icon" />
                        Completed
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
