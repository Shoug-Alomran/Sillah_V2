'use client';

import { useState } from 'react';
import {
  MapPin,
  Search,
  Star,
  Phone,
  Clock,
} from 'lucide-react';

export default function ClinicsPage() {
  // Placeholder data — later we connect to SQLite
  const [clinics] = useState([]);

  // Filter state
  const [filter, setFilter] = useState('all');

  return (
    <div className="clinics-page">
      <div className="clinics-container">

        {/* Header */}
        <div className="clinics-header">
          <div className="header-content">
            <h1 className="clinics-title">
              <MapPin className="title-icon" />
              Clinics
            </h1>
            <p className="clinics-subtitle">
              Find nearby clinics and healthcare providers
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search clinics..."
            className="search-input"
          />
        </div>

        {/* Filters */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>

          <button
            className={`filter-tab ${filter === 'nearby' ? 'active' : ''}`}
            onClick={() => setFilter('nearby')}
          >
            Nearby
          </button>

          <button
            className={`filter-tab ${filter === 'top-rated' ? 'active' : ''}`}
            onClick={() => setFilter('top-rated')}
          >
            Top Rated
          </button>
        </div>

        {/* Clinics List */}
        <div className="clinics-section">
          {clinics.length === 0 ? (
            <div className="empty-state">
              <MapPin className="empty-icon" />
              <h3 className="empty-title">No Clinics Found</h3>
              <p className="empty-text">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="clinics-grid">
              {clinics
                .filter((clinic) => {
                  if (filter === 'nearby') return clinic.nearby;
                  if (filter === 'top-rated') return clinic.rating >= 4.5;
                  return true;
                })
                .map((clinic) => (
                  <div key={clinic.id} className="clinic-card">
                    <h3 className="clinic-name">{clinic.name}</h3>

                    <p className="clinic-location">
                      <MapPin className="info-icon" />
                      {clinic.location}
                    </p>

                    <p className="clinic-hours">
                      <Clock className="info-icon" />
                      {clinic.hours}
                    </p>

                    <p className="clinic-phone">
                      <Phone className="info-icon" />
                      {clinic.phone}
                    </p>

                    <div className="clinic-rating">
                      <Star className="rating-icon" />
                      {clinic.rating}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
