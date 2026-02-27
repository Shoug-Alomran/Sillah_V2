import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, User, Mail, Phone, AlertTriangle, Users, FileText, Calendar, Copy } from "lucide-react";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function PatientDetail() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { isDoctor, currentUser } = useAuth();

  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          .select("id, clinic_name, appointment_date, appointment_time, reason, status, created_at")
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

  const hereditaryCount = useMemo(() => {
    return medicalHistory.filter((row) => {
      const text = `${row.condition_name || ""} ${row.notes || ""}`.toLowerCase();
      return text.includes("sickle") || text.includes("heredit") || text.includes("genetic");
    }).length;
  }, [medicalHistory]);

  const copyPatientCode = () => {
    if (!patient?.patient_code) return;
    navigator.clipboard.writeText(patient.patient_code);
    alert("Patient code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="patients-page">
        <div className="patients-container">
          <div className="empty-message">Loading patient data...</div>
        </div>
      </div>
    );
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
          </div>

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
    </div>
  );
}
