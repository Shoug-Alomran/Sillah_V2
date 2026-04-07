import React, { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Calendar, Edit, Trash2, AlertTriangle, FileText, Stethoscope } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const CONDITION_OPTIONS = [
  "Sickle Cell Disease",
  "Sickle Cell Trait",
  "Thalassemia",
  "G6PD Deficiency",
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Other"
];

const EMPTY_FORM = {
  condition_selection: "",
  custom_condition: "",
  diagnosis_date: "",
  notes: ""
};

export default function MyHealth() {
  const { currentUser, profile, isPatient } = useAuth();
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selfMember, setSelfMember] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [doctors, setDoctors] = useState([]);
  const [secondOpinionRecord, setSecondOpinionRecord] = useState(null);
  const [selectedSecondOpinionDoctor, setSelectedSecondOpinionDoctor] = useState("");
  const [secondOpinionMessage, setSecondOpinionMessage] = useState("");
  const [requestingSecondOpinion, setRequestingSecondOpinion] = useState(false);
  const [secondOpinionFeedback, setSecondOpinionFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureSelfFamilyMember() {
      if (!currentUser?.id) return null;

      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("id, user_id, full_name, relationship")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: true });

      if (membersError) throw membersError;

      const existingSelf = (members || []).find((m) => String(m.relationship || "").toLowerCase() === "self");
      if (existingSelf) return existingSelf;

      const { data: created, error: createError } = await supabase
        .from("family_members")
        .insert({
          user_id: currentUser.id,
          full_name: profile?.full_name || "Me",
          relationship: "Self",
          gender: null,
          date_of_birth: null
        })
        .select("id, user_id, full_name, relationship")
        .single();

      if (createError) throw createError;
      return created;
    }

    async function fetchData() {
      if (!currentUser?.id) {
        if (!cancelled) {
          setError("Please log in to view health records");
          setLoading(false);
        }
        return;
      }

      if (!isPatient) {
        if (!cancelled) {
          setError("My Health is available for patient accounts only.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const me = await ensureSelfFamilyMember();
        if (!me?.id) throw new Error("Unable to initialize your personal health profile.");

        const { data: history, error: historyError } = await supabase
          .from("medical_history")
          .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
          .eq("family_member_id", me.id)
          .order("diagnosis_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (historyError) throw historyError;

        if (!cancelled) {
          setSelfMember(me);
          setHealthRecords(history || []);
        }
      } catch (e) {
        console.error("Error fetching health records:", e);
        if (!cancelled) {
          setError(e?.message || "Unable to load health records");
          setHealthRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isPatient, profile?.full_name]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDoctors() {
      if (!currentUser?.id || !isPatient) return;

      const { data, error: doctorsError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "doctor")
        .order("full_name", { ascending: true });

      if (doctorsError) {
        console.error("Error loading doctors:", doctorsError);
        return;
      }

      if (!cancelled) setDoctors(data || []);
    }

    fetchDoctors();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isPatient]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingRecord(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (record) => {
    if (isDoctorReport(record)) return;

    setEditingRecord(record);
    const conditionName = String(record.condition_name || "").trim();
    const isListed = CONDITION_OPTIONS.includes(conditionName);

    setFormData({
      condition_selection: isListed ? conditionName : conditionName ? "Other" : "",
      custom_condition: isListed ? "" : conditionName,
      diagnosis_date: record.diagnosis_date || "",
      notes: record.notes || ""
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const conditionName =
      formData.condition_selection === "Other"
        ? formData.custom_condition.trim()
        : formData.condition_selection.trim();

    if (!selfMember?.id || !conditionName) {
      alert("Condition/diagnosis is required.");
      return;
    }
    if (formData.condition_selection === "Other" && !formData.custom_condition.trim()) {
      alert("Please enter the condition name for Other.");
      return;
    }
    if (formData.diagnosis_date && formData.diagnosis_date > todayISO) {
      alert("Diagnosis date cannot be in the future.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        family_member_id: selfMember.id,
        condition_name: conditionName,
        diagnosis_date: formData.diagnosis_date || null,
        notes: formData.notes?.trim() || null
      };

      if (editingRecord?.id) {
        const { data, error: updateError } = await supabase
          .from("medical_history")
          .update(payload)
          .eq("id", editingRecord.id)
          .eq("family_member_id", selfMember.id)
          .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
          .single();

        if (updateError) throw updateError;

        setHealthRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? data : r)));
      } else {
        const { data, error: insertError } = await supabase
          .from("medical_history")
          .insert(payload)
          .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
          .single();

        if (insertError) throw insertError;

        setHealthRecords((prev) => [data, ...prev]);
      }

      closeModal();
    } catch (e2) {
      console.error("Error saving health record:", e2);
      alert(e2?.message || "Failed to save health record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!selfMember?.id) return;
    const record = healthRecords.find((item) => item.id === recordId);
    if (isDoctorReport(record)) {
      alert("Doctor diagnosis reports cannot be deleted by patients.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this health record?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("medical_history")
        .delete()
        .eq("id", recordId)
        .eq("family_member_id", selfMember.id);

      if (deleteError) throw deleteError;
      setHealthRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (e) {
      console.error("Error deleting health record:", e);
      alert(e?.message || "Failed to delete health record");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const profileName = useMemo(() => selfMember?.full_name || profile?.full_name || "You", [selfMember?.full_name, profile?.full_name]);

  function isDoctorReport(record) {
    return String(record?.notes || "").trim().toLowerCase().startsWith("doctor diagnosis report");
  }

  function parseDoctorReport(record) {
    const text = String(record?.notes || "").trim();
    const sections = {};
    let currentLabel = "";

    text
      .split("\n")
      .slice(1)
      .forEach((line) => {
        const match = line.match(/^([^:\n]+):\s*$/);
        if (match) {
          currentLabel = match[1].trim();
          sections[currentLabel] = "";
          return;
        }

        if (currentLabel) {
          sections[currentLabel] = `${sections[currentLabel]}${sections[currentLabel] ? "\n" : ""}${line}`.trim();
        }
      });

    return sections;
  }

  function openSecondOpinion(record) {
    setSecondOpinionFeedback(null);
    setSecondOpinionRecord(record);
    setSelectedSecondOpinionDoctor("");
    setSecondOpinionMessage("");
  }

  function closeSecondOpinion() {
    setSecondOpinionRecord(null);
    setSelectedSecondOpinionDoctor("");
    setSecondOpinionMessage("");
  }

  async function handleSecondOpinionRequest(event) {
    event.preventDefault();
    if (!secondOpinionRecord?.id) return;
    if (!selectedSecondOpinionDoctor) {
      setSecondOpinionFeedback({ type: "error", message: "Please choose a doctor." });
      return;
    }

    try {
      setRequestingSecondOpinion(true);
      setSecondOpinionFeedback(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired. Please log in again.");

      const response = await fetch("/api/second-opinion-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          medicalHistoryId: secondOpinionRecord.id,
          requestedDoctorId: selectedSecondOpinionDoctor,
          message: secondOpinionMessage,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to request second opinion.");

      setSecondOpinionFeedback({
        type: "success",
        message: "Second opinion request sent."
      });
      closeSecondOpinion();
    } catch (requestError) {
      console.error("Error requesting second opinion:", requestError);
      setSecondOpinionFeedback({
        type: "error",
        message: requestError?.message || "Failed to request second opinion."
      });
    } finally {
      setRequestingSecondOpinion(false);
    }
  }

  if (loading) {
    return (
      <div className="my-health-page">
        <div className="my-health-container">
          <header className="my-health-header">
            <div>
              <h1 className="my-health-title">
                <Heart className="title-icon" />
                My Health Records
              </h1>
              <p className="my-health-subtitle">Loading your health records...</p>
            </div>
          </header>
          <div className="empty-state">
            <Heart className="empty-icon" style={{ animation: "pulse 2s infinite" }} />
            <p className="empty-title">Loading Health Records</p>
            <p className="empty-text">We are checking your personal and doctor-written records.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-health-page">
        <div className="my-health-container">
          <div className="empty-state">
            <AlertTriangle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">Something went wrong</p>
            <p className="empty-text">{error}</p>
            <button onClick={() => window.location.reload()} className="empty-action-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-health-page">
      <div className="my-health-container">
        <header className="my-health-header">
          <div>
            <h1 className="my-health-title">
              <Heart className="title-icon" />
              My Health Records
            </h1>
            <p className="my-health-subtitle">Track your personal conditions and diagnoses ({profileName})</p>
          </div>

          <button onClick={openAdd} className="add-record-btn" disabled={!selfMember?.id}>
            <Plus className="btn-icon" />
            Add Health Record
          </button>
        </header>

        {healthRecords.length === 0 ? (
          <div className="empty-state">
            <Heart className="empty-icon" />
            <p className="empty-title">No Health Records Yet</p>
            <p className="empty-text">Start tracking your own health conditions by adding your first record.</p>
            <button onClick={openAdd} className="empty-action-btn">
              <Plus className="empty-action-icon" />
              Add Your First Health Record
            </button>
          </div>
        ) : (
          <div className="health-records-grid">
            {healthRecords.map((record) => {
              const doctorReport = isDoctorReport(record);
              const reportSections = doctorReport ? parseDoctorReport(record) : {};

              return (
                <div key={record.id} className={`health-record-card ${doctorReport ? "doctor-report-card" : ""}`}>
                  <div className="health-card-header">
                    <div className="health-card-header-left">
                      <div className="health-title-row">
                        <h3 className="health-condition-name">{record.condition_name}</h3>
                        {doctorReport && <span className="doctor-report-badge">Doctor Report</span>}
                      </div>
                      <div className="health-diagnosis-date">
                        <Calendar size={14} />
                        <span>Diagnosed: {formatDate(record.diagnosis_date)}</span>
                      </div>
                    </div>

                    {!doctorReport && (
                      <div className="health-card-header-right">
                        <button onClick={() => openEdit(record)} className="health-edit-btn" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="health-delete-btn" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="health-card-content">
                    {doctorReport ? (
                      <>
                        <div className="doctor-report-summary">
                          <FileText size={18} />
                          <div>
                            <strong>Doctor diagnosis report</strong>
                            <p>This report was written by a doctor and is read-only for patients.</p>
                          </div>
                        </div>

                        <div className="doctor-report-sections">
                          {Object.entries(reportSections).map(([label, value]) => (
                            <div key={label} className="doctor-report-section">
                              <strong>{label}</strong>
                              <p>{value || "Not provided"}</p>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="second-opinion-btn"
                          onClick={() => openSecondOpinion(record)}
                        >
                          <Stethoscope size={18} />
                          Request Second Opinion
                        </button>
                      </>
                    ) : (
                      record.notes && (
                        <div className="health-notes-section">
                          <strong>Notes:</strong>
                          <p className="notes-text">{record.notes}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {secondOpinionFeedback && (
          <div className={`diagnosis-feedback diagnosis-feedback--${secondOpinionFeedback.type}`}>
            <Stethoscope size={18} />
            <span>{secondOpinionFeedback.message}</span>
            <button
              type="button"
              onClick={() => setSecondOpinionFeedback(null)}
              aria-label="Dismiss second opinion confirmation"
            >
              x
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingRecord ? "Edit Health Record" : "Add Health Record"}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="form-content">
                <div className="form-field">
                  <label htmlFor="condition_name" className="form-label">Condition/Diagnosis *</label>
                  <select
                    id="condition_name"
                    value={formData.condition_selection}
                    onChange={(e) => setFormData((p) => ({ ...p, condition_selection: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="">Select condition</option>
                    {CONDITION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.condition_selection === "Other" && (
                  <div className="form-field">
                    <label htmlFor="custom_condition" className="form-label">Other Condition Name</label>
                    <input
                      id="custom_condition"
                      type="text"
                      value={formData.custom_condition}
                      onChange={(e) => setFormData((p) => ({ ...p, custom_condition: e.target.value }))}
                      className="form-input"
                      placeholder="Enter uncommon condition name"
                      required
                    />
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="diagnosis_date" className="form-label">Diagnosis Date</label>
                  <input
                    id="diagnosis_date"
                    type="date"
                    value={formData.diagnosis_date}
                    onChange={(e) => setFormData((p) => ({ ...p, diagnosis_date: e.target.value }))}
                    className="form-input"
                    max={todayISO}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="form-input form-textarea"
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={closeModal} className="cancel-btn" style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem" }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Saving..." : editingRecord ? "Update Record" : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {secondOpinionRecord && (
        <div className="modal-overlay" onClick={closeSecondOpinion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Second Opinion</h2>
              <button onClick={closeSecondOpinion} className="modal-close" type="button">x</button>
            </div>

            <form onSubmit={handleSecondOpinionRequest} className="modal-body">
              <div className="form-content">
                <div className="diagnosis-report-context">
                  <Stethoscope size={18} />
                  <div>
                    <strong>{secondOpinionRecord.condition_name}</strong>
                    <p>Choose a doctor to review this diagnosis report.</p>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="second-opinion-doctor" className="form-label">Choose Doctor *</label>
                  <select
                    id="second-opinion-doctor"
                    value={selectedSecondOpinionDoctor}
                    onChange={(event) => setSelectedSecondOpinionDoctor(event.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {(doctor.full_name && doctor.full_name.trim()) || "Doctor"} - {doctor.email}
                      </option>
                    ))}
                  </select>
                  {doctors.length === 0 && (
                    <p className="inline-field-error">No doctors are available yet.</p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="second-opinion-message" className="form-label">Message for Doctor</label>
                  <textarea
                    id="second-opinion-message"
                    value={secondOpinionMessage}
                    onChange={(event) => setSecondOpinionMessage(event.target.value)}
                    className="form-input form-textarea"
                    rows={4}
                    placeholder="Optional: explain what you want reviewed or any concerns you have."
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={closeSecondOpinion} className="cancel-btn" disabled={requestingSecondOpinion}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={requestingSecondOpinion || doctors.length === 0}>
                  {requestingSecondOpinion ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
