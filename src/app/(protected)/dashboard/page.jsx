'use client';

import Link from 'next/link';
import {
  Heart,
  Users,
  Activity,
  Calendar,
  Bell,
  MapPin,
  BookOpen,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome to Sillah</h1>
          <p className="dashboard-subtitle">Your family health overview</p>
          <p className="dashboard-welcome">Stay informed. Stay connected.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <Link href="/family-tree" className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Family Members</p>
                <p className="stat-value">0</p>
              </div>
              <div className="stat-icon-wrapper from-blue-500">
                <Users className="stat-icon" />
              </div>
            </div>
          </Link>

          <Link href="/my-health" className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Health Records</p>
                <p className="stat-value">0</p>
              </div>
              <div className="stat-icon-wrapper from-purple-500">
                <Heart className="stat-icon" />
              </div>
            </div>
          </Link>

          <Link href="/alerts" className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Risk Alerts</p>
                <p className="stat-value">0</p>
              </div>
              <div className="stat-icon-wrapper from-green-500">
                <Bell className="stat-icon" />
              </div>
            </div>
          </Link>

          <Link href="/appointments" className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Appointments</p>
                <p className="stat-value">0</p>
              </div>
              <div className="stat-icon-wrapper from-teal-500">
                <Calendar className="stat-icon" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h2 className="quick-actions-title">Quick Actions</h2>

          <div className="quick-actions-grid">
            <Link href="/family-tree" className="quick-action-btn btn-teal">
              <Users className="quick-action-icon" />
              Family Tree
            </Link>

            <Link href="/my-health" className="quick-action-btn btn-blue">
              <Heart className="quick-action-icon" />
              My Health
            </Link>

            <Link href="/clinics" className="quick-action-btn btn-purple">
              <MapPin className="quick-action-icon" />
              Clinics
            </Link>

            <Link href="/awareness-hub" className="quick-action-btn btn-teal">
              <BookOpen className="quick-action-icon" />
              Awareness Hub
            </Link>
          </div>
        </div>

        {/* Activity Section */}
        <div className="activity-grid">

          {/* Alerts */}
          <div className="activity-card">
            <div className="activity-card-header">
              <h3 className="activity-card-title">Recent Alerts</h3>
              <Link href="/alerts" className="view-all-btn">View all</Link>
            </div>

            <div className="activity-card-content">
              <p className="empty-message">No alerts yet</p>
            </div>
          </div>

          {/* Appointments */}
          <div className="activity-card">
            <div className="activity-card-header">
              <h3 className="activity-card-title">Upcoming Appointments</h3>
              <Link href="/appointments" className="view-all-btn">View all</Link>
            </div>

            <div className="activity-card-content">
              <p className="empty-message">No appointments scheduled</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}