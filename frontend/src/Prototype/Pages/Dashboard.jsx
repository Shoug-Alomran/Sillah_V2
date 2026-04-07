import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, BookOpen, Users, Activity, Stethoscope, AlertTriangle, FileText, Shield, ClipboardCheck, BadgeCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../contexts/LanguageContext";
import OnboardingPrompt from "../../Components/OnboardingPrompt";
import Tooltip from "../../Components/Tooltip";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

export default function Dashboard() {
  const { currentUser, profile, isAdmin, isDoctor, deleteAccount } = useAuth();
  const { language, t } = useLanguage();

  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentCount: 0,
    healthRecordsCount: 0,
    familyMembersCount: 0,
    unreadAlertsCount: 0,
    highRiskCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      if (!currentUser?.id) return;

      try {
        setLoading(true);

        if (isAdmin) {
          if (!cancelled) {
            setStats((s) => ({
              ...s,
              patientCount: 0,
              appointmentCount: 0,
              healthRecordsCount: 0,
              familyMembersCount: 0,
              unreadAlertsCount: 0,
              highRiskCount: 0
            }));
          }
        } else if (isDoctor) {
          const { data: assignedPatients, error: dpErr } = await supabase
            .from("doctor_patient")
            .select("patient_id")
            .eq("doctor_id", currentUser.id);
          if (dpErr) throw dpErr;
          const patientIds = assignedPatients?.map((row) => row.patient_id).filter(Boolean) || [];
          const patientCount = patientIds.length;

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

          let highRiskCount = 0;
          if (patientIds.length > 0) {
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
          const { data: familyMembers, error: fmErr } = await supabase
            .from("family_members")
            .select("id, relationship")
            .eq("user_id", currentUser.id);
          if (fmErr) throw fmErr;
          const allFamilyMembers = familyMembers || [];
          const visibleFamilyMembers = allFamilyMembers.filter(
            (member) => String(member.relationship || "").toLowerCase() !== "self"
          );
          const familyMembersCount = visibleFamilyMembers.length;
          const selfMember = allFamilyMembers.find(
            (member) => String(member.relationship || "").toLowerCase() === "self"
          );

          const { count: appointmentCount, error: apptErr } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", currentUser.id)
            .gte("appointment_date", todayISO);
          if (apptErr) console.warn("Appointments count skipped:", apptErr.message);

          let healthRecordsCount = 0;
          if (selfMember?.id) {
            const { count, error: mhErr } = await supabase
              .from("medical_history")
              .select("*", { count: "exact", head: true })
              .eq("family_member_id", selfMember.id);
            if (mhErr) console.warn("Medical history count skipped:", mhErr.message);
            healthRecordsCount = count || 0;
          }

          const { count: unreadAlertsCount, error: raErr } = await supabase
            .from("risk_alerts")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", currentUser.id);
          if (raErr) console.warn("Alerts count skipped:", raErr.message);

          if (!cancelled) {
            setStats((s) => ({
              ...s,
              familyMembersCount,
              appointmentCount: appointmentCount || 0,
              healthRecordsCount,
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
  }, [currentUser?.id, isAdmin, isDoctor, todayISO]);

  if (loading) {
    return <AppLoadingScreen title="Dashboard" message="Loading your dashboard..." />;
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      setDeleteError(t("dashboard.deleteMismatch"));
      return;
    }

    try {
      setDeleteError("");
      setDeleting(true);
      await deleteAccount(deleteConfirmation);
      window.location.assign("/login");
    } catch (error) {
      console.error("Delete account error:", error);
      setDeleteError(error?.message || t("dashboard.deleteErrorGeneric"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            {t("dashboard.welcome", { name: profile?.full_name || "User" })}
          </h1>
          <p className="dashboard-subtitle">
            {isAdmin ? "Hospital Admin Portal" : isDoctor ? t("dashboard.doctorSubtitle") : t("dashboard.patientSubtitle")}
          </p>
          <p className="dashboard-welcome">
            {new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <OnboardingPrompt
          storageKey="sillah-dashboard-onboarding"
          title={t("dashboard.firstTimeTitle")}
          body={t("dashboard.firstTimeBody")}
        />

        <div className="stats-grid">
          {isAdmin ? (
            <>
              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Admin Scope</p>
                    <h3 className="stat-value">No Patient PHI</h3>
                  </div>
                  <div className="stat-icon-wrapper from-teal-500">
                    <Shield className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Doctor Profiles</p>
                    <h3 className="stat-value">Review</h3>
                  </div>
                  <div className="stat-icon-wrapper from-purple-500">
                    <ClipboardCheck className="stat-icon" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <p className="stat-label">Access Level</p>
                    <h3 className="stat-value">Admin</h3>
                  </div>
                  <div className="stat-icon-wrapper from-blue-500">
                    <BadgeCheck className="stat-icon" />
                  </div>
                </div>
              </div>
            </>
          ) : isDoctor ? (
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
          <h2 className="quick-actions-title">{t("dashboard.quickActions")}</h2>
          <div className="quick-actions-grid">
            {isAdmin ? (
              <>
                <Link to="/admin/doctor-verification" className="quick-action-btn btn-teal">
                  <ClipboardCheck className="quick-action-icon" />
                  Review Doctor Profiles
                </Link>
                <Link to="/awareness-hub" className="quick-action-btn btn-blue">
                  <BookOpen className="quick-action-icon" />
                  Public Health Resources
                </Link>
              </>
            ) : isDoctor ? (
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
              {t("dashboard.privacy")}
            </h2>
          </div>
          <p>
            {isDoctor
              ? `You have access to ${stats.patientCount} patients assigned to you. Patient data is protected.`
              : isAdmin
              ? "Admins can verify doctor credentials and manage operational trust, but cannot browse patient medical records in this portal."
              : "Your health information is protected and secure. Only authorized providers can access it."}
          </p>
        </div>

        <div className="quick-actions-card danger-zone-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <AlertTriangle size={24} color="#dc2626" />
            <h2 className="quick-actions-title" style={{ margin: 0 }}>
              {t("dashboard.accountSafety")}
            </h2>
          </div>
          <h3 className="danger-zone-title">{t("dashboard.deleteTitle")}</h3>
          <p className="danger-zone-text">{t("dashboard.deleteBody")}</p>
          <p className="danger-zone-warning">{t("dashboard.deleteWarning")}</p>

          <div className="form-field" style={{ maxWidth: "22rem" }}>
            <label htmlFor="delete-confirmation" className="form-label">
              {t("dashboard.deleteConfirmLabel")}
              <Tooltip content={t("dashboard.deleteConfirmHelp")} iconOnly>
                <span className="label-help">?</span>
              </Tooltip>
            </label>
            <input
              id="delete-confirmation"
              type="text"
              value={deleteConfirmation}
              onChange={(e) => {
                setDeleteConfirmation(e.target.value);
                setDeleteError("");
              }}
              className={`form-input ${deleteError ? "form-input--error" : ""}`}
              placeholder={t("dashboard.deletePlaceholder")}
              disabled={deleting}
            />
            {deleteError && <p className="inline-field-error">{deleteError}</p>}
          </div>

          <button
            type="button"
            className="danger-zone-button"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? t("dashboard.deleting") : t("dashboard.deleteButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
