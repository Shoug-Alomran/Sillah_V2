'use client';

import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
} from 'lucide-react';

export default function EventsPage() {
  // Placeholder data — later we connect to SQLite
  const [events] = useState([]);

  return (
    <div className="events-page">
      <div className="events-container">

        {/* Header */}
        <div className="events-header">
          <div className="header-content">
            <h1 className="events-title">
              <Calendar className="title-icon" />
              Health Events
            </h1>
            <p className="events-subtitle">
              Stay updated with upcoming health events, workshops, and screenings
            </p>
          </div>

          <button className="add-event-btn">
            <Plus className="btn-icon" />
            Add Event
          </button>
        </div>

        {/* Events List */}
        <div className="events-section">
          {events.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-icon" />
              <h3 className="empty-title">No Events Available</h3>
              <p className="empty-text">
                New health events will appear here once added.
              </p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <h3 className="event-title">{event.title}</h3>

                  <p className="event-date">
                    <Clock className="info-icon" />
                    {event.date}
                  </p>

                  <p className="event-location">
                    <MapPin className="info-icon" />
                    {event.location}
                  </p>

                  <p className="event-description">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}