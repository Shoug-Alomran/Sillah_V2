'use client';

import { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

export default function AlertsPage() {
  // Placeholder data — later we connect to SQLite
  const [alerts] = useState([]);

  // Filter state
  const [severity, setSeverity] = useState('all');

  return (
    <div className="alerts-page">
      <div className="alerts-container">

        {/* Header */}
        <div className="alerts-header">
          <div className="header-content">
            <h1 className="alerts-title">
              <Bell className="title-icon" />
              Risk Alerts
            </h1>
            <p className="alerts-subtitle">
              View hereditary and personal health risk alerts
            </p>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${severity === 'all' ? 'active' : ''}`}
            onClick={() => setSeverity('all')}
          >
            All
          </button>

          <button
            className={`filter-tab ${severity === 'high' ? 'active' : ''}`}
            onClick={() => setSeverity('high')}
          >
            <AlertTriangle className="tab-icon" />
            High
          </button>

          <button
            className={`filter-tab ${severity === 'medium' ? 'active' : ''}`}
            onClick={() => setSeverity('medium')}
          >
            <ShieldAlert className="tab-icon" />
            Medium
          </button>

          <button
            className={`filter-tab ${severity === 'low' ? 'active' : ''}`}
            onClick={() => setSeverity('low')}
          >
            <CheckCircle className="tab-icon" />
            Low
          </button>
        </div>

        {/* Alerts List */}
        <div className="alerts-section">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <Bell className="empty-icon" />
              <h3 className="empty-title">No Alerts</h3>
              <p className="empty-text">
                You currently have no {severity} severity alerts.
              </p>
            </div>
          ) : (
            <div className="alerts-grid">
              {alerts
                .filter((a) => severity === 'all' || a.severity === severity)
                .map((alert) => (
                  <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                    <h3 className="alert-title">{alert.title}</h3>
                    <p className="alert-description">{alert.description}</p>
                    <p className="alert-severity">Severity: {alert.severity}</p>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
