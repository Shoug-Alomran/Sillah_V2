// frontend/src/Prototype/Pages/Patients.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Users, AlertTriangle, TrendingUp, FileText, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

export default function Patients() {
  const navigate = useNavigate();
  const { currentUser, isDoctor } = useAuth();

  const [patients, setPatients] = useState([]);
  const [secondOpinionRequests, setSecondOpinionRequests] = useState([]);
  const [secondOpinionError, setSecondOpinionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchAssignedPatients() {
      if (!currentUser) {
        setError("Please log in to view patients");
        setLoading(false);
        return;
      }

      if (!isDoctor) {
        setError("Only doctors can view assigned patients");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1) Get patient assignments for this doctor
        const { data: assignments, error: assignErr } = await supabase
          .from("doctor_patient")
          .select("patient_id")
          .eq("doctor_id", currentUser.id);

        if (assignErr) throw assignErr;

        let incomingRequests = [];
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          if (!accessToken) throw new Error("Your session has expired. Please log in again.");

          const response = await fetch("/api/second-opinion-requests", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Unable to load second opinion requests.");
          incomingRequests = result.requests || [];
          if (!cancelled) {
            setSecondOpinionRequests(incomingRequests);
            setSecondOpinionError("");
          }
        } catch (requestError) {
          console.error("Error fetching second opinion requests:", requestError);
          if (!cancelled) {
            setSecondOpinionRequests([]);
            setSecondOpinionError(requestError?.message || "Unable to load second opinion requests.");
          }
        }

        const assignedPatientIds = new Set((assignments || []).map((a) => a.patient_id));
        const requestPatientIds = incomingRequests.map((request) => request.patient_id).filter(Boolean);
        const patientIds = [...new Set([...assignedPatientIds, ...requestPatientIds])];

        if (patientIds.length === 0) {
          if (!cancelled) setPatients([]);
          return;
        }

        // 2) Fetch patient profiles
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone_number, role, patient_code, created_at")
          .in("id", patientIds)
          .eq("role", "patient");

        if (profErr) throw profErr;

        const requestProfiles = incomingRequests
          .map((request) => request.patient)
          .filter(Boolean);
        const profilesById = new Map([
          ...requestProfiles.map((profile) => [profile.id, profile]),
          ...(profiles || []).map((profile) => [profile.id, profile]),
        ]);

        // 3) Attach placeholder fields you were using in UI
        const patientsData = [...profilesById.values()].map((p) => ({
          ...p,
          family_members_count: 0, // (optional: replace later when you add a family_members table)
          risk_level: "none",       // (optional: replace later when you add risk assessments)
          is_second_opinion_only: !assignedPatientIds.has(p.id)
        }));

        if (!cancelled) setPatients(patientsData);
      } catch (err) {
        console.error("Error fetching patients:", err);
        if (!cancelled) setError(err?.message || "Unable to load patient data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAssignedPatients();
    return () => {
      cancelled = true;
    };
  }, [currentUser, isDoctor]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        (patient.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.email || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk =
        riskFilter === "all" ||
        (patient.risk_level || "none").toLowerCase() === riskFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [patients, searchTerm, riskFilter]);

  const totalPatients = patients.length;
  const highRiskCount = patients.filter(
    (p) => (p.risk_level || "none").toLowerCase() === "high"
  ).length;
  const moderateRiskCount = patients.filter(
    (p) => (p.risk_level || "none").toLowerCase() === "moderate"
  ).length;
  const totalFamilyMembers = patients.reduce(
    (sum, p) => sum + (p.family_members_count || 0),
    0
  );
  const pendingSecondOpinionCount = secondOpinionRequests.filter(
    (request) => (request.status || "pending").toLowerCase() === "pending"
  ).length;

  const formatRequestDate = (dateValue) => {
    if (!dateValue) return "Date unknown";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateValue));
  };

  const isAssignedPatient = (patientId) => {
    const patient = patients.find((item) => item.id === patientId);
    return Boolean(patient && !patient.is_second_opinion_only);
  };

  if (loading) {
    return <AppLoadingScreen title="My Patients" message="Loading patient information..." />;
  }

  if (error) {
    return (
      <div className="patients-page">
        <div className="patients-container">
          <header className="patients-header">
            <h1 className="patients-title">
              <Users className="title-icon" />
              My Patients
            </h1>
            <p className="patients-subtitle">Unable to load patients</p>
          </header>
          <div className="empty-state">
            <AlertTriangle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">{error}</p>
            <p className="empty-text">Please check your connection or try again later.</p>
            <button onClick={() => window.location.reload()} className="empty-action-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="patients-page">
        <div className="patients-container">
          <header className="patients-header">
            <h1 className="patients-title">
              <Users className="title-icon" />
              My Patients
            </h1>
            <p className="patients-subtitle">No patients assigned yet</p>
          </header>
          <div className="empty-state">
            <Users className="empty-icon" />
            <p className="empty-title">No Patients Assigned</p>
            <p className="empty-text">
              You don't have any patients assigned to you yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-page">
      <div className="patients-container">
        <header className="patients-header">
          <h1 className="patients-title">
            <Users className="title-icon" />
            My Patients
          </h1>
          <p className="patients-subtitle">
            Managing {totalPatients} patient{totalPatients !== 1 ? "s" : ""}
          </p>
        </header>

        {(secondOpinionRequests.length > 0 || secondOpinionError) && (
          <section className="second-opinion-panel">
            <div className="second-opinion-panel-header">
              <div>
                <h2 className="second-opinion-panel-title">
                  <Stethoscope className="second-opinion-panel-icon" />
                  Second Opinion Requests
                </h2>
                <p className="second-opinion-panel-subtitle">
                  Patients who specifically requested your review.
                </p>
              </div>
              <span className="second-opinion-count-badge">
                {pendingSecondOpinionCount} pending
              </span>
            </div>

            {secondOpinionError ? (
              <div className="diagnosis-feedback diagnosis-feedback--error">
                <AlertTriangle size={18} />
                <span>{secondOpinionError}</span>
              </div>
            ) : (
              <div className="second-opinion-request-list">
                {secondOpinionRequests.map((request) => {
                  const patient = request.patient || {};
                  const report = request.medical_history || {};
                  const patientIsAssigned = isAssignedPatient(request.patient_id);

                  return (
                    <article key={request.id} className="second-opinion-request-card">
                      <div className="second-opinion-request-top">
                        <div>
                          <h3>{patient.full_name || patient.email || "Patient"}</h3>
                          <p>
                            Requested {formatRequestDate(request.created_at)}
                            {patient.email ? ` • ${patient.email}` : ""}
                          </p>
                        </div>
                        <span className={`second-opinion-status second-opinion-status--${request.status || "pending"}`}>
                          {request.status || "pending"}
                        </span>
                      </div>

                      <div className="second-opinion-report-summary">
                        <FileText size={18} />
                        <div>
                          <strong>{report.condition_name || "Diagnosis report"}</strong>
                          <p>{formatRequestDate(report.diagnosis_date || report.created_at)}</p>
                        </div>
                      </div>

                      {request.message && (
                        <div className="second-opinion-note">
                          <strong>Patient message:</strong>
                          <p>{request.message}</p>
                        </div>
                      )}

                      {report.notes && (
                        <div className="second-opinion-note">
                          <strong>Doctor report:</strong>
                          <p>{report.notes}</p>
                        </div>
                      )}

                      <div className="second-opinion-actions">
                        {patientIsAssigned ? (
                          <button
                            type="button"
                            className="view-patient-details-btn"
                            onClick={() => navigate(`/patients/${request.patient_id}`)}
                          >
                            Open Patient Chart
                          </button>
                        ) : (
                          <span className="second-opinion-readonly-note">
                            Request-only access. Patient is not assigned to you yet.
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="search-filter-card">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-row">
            <Filter className="filter-icon" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="low">Low Risk</option>
              <option value="none">No Risk Assessment</option>
            </select>
          </div>
        </div>

        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Total Patients</p>
                <p className="stat-value">{totalPatients}</p>
              </div>
              <Users className="stat-icon" style={{ color: "#3b82f6", opacity: 0.2 }} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">High Risk</p>
                <p className="stat-value stat-value-red">{highRiskCount}</p>
              </div>
              <AlertTriangle className="stat-icon" style={{ color: "#ef4444", opacity: 0.2 }} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Moderate Risk</p>
                <p className="stat-value stat-value-amber">{moderateRiskCount}</p>
              </div>
              <TrendingUp className="stat-icon" style={{ color: "#f59e0b", opacity: 0.2 }} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Total Family Members</p>
                <p className="stat-value">{totalFamilyMembers}</p>
              </div>
              <Users className="stat-icon" style={{ color: "#10b981", opacity: 0.2 }} />
            </div>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <Search className="empty-icon" />
            <p className="empty-title">No patients found</p>
            <p className="empty-text">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="patient-card-component">
                <div className="patient-card-header-component">
                  <div className="patient-header-content">
                    <div className="patient-avatar-component">
                      <Users className="patient-user-icon" />
                    </div>
                    <div className="patient-info-component">
                      <h3 className="patient-name-component">
                        {patient.full_name || "Patient"}
                      </h3>
                      <p className="patient-email-component">{patient.email}</p>
                    </div>
                  </div>

                  {patient.risk_level && patient.risk_level !== "none" && (
                    <span
                      className={`patient-risk-badge-component ${
                        patient.risk_level === "high"
                          ? "status-diagnosed"
                          : patient.risk_level === "moderate"
                          ? "status-at-risk"
                          : "status-healthy"
                      }`}
                    >
                      <AlertTriangle className="risk-icon-tiny" />
                      {patient.risk_level}
                    </span>
                  )}
                  {patient.is_second_opinion_only && (
                    <span className="patient-risk-badge-component second-opinion-mini-badge">
                      <Stethoscope className="risk-icon-tiny" />
                      Second opinion
                    </span>
                  )}
                </div>

                <div className="patient-card-body-component">
                  <div className="patient-info-row-component">
                    <Users className="patient-info-icon-small" />
                    <p className="patient-info-text">
                      {patient.family_members_count || 0} family member
                      {patient.family_members_count !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* PATIENT ID DISPLAY */}
                  <div className="patient-id-section">
                    <div className="patient-id-label">PATIENT ID FOR PRESCRIBING:</div>
                    <div className="patient-id-copy-box">
                      <div className="patient-id-code">{patient.patient_code || "Not assigned"}</div>
                      <button
                        onClick={() => {
                          if (!patient.patient_code) return;
                          navigator.clipboard.writeText(patient.patient_code);
                          alert("Patient code copied to clipboard!");
                        }}
                        className="copy-id-btn-small"
                        title="Copy Patient ID"
                        type="button"
                        disabled={!patient.patient_code}
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="patient-family-count-section">
                    <button
                      onClick={() => {
                        if (!patient.is_second_opinion_only) navigate(`/patients/${patient.id}`);
                      }}
                      className="view-patient-details-btn"
                      type="button"
                      disabled={patient.is_second_opinion_only}
                    >
                      {patient.is_second_opinion_only ? "See Request Above" : "View Details"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
