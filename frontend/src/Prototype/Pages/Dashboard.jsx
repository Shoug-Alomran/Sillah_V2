import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, BookOpen, Users, Activity, Stethoscope, AlertTriangle, FileText, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const { currentUser, profile, isDoctor } = useAuth();

  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentCount: 0,
    healthRecordsCount: 0,
    familyMembersCount: 0,
    unreadAlertsCount: 0,
    highRiskCount: 0
  });

  const [loading, setLoading] = useState(true);

  const todayISO = useMemo(() => new Date().toISOString(), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      if (!currentUser?.id) return;

      try {
        setLoading(true);

        if (isDoctor) {
          // Patients assigned to this doctor
          const { count: patientCount, error: dpErr } = await supabase
            .from("doctor_patient")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", currentUser.id)
            .eq("status", "active");

          if (dpErr) throw dpErr;

          // Upcoming appointments for this doctor
          const { count: appointmentCount, error: apptErr } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", currentUser.id)
            .gte("appointment_date", todayISO);

          // If your appointments table uses a different date column, change appointment_date above.
          if (apptErr) {
            // Don’t hard fail if appointments schema differs
            console.warn("Appointments count skipped:", apptErr.message);
          }

          // High risk count (best effort): risk_alerts for doctor’s patients
          // If your risk_alerts table has patient_id and/or doctor_id, adjust accordingly.
          let highRiskCount = 0;
          const { data: assigned, error: assignedErr } = await supabase
            .from("doctor_patient")
            .select("patient_id")
            .eq("doctor_id", currentUser.id)
            .eq("status", "active");

          if (!assignedErr && assigned?.length) {
            const patientIds = assigned.map((r) => r.patient_id);

            const { count: riskCount, error: riskErr } = await supabase
              .from("risk_alerts")
              .select("*", { count: "exact", head: true })
              .in("patient_id", patientIds);

            if (!riskErr) highRiskCount = riskCount || 0;
          }

          if (!cancelled) {
            setStats((s) => ({
              ...s,
              patientCount: patientCount || 0,
              appointmentCount: appointmentCount || 0,
              highRiskCount
            }));
          }
        } else {
          // PATIENT dashboard
          const { count: familyMembersCount, error: fmErr } = await supabase
            .from("family_members")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id);
          if (fmErr) throw fmErr;

          const { count: appointmentCount, error: apptErr } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", currentUser.id)
            .gte("appointment_date", todayISO);
          if (apptErr) console.warn("Appointments count skipped:", apptErr.message);

          const { count: healthRecordsCount, error: mhErr } = await supabase
            .from("medical_history")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id);
          if (mhErr) console.warn("Medical history count skipped:", mhErr.message);

          const { count: unreadAlertsCount, error: raErr } = await supabase
            .from("risk_alerts")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", currentUser.id)
            .eq("is_read", false);
          if (raErr) console.warn("Unread alerts count skipped:", raErr.message);

          if (!cancelled) {
            setStats((s) => ({
              ...s,
              familyMembersCount: familyMembersCount || 0,
              appointmentCount: appointmentCount || 0,
              healthRecordsCount: healthRecordsCount || 0,
              unreadAlertsCount: unreadAlertsCount || 0
            }));
          }
        }
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isDoctor, todayISO]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back, {profile?.full_name || "User"}</h1>
          <p className="dashboard-subtitle">{isDoctor ? "Healthcare Provider Portal" : "Family Health Portal"}</p>
          <p className="dashboard-welcome">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="stats-grid">
          {isDoctor ? (
            <>
              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Patients Assigned</p>
                    <h3 className="stat-value">{stats.patientCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-blue-500">
                    <Users className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Upcoming Appointments</p>
                    <h3 className="stat-value">{stats.appointmentCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-purple-500">
                    <Calendar className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Risk Alerts</p>
                    <h3 className="stat-value">{stats.highRiskCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-green-500">
                    <AlertTriangle className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Your Role</p>
                    <h3 className="stat-value">Doctor</h3>
                  </div>
                  <div className="stat-icon-wrapper from-teal-500">
                    <Stethoscope className="stat-icon" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Family Members</p>
                    <h3 className="stat-value">{stats.familyMembersCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-blue-500">
                    <Users className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Upcoming Appointments</p>
                    <h3 className="stat-value">{stats.appointmentCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-purple-500">
                    <Calendar className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Health Records</p>
                    <h3 className="stat-value">{stats.healthRecordsCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-green-500">
                    <FileText className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Unread Alerts</p>
                    <h3 className="stat-value">{stats.unreadAlertsCount}</h3>
                  </div>
                  <div className="stat-icon-wrapper from-teal-500">
                    <Bell className="stat-icon" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="quick-actions-card">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {isDoctor ? (
              <>
                <Link to="/patients" className="quick-action-btn btn-teal">
                  <Users className="quick-action-icon" />
                  View My Patients
                </Link>
                <Link to="/appointments" className="quick-action-btn btn-blue">
                  <Calendar className="quick-action-icon" />
                  Manage Appointments
                </Link>
                <Link to="/medications" className="quick-action-btn btn-purple">
                  <Stethoscope className="quick-action-icon" />
                  Prescribe Medications
                </Link>
                <Link to="/awareness-hub" className="quick-action-btn btn-teal">
                  <BookOpen className="quick-action-icon" />
                  Medical Resources
                </Link>
              </>
            ) : (
              <>
                <Link to="/family-tree" className="quick-action-btn btn-teal">
                  <Users className="quick-action-icon" />
                  Family Tree
                </Link>
                <Link to="/my-health" className="quick-action-btn btn-blue">
                  <Activity className="quick-action-icon" />
                  My Health Records
                </Link>
                <Link to="/appointments" className="quick-action-btn btn-purple">
                  <Calendar className="quick-action-icon" />
                  My Appointments
                </Link>
                <Link to="/awareness-hub" className="quick-action-btn btn-teal">
                  <BookOpen className="quick-action-icon" />
                  Health Education
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="quick-actions-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Shield size={24} color="#14b8a6" />
            <h2 className="quick-actions-title" style={{ margin: 0 }}>
              Patient Privacy & Access
            </h2>
          </div>
          <p>
            {isDoctor
              ? `You have access to ${stats.patientCount} patients assigned to you. Patient data is protected.`
              : "Your health information is protected and secure. Only authorized providers can access it."}
          </p>
        </div>
      </div>
    </div>
  );
}