import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, User, Mail, Phone, AlertTriangle, Users, FileText, Calendar, Copy, Plus } from "lucide-react";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import AppLoadingScreen from "../../Components/AppLoadingScreen";
import { analyzeRisk } from "../../utils/riskAssessment";

const EMPTY_DIAGNOSIS_REPORT = {
  diagnosis: "",
  diagnosis_date: "",
  symptoms: "",
  assessment: "",
  treatment_plan: "",
  follow_up: ""
};

export default function PatientDetail() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { isDoctor, currentUser } = useAuth();
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState(EMPTY_DIAGNOSIS_REPORT);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [diagnosisFeedback, setDiagnosisFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPatientData() {
      try {
        setLoading(true);
        setError("");

        if (!currentUser?.id) {
          setError("Please log in.");
          return;
        }

        if (!isDoctor) {
          setError("Only doctors can view patient details.");
          return;
        }

        if (!patientId) {
          setError("Missing patient id.");
          return;
        }

        const { data: assignment, error: assignErr } = await supabase
          .from("doctor_patient")
          .select("doctor_id, patient_id")
          .eq("doctor_id", currentUser.id)
          .eq("patient_id", patientId)
          .maybeSingle();

        if (assignErr) throw assignErr;
        if (!assignment) {
          setError("This patient is not assigned to you.");
          return;
        }

        const { data: patientProfile, error: patientErr } = await supabase
          .from("profiles")
          .select("id, email, full_name, phone_number, role, patient_code, created_at")
          .eq("id", patientId)
          .eq("role", "patient")
          .maybeSingle();

        if (patientErr) throw patientErr;
        if (!patientProfile) {
          setError("Patient not found.");
          return;
        }

        const { data: fam, error: famErr } = await supabase
          .from("family_members")
          .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
          .eq("user_id", patientId)
          .order("created_at", { ascending: false });

        if (famErr) throw famErr;

        const familyMemberIds = (fam || []).map((m) => m.id);

        let historyRows = [];
        if (familyMemberIds.length > 0) {
          const { data: historyData, error: historyErr } = await supabase
            .from("medical_history")
            .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
            .in("family_member_id", familyMemberIds)
            .order("diagnosis_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (historyErr) throw historyErr;
          historyRows = historyData || [];
        }

        const { data: appts, error: apptErr } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .order("appointment_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (apptErr) throw apptErr;

        if (cancelled) return;

        setPatient(patientProfile);
        setFamilyMembers(fam || []);
        setMedicalHistory(historyRows);
        setAppointments(appts || []);
      } catch (err) {
        console.error("Error fetching patient data:", err);
        if (!cancelled) setError(err?.message || "Failed to load patient data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPatientData();
    return () => {
      cancelled = true;
    };
  }, [patientId, currentUser?.id, isDoctor]);

  const memberNameById = useMemo(() => {
    const map = new Map();
    familyMembers.forEach((member) => {
      map.set(member.id, member.full_name || "Family Member");
    });
    return map;
  }, [familyMembers]);

  const hereditaryCount = useMemo(
    () => analyzeRisk(familyMembers, medicalHistory).counts.familyRiskRecords,
    [familyMembers, medicalHistory]
  );

  const copyPatientCode = () => {
    if (!patient?.patient_code) return;
    navigator.clipboard.writeText(patient.patient_code);
    alert("Patient code copied to clipboard!");
  };

  function closeDiagnosisModal() {
    setShowDiagnosisModal(false);
    setDiagnosisReport(EMPTY_DIAGNOSIS_REPORT);
  }

  function openDiagnosisModal() {
    setDiagnosisFeedback(null);
    setShowDiagnosisModal(true);
  }

  function buildDiagnosisReportNotes() {
    const sections = [
      ["Symptoms / Concerns", diagnosisReport.symptoms],
      ["Clinical Assessment", diagnosisReport.assessment],
      ["Treatment Plan", diagnosisReport.treatment_plan],
      ["Follow-up Instructions", diagnosisReport.follow_up],
      ["Recorded By", currentUser?.email || "Assigned doctor"]
    ];

    const body = sections
      .filter(([, value]) => String(value || "").trim() !== "")
      .map(([label, value]) => `${label}:\n${String(value).trim()}`)
      .join("\n\n");

    return `Doctor Diagnosis Report${body ? `\n\n${body}` : ""}`;
  }

  async function ensurePatientSelfMemberDirect() {
    const existingSelf = familyMembers.find(
      (member) => String(member.relationship || "").trim().toLowerCase() === "self"
    );
    if (existingSelf?.id) return existingSelf;

    const { data, error: createError } = await supabase
      .from("family_members")
      .insert({
        user_id: patientId,
        full_name: patient?.full_name || "Patient",
        relationship: "Self",
        gender: null,
        date_of_birth: null
      })
      .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
      .single();

    if (createError) throw createError;
    setFamilyMembers((prev) => [data, ...prev]);
    return data;
  }

  async function saveDiagnosisReportDirect(diagnosisName) {
    const selfMember = await ensurePatientSelfMemberDirect();

    const { data, error: insertError } = await supabase
      .from("medical_history")
      .insert({
        family_member_id: selfMember.id,
        condition_name: diagnosisName,
        diagnosis_date: diagnosisReport.diagnosis_date || todayISO,
        notes: buildDiagnosisReportNotes()
      })
      .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
      .single();

    if (insertError) throw insertError;
    return { report: data, selfMember };
  }

  async function handleSaveDiagnosisReport(event) {
    event.preventDefault();

    const diagnosisName = diagnosisReport.diagnosis.trim();
    if (!diagnosisName) {
      alert("Diagnosis is required.");
      return;
    }
    if (diagnosisReport.diagnosis_date && diagnosisReport.diagnosis_date > todayISO) {
      alert("Diagnosis date cannot be in the future.");
      return;
    }

    try {
      setSavingDiagnosis(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired. Please log in again.");

      const response = await fetch("/api/diagnosis-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          patientId,
          diagnosis: diagnosisName,
          diagnosisDate: diagnosisReport.diagnosis_date || todayISO,
          symptoms: diagnosisReport.symptoms,
          assessment: diagnosisReport.assessment,
          treatmentPlan: diagnosisReport.treatment_plan,
          followUp: diagnosisReport.follow_up,
        }),
      });

      let result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn("Diagnosis report API failed; trying Supabase RLS fallback.", result.error);
        result = await saveDiagnosisReportDirect(diagnosisName);
      }

      if (result.selfMember) {
        setFamilyMembers((prev) => {
          if (prev.some((member) => member.id === result.selfMember.id)) return prev;
          return [result.selfMember, ...prev];
        });
      }
      setMedicalHistory((prev) => [result.report, ...prev]);
      setDiagnosisFeedback({
        type: "success",
        message: "Diagnosis report saved to this patient's medical history."
      });
      closeDiagnosisModal();
    } catch (saveError) {
      console.error("Error saving diagnosis report:", saveError);
      setDiagnosisFeedback({
        type: "error",
        message: saveError?.message || "Failed to save diagnosis report."
      });
    } finally {
      setSavingDiagnosis(false);
    }
  }

  if (loading) {
    return <AppLoadingScreen title="Patient Details" message="Loading patient data..." />;
  }

  if (error || !patient) {
    return (
      <div className="patients-page">
        <div className="patients-container">
          <div className="empty-state">
            <AlertTriangle className="empty-icon" />
            <p className="empty-title">{error || "Patient not found"}</p>
            <button onClick={() => navigate("/patients")} className="empty-action-btn">
              <ArrowLeft className="empty-action-icon" />
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-page">
      <div className="patients-container">
        <button
          onClick={() => navigate("/patients")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            cursor: "pointer",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#4b5563"
          }}
          type="button"
        >
          <ArrowLeft size={16} />
          Back to Patients
        </button>

        <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: "4rem", height: "4rem", background: "linear-gradient(135deg, #14b8a6, #06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={32} color="white" />
              </div>

              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>{patient.full_name || "Unknown Patient"}</h1>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#6b7280", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Mail size={14} />
                    {patient.email || "No email"}
                  </div>
                  {patient.phone_number && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Phone size={14} />
                      {patient.phone_number}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={openDiagnosisModal}
              className="diagnosis-report-btn"
              type="button"
            >
              <Plus size={18} />
              Add Diagnosis Report
            </button>
          </div>

          {diagnosisFeedback && (
            <div className={`diagnosis-feedback diagnosis-feedback--${diagnosisFeedback.type}`}>
              <FileText size={18} />
              <span>{diagnosisFeedback.message}</span>
              <button
                type="button"
                onClick={() => setDiagnosisFeedback(null)}
                aria-label="Dismiss confirmation"
              >
                x
              </button>
            </div>
          )}

          <div style={{ background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: "0.5rem", padding: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Copy size={16} color="#2563eb" />
              <strong style={{ color: "#1e40af", fontSize: "0.875rem" }}>PATIENT CODE (USE THIS TO PRESCRIBE MEDICATIONS)</strong>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={patient.patient_code || "Not assigned"}
                readOnly
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "1px solid #93c5fd",
                  borderRadius: "0.375rem",
                  background: "white",
                  fontFamily: "monospace",
                  fontSize: "0.875rem"
                }}
              />
              <button
                onClick={copyPatientCode}
                style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
                type="button"
                disabled={!patient.patient_code}
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Family Members</p>
                <h3 className="stat-value">{familyMembers.length}</h3>
              </div>
              <div className="stat-icon-wrapper from-blue-500">
                <Users className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Medical Records</p>
                <h3 className="stat-value">{medicalHistory.length}</h3>
              </div>
              <div className="stat-icon-wrapper from-purple-500">
                <FileText className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Possible Hereditary</p>
                <h3 className="stat-value">{hereditaryCount}</h3>
              </div>
              <div className="stat-icon-wrapper from-green-500">
                <AlertTriangle className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Appointments</p>
                <h3 className="stat-value">{appointments.length}</h3>
              </div>
              <div className="stat-icon-wrapper from-teal-500">
                <Calendar className="stat-icon" />
              </div>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="activity-card-header">
            <h2 className="activity-card-title">Family Members</h2>
          </div>
          <div className="activity-card-content">
            {familyMembers.length === 0 ? (
              <p className="empty-message">No family members recorded.</p>
            ) : (
              <div className="members-grid">
                {familyMembers.map((member) => (
                  <div key={member.id} className="member-card-component">
                    <div className="member-card-header-component">
                      <div className="member-header-content">
                        <div className="member-avatar-icon">
                          <User className="user-icon" />
                        </div>
                        <div className="member-info-text">
                          <h3 className="member-name-text">{member.full_name || "Unnamed"}</h3>
                          <p className="member-relation-text">{member.relationship || "Unknown relation"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="member-card-body-component">
                      <div className="member-detail-row-component">
                        <span className="detail-label-component">Gender:</span>
                        <span className="detail-value-component">{member.gender || "Unknown"}</span>
                      </div>
                      <div className="member-detail-row-component">
                        <span className="detail-label-component">DOB:</span>
                        <span className="detail-value-component">
                          {member.date_of_birth ? format(new Date(member.date_of_birth), "MMM d, yyyy") : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="activity-card">
          <div className="activity-card-header">
            <h2 className="activity-card-title">Medical History</h2>
          </div>
          <div className="activity-card-content">
            {medicalHistory.length === 0 ? (
              <p className="empty-message">No medical history records available.</p>
            ) : (
              <div className="health-records-list">
                {medicalHistory.map((record) => (
                  <div key={record.id} className="health-record-card">
                    <div className="record-header">
                      <div className="record-header-content">
                        <h3 className="record-diagnosis">{record.condition_name || "Condition"}</h3>
                        <p className="record-date">
                          {record.diagnosis_date ? format(new Date(record.diagnosis_date), "MMM d, yyyy") : "Date unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="record-body">
                      <div className="record-info-row">
                        <span className="info-label">Family Member:</span>
                        <span className="info-value">{memberNameById.get(record.family_member_id) || "Unknown"}</span>
                      </div>
                      {record.notes && (
                        <div className="record-detail-box">
                          <p className="detail-text">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="activity-card">
          <div className="activity-card-header">
            <h2 className="activity-card-title">Appointment History</h2>
          </div>
          <div className="activity-card-content">
            {appointments.length === 0 ? (
              <p className="empty-message">No appointments scheduled.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {appointments.map((apt) => (
                  <div key={apt.id} className="appointment-item">
                    <h4 className="appointment-item-title">{apt.clinic_name || "Clinic Visit"}</h4>
                    <p className="appointment-item-details">
                      {apt.appointment_date ? format(new Date(apt.appointment_date), "EEEE, MMM d, yyyy") : "Date TBD"}
                      {apt.appointment_time && ` at ${apt.appointment_time}`}
                    </p>
                    {apt.reason && (
                      <p className="appointment-item-details" style={{ marginTop: "0.25rem" }}>
                        <strong>Reason:</strong> {apt.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDiagnosisModal && (
        <div className="modal-overlay" onClick={closeDiagnosisModal}>
          <div className="modal-content large-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Doctor Diagnosis Report</h2>
              <button onClick={closeDiagnosisModal} className="modal-close" type="button">
                x
              </button>
            </div>

            <form onSubmit={handleSaveDiagnosisReport} className="modal-body">
              <div className="form-content">
                <div className="diagnosis-report-context">
                  <FileText size={18} />
                  <div>
                    <strong>Patient:</strong> {patient.full_name || patient.email || "Patient"}
                    <p>This report will be saved to the patient's personal medical history.</p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="doctor-diagnosis" className="form-label">Diagnosis *</label>
                    <input
                      id="doctor-diagnosis"
                      type="text"
                      value={diagnosisReport.diagnosis}
                      onChange={(event) =>
                        setDiagnosisReport((prev) => ({ ...prev, diagnosis: event.target.value }))
                      }
                      className="form-input"
                      placeholder="e.g., Hypertension, Heart Condition"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="doctor-diagnosis-date" className="form-label">Diagnosis Date</label>
                    <input
                      id="doctor-diagnosis-date"
                      type="date"
                      value={diagnosisReport.diagnosis_date}
                      onChange={(event) =>
                        setDiagnosisReport((prev) => ({ ...prev, diagnosis_date: event.target.value }))
                      }
                      className="form-input"
                      max={todayISO}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="doctor-symptoms" className="form-label">Symptoms / Concerns</label>
                  <textarea
                    id="doctor-symptoms"
                    value={diagnosisReport.symptoms}
                    onChange={(event) =>
                      setDiagnosisReport((prev) => ({ ...prev, symptoms: event.target.value }))
                    }
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="Summarize symptoms, concerns, or reason for diagnosis."
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="doctor-assessment" className="form-label">Clinical Assessment</label>
                  <textarea
                    id="doctor-assessment"
                    value={diagnosisReport.assessment}
                    onChange={(event) =>
                      setDiagnosisReport((prev) => ({ ...prev, assessment: event.target.value }))
                    }
                    className="form-input form-textarea"
                    rows="4"
                    placeholder="Document findings, risk context, and clinical reasoning."
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="doctor-treatment-plan" className="form-label">Treatment Plan</label>
                  <textarea
                    id="doctor-treatment-plan"
                    value={diagnosisReport.treatment_plan}
                    onChange={(event) =>
                      setDiagnosisReport((prev) => ({ ...prev, treatment_plan: event.target.value }))
                    }
                    className="form-input form-textarea"
                    rows="4"
                    placeholder="Recommended medication, lifestyle changes, referrals, or testing."
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="doctor-follow-up" className="form-label">Follow-up Instructions</label>
                  <textarea
                    id="doctor-follow-up"
                    value={diagnosisReport.follow_up}
                    onChange={(event) =>
                      setDiagnosisReport((prev) => ({ ...prev, follow_up: event.target.value }))
                    }
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="Next appointment, warning signs, or monitoring instructions."
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={closeDiagnosisModal} className="cancel-btn" disabled={savingDiagnosis}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={savingDiagnosis}>
                  {savingDiagnosis ? "Saving..." : "Save Diagnosis Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
