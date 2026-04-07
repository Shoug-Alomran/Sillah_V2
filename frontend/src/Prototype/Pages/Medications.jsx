// frontend/src/Prototype/Pages/Medications.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Bell,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function Medications() {
  const { currentUser, profile, isDoctor } = useAuth();
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const viewMode = useMemo(() => (isDoctor ? "doctor" : "patient"), [isDoctor]);

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [medicationsAvailable, setMedicationsAvailable] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "once_daily",
    times_per_day: 1,
    route: "oral",
    administration_times: ["09:00"],
    start_date: "",
    end_date: "",
    refill_date: "",
    instructions: "",
    side_effects: "",
    is_active: true,
    // Doctor-only fields
    prescribed_for_patient: "",
    diagnosis: "",
    duration_days: "",
  });

  useEffect(() => {
    fetchMedications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, viewMode, profile?.patient_code]);

  async function fetchMedications() {
    if (!currentUser?.id) {
      setPageError("Please log in to view medications");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError(null);

      let query = supabase
        .from("medications")
        .select("*");

      if (viewMode === "patient") {
        const filters = [
          `patient_id.eq.${currentUser.id}`,
          `user_id.eq.${currentUser.id}`,
          `prescribed_for_patient.eq.${currentUser.id}`,
        ];
        if (profile?.patient_code) {
          filters.push(`prescribed_for_patient.eq.${profile.patient_code}`);
        }
        query = query.or(filters.join(","));
      } else {
        query = query.or(`doctor_id.eq.${currentUser.id},prescribed_by.eq.${currentUser.id}`);
      }

      const { data, error } = await query
        .order("start_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST205") {
          setMedicationsAvailable(false);
          setPageError("Medications module is not configured yet in the database.");
          setMedications([]);
          return;
        }
        throw error;
      }

      let rows = data || [];

      // Keep UI role-specific even if RLS is relaxed.
      if (viewMode === "patient") {
        rows = rows.filter((row) => {
          if (row.patient_id) return row.patient_id === currentUser.id;
          if (row.user_id) return row.user_id === currentUser.id;
          if (row.prescribed_for_patient) {
            return (
              row.prescribed_for_patient === currentUser.id ||
              row.prescribed_for_patient === (profile?.patient_code || "")
            );
          }
          return true;
        });
      } else {
        rows = rows.filter((row) => {
          if (row.doctor_id) return row.doctor_id === currentUser.id;
          if (row.prescribed_by) return row.prescribed_by === currentUser.id;
          return true;
        });
      }

      rows.sort((a, b) => {
        const aDate = new Date(a?.start_date || a?.created_at || 0).getTime();
        const bDate = new Date(b?.start_date || b?.created_at || 0).getTime();
        return bDate - aDate;
      });

      setMedicationsAvailable(true);
      setMedications(rows);
    } catch (err) {
      console.error("Error fetching medications:", err);
      setPageError(err?.message || "Unable to load medications");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormError("");
    setFormData({
      medication_name: "",
      dosage: "",
      frequency: "once_daily",
      times_per_day: 1,
      route: "oral",
      administration_times: ["09:00"],
      start_date: "",
      end_date: "",
      refill_date: "",
      instructions: "",
      side_effects: "",
      is_active: true,
      prescribed_for_patient: "",
      diagnosis: "",
      duration_days: "",
    });
    setEditingMed(null);
    setShowAddModal(false);
  }

  function openCreateModal() {
    setEditingMed(null);
    setFormError("");
    setFormData((prev) => ({
      ...prev,
      medication_name: "",
      dosage: "",
      frequency: "once_daily",
      times_per_day: 1,
      route: "oral",
      administration_times: ["09:00"],
      start_date: "",
      end_date: "",
      refill_date: "",
      instructions: "",
      side_effects: "",
      is_active: true,
      prescribed_for_patient: "",
      diagnosis: "",
      duration_days: "",
    }));
    setShowAddModal(true);
  }

  function handleTimesChange(numTimesRaw) {
    const numTimes = Number.isFinite(numTimesRaw) ? numTimesRaw : 1;
    const n = Math.max(1, Math.min(6, numTimes));

    const times = [];
    const baseHour = 9; // 9 AM
    const interval = Math.max(1, Math.floor(12 / n));

    for (let i = 0; i < n; i++) {
      const hour = (baseHour + i * interval) % 24;
      times.push(`${String(hour).padStart(2, "0")}:00`);
    }

    setFormData((p) => ({ ...p, times_per_day: n, administration_times: times }));
  }

  function updateTime(index, value) {
    setFormData((p) => {
      const next = [...(p.administration_times || [])];
      next[index] = value;
      return { ...p, administration_times: next };
    });
  }

  function formatDate(dateString) {
    if (!dateString) return "Not set";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "Not set";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  async function assertPatientExists(patientRef) {
    const ref = String(patientRef || "").trim();
    if (!ref) return { ok: false, msg: "Patient code is required." };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);

    let query = supabase.from("profiles").select("id, role, full_name, email, patient_code");
    query = isUuid ? query.eq("id", ref) : query.eq("patient_code", ref);

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, msg: "No patient found with that code." };
    if (data.role !== "patient") return { ok: false, msg: "That code does not belong to a patient account." };

    const { data: link, error: linkError } = await supabase
      .from("doctor_patient")
      .select("doctor_id")
      .eq("doctor_id", currentUser.id)
      .eq("patient_id", data.id)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link) return { ok: false, msg: "You can only prescribe for patients linked to your account." };

    return { ok: true, patient: data };
  }

  async function handleAddMedication(e) {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!medicationsAvailable) return;

    // Basic validation
    if (!formData.medication_name.trim() || !formData.dosage.trim() || !formData.start_date) {
      setFormError("Please fill Medication Name, Dosage, and Start Date.");
      return;
    }
    if (formData.start_date > todayISO) {
      setFormError("Start date cannot be in the future.");
      return;
    }
    if (formData.end_date && formData.end_date < formData.start_date) {
      setFormError("End date cannot be before start date.");
      return;
    }
    if (formData.refill_date && formData.refill_date < formData.start_date) {
      setFormError("Refill reminder date cannot be before start date.");
      return;
    }

    if (isDoctor) {
      const patientCode = formData.prescribed_for_patient.trim();
      if (!patientCode) {
        setFormError("Patient code is required for doctors.");
        return;
      }
    }

    try {
      setSaving(true);
      setFormError("");

      let patientId = currentUser.id;
      let doctorId = null;

      if (viewMode === "doctor") {
        const patientRef = formData.prescribed_for_patient.trim();
        doctorId = currentUser.id;

        const check = await assertPatientExists(patientRef);
        if (!check.ok) {
          setFormError(check.msg);
          setSaving(false);
          return;
        }
        patientId = check.patient.id;
      }

      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        medication_name: formData.medication_name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency,
        times_per_day: parseInt(formData.times_per_day, 10) || 1,
        route: formData.route,
        administration_times: formData.administration_times || ["09:00"],
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        refill_date: formData.refill_date || null,
        instructions: formData.instructions || null,
        side_effects: formData.side_effects || null,
        is_active: !!formData.is_active,
        diagnosis: isDoctor ? (formData.diagnosis || null) : null,
        duration_days: isDoctor && formData.duration_days !== ""
          ? parseInt(formData.duration_days, 10)
          : null,
        updated_at: new Date().toISOString(),
      };

      if (editingMed) {
        const { data, error } = await supabase
          .from("medications")
          .update(payload)
          .eq("id", editingMed.id)
          .select("*")
          .single();

        if (error) throw error;

        setMedications((prev) => prev.map((m) => (m.id === editingMed.id ? data : m)));
        resetForm();
        return;
      }

      // create
      const { data, error } = await supabase
        .from("medications")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) throw error;

      setMedications((prev) => [data, ...prev]);
      resetForm();
    } catch (err) {
      console.error("Error saving medication:", err);
      setFormError(err?.message || "Failed to save medication");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(med) {
    setEditingMed(med);
    setFormError("");
    setFormData({
      medication_name: med.medication_name || "",
      dosage: med.dosage || "",
      frequency: med.frequency || "once_daily",
      times_per_day: med.times_per_day || 1,
      route: med.route || "oral",
      administration_times: med.administration_times || ["09:00"],
      start_date: med.start_date || "",
      end_date: med.end_date || "",
      refill_date: med.refill_date || "",
      instructions: med.instructions || "",
      side_effects: med.side_effects || "",
      is_active: med.is_active !== false,
      prescribed_for_patient: med.patient_id || "",
      diagnosis: med.diagnosis || "",
      duration_days: med.duration_days ?? "",
    });
    setShowAddModal(true);
  }

  async function handleDelete(medId) {
    if (!medicationsAvailable) return;
    if (!window.confirm("Are you sure you want to delete this medication?")) return;

    try {
      const { error } = await supabase.from("medications").delete().eq("id", medId);
      if (error) throw error;

      setMedications((prev) => prev.filter((m) => m.id !== medId));
    } catch (err) {
      console.error("Error deleting medication:", err);
      alert(err?.message || "Failed to delete medication");
    }
  }

  async function handleToggleActive(med) {
    if (!medicationsAvailable) return;
    try {
      const { data, error } = await supabase
        .from("medications")
        .update({ is_active: !med.is_active, updated_at: new Date().toISOString() })
        .eq("id", med.id)
        .select("*")
        .single();

      if (error) throw error;

      setMedications((prev) => prev.map((m) => (m.id === med.id ? data : m)));
    } catch (err) {
      console.error("Error toggling medication status:", err);
      alert(err?.message || "Failed to update medication status");
    }
  }

  const activeMedications = medications.filter((m) => m.is_active);
  const inactiveMedications = medications.filter((m) => !m.is_active);

  function renderMedicationHeader(showAction = true) {
    return (
      <div className="medications-header">
        <div>
          <h1 className="medications-title">
            <Pill className="title-icon" />
            {isDoctor ? "Prescribe Medications" : "My Medications"}
          </h1>
          <p className="medications-subtitle">
            {isDoctor
              ? "Prescribe and manage patient medications"
              : "Track your medications and get reminders"}
          </p>
        </div>

        {showAction && (
          <button onClick={openCreateModal} className="add-medication-btn" disabled={!medicationsAvailable}>
            <Plus className="btn-icon" />
            {isDoctor ? "Prescribe Medication" : "Add Medication"}
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="medications-page">
        <div className="medications-container">
          {renderMedicationHeader(false)}
          <div className="empty-state medications-status-card">
            <Pill className="empty-icon medications-status-icon" />
            <p className="empty-title">Loading medications...</p>
            <p className="empty-text">
              We are checking the patient-doctor medication records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="medications-page">
        <div className="medications-container">
          {renderMedicationHeader(false)}
          <div className="empty-state">
            <AlertCircle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">{pageError}</p>
            <button className="empty-action-btn" onClick={fetchMedications}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medications-page">
      <div className="medications-container">
        {renderMedicationHeader()}

        {/* Active Medications */}
        <div className="medications-section">
          <h2 className="section-title">Active Medications ({activeMedications.length})</h2>

          {activeMedications.length === 0 ? (
            <div className="empty-state">
              <Pill className="empty-icon" />
              <p className="empty-title">{isDoctor ? "No Active Prescriptions" : "No Active Medications"}</p>
              <p className="empty-text">
                {isDoctor
                  ? "No active prescriptions. Start by prescribing a medication to a patient."
                  : "Add your medications to track them and receive reminders."}
              </p>
              <button onClick={openCreateModal} className="empty-action-btn" disabled={!medicationsAvailable}>
                <Plus className="empty-action-icon" />
                {isDoctor ? "Prescribe Medication" : "Add Medication"}
              </button>
            </div>
          ) : (
            <div className="medications-grid">
              {activeMedications.map((med) => (
                <div key={med.id} className="medication-card">
                  <div className="medication-card-header">
                    <div className="medication-header-left">
                      <h3 className="medication-name">{med.medication_name}</h3>
                      <p className="medication-dosage">{med.dosage}</p>
                    </div>

                    <div className="medication-header-right">
                      <button onClick={() => handleEdit(med)} className="medication-edit-btn" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(med.id)} className="medication-delete-btn" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="medication-card-body">
                    <div className="medication-info-row">
                      <Clock size={16} />
                      <span>
                        <strong>Frequency:</strong> {(med.frequency || "").replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="medication-info-row">
                      <Bell size={16} />
                      <span>
                        <strong>Times:</strong> {(med.administration_times || []).join(", ")}
                      </span>
                    </div>

                    <div className="medication-info-row">
                      <Pill size={16} />
                      <span>
                        <strong>Route:</strong> {med.route}
                      </span>
                    </div>

                    <div className="medication-info-row">
                      <Calendar size={16} />
                      <span>
                        <strong>Started:</strong> {formatDate(med.start_date)}
                      </span>
                    </div>

                    {med.end_date && (
                      <div className="medication-info-row">
                        <Calendar size={16} />
                        <span>
                          <strong>Ends:</strong> {formatDate(med.end_date)}
                        </span>
                      </div>
                    )}

                    {med.refill_date && (
                      <div className="medication-refill-alert">
                        <Bell size={14} />
                        <span>Refill due: {formatDate(med.refill_date)}</span>
                      </div>
                    )}

                    {med.instructions && (
                      <div className="medication-instructions">
                        <strong>Instructions:</strong>
                        <p>{med.instructions}</p>
                      </div>
                    )}

                    <div className="medication-actions">
                      <button onClick={() => handleToggleActive(med)} className="toggle-active-btn">
                        Mark as Inactive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Medications */}
        {inactiveMedications.length > 0 && (
          <div className="medications-section">
            <h2 className="section-title">Inactive Medications ({inactiveMedications.length})</h2>

            <div className="medications-grid">
              {inactiveMedications.map((med) => (
                <div key={med.id} className="medication-card inactive">
                  <div className="medication-card-header">
                    <div className="medication-header-left">
                      <h3 className="medication-name">{med.medication_name}</h3>
                      <p className="medication-dosage">{med.dosage}</p>
                      <span className="inactive-badge">Inactive</span>
                    </div>

                    <div className="medication-header-right">
                      <button onClick={() => handleDelete(med.id)} className="medication-delete-btn" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="medication-card-body">
                    <div className="medication-actions">
                      <button onClick={() => handleToggleActive(med)} className="toggle-active-btn active">
                        Reactivate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingMed ? "Edit Medication" : isDoctor ? "Prescribe Medication" : "Add Medication"}
              </h2>
              <button onClick={resetForm} className="modal-close">
                ×
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="modal-body">
              <div className="form-content">
                {formError && (
                  <div className="auth-error" style={{ marginBottom: "12px" }}>
                    <AlertCircle className="error-icon" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="medication_name" className="form-label">
                      Medication Name *
                    </label>
                    <input
                      id="medication_name"
                      type="text"
                      value={formData.medication_name}
                      onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                      className="form-input"
                      placeholder="e.g., Metformin, Lisinopril"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="dosage" className="form-label">
                      Dosage *
                    </label>
                    <input
                      id="dosage"
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="form-input"
                      placeholder="e.g., 500mg, 10mg"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="frequency" className="form-label">
                      Frequency *
                    </label>
                    <select
                      id="frequency"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="once_daily">Once Daily</option>
                      <option value="twice_daily">Twice Daily</option>
                      <option value="three_times_daily">Three Times Daily</option>
                      <option value="four_times_daily">Four Times Daily</option>
                      <option value="as_needed">As Needed</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="route" className="form-label">
                      How Taken *
                    </label>
                    <select
                      id="route"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="oral">Oral (by mouth)</option>
                      <option value="sublingual">Sublingual (under tongue)</option>
                      <option value="topical">Topical (on skin)</option>
                      <option value="injection">Injection</option>
                      <option value="inhalation">Inhalation</option>
                      <option value="nasal">Nasal</option>
                      <option value="eye_drops">Eye Drops</option>
                      <option value="ear_drops">Ear Drops</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="times_per_day" className="form-label">
                    Times Per Day *
                  </label>
                  <input
                    id="times_per_day"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.times_per_day}
                    onChange={(e) => handleTimesChange(parseInt(e.target.value, 10))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Administration Times *</label>
                  <div className="times-grid">
                    {(formData.administration_times || []).map((time, index) => (
                      <input
                        key={index}
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                        className="form-input time-input"
                        required
                      />
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="start_date" className="form-label">
                      Start Date *
                    </label>
                    <input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="form-input"
                      max={todayISO}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="end_date" className="form-label">
                      End Date (Optional)
                    </label>
                    <input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="form-input"
                      min={formData.start_date || undefined}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="refill_date" className="form-label">
                    Refill Reminder Date
                  </label>
                  <input
                    id="refill_date"
                    type="date"
                    value={formData.refill_date}
                    onChange={(e) => setFormData({ ...formData, refill_date: e.target.value })}
                    className="form-input"
                    min={formData.start_date || undefined}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="instructions" className="form-label">
                    Instructions
                  </label>
                  <textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="e.g., Take with food"
                  />
                </div>

                {isDoctor && (
                  <>
                    <div className="form-field">
                      <label htmlFor="prescribed_for_patient" className="form-label">
                        Patient Code *
                      </label>
                      <input
                        id="prescribed_for_patient"
                        type="text"
                        value={formData.prescribed_for_patient}
                        onChange={(e) => setFormData({ ...formData, prescribed_for_patient: e.target.value })}
                        className="form-input"
                        placeholder="Enter patient code (e.g., P-AB12CD34)"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="diagnosis" className="form-label">
                        Diagnosis
                      </label>
                      <input
                        id="diagnosis"
                        type="text"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        className="form-input"
                        placeholder="e.g., Hypertension"
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="duration_days" className="form-label">
                        Duration (Days)
                      </label>
                      <input
                        id="duration_days"
                        type="number"
                        min="1"
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                        className="form-input"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </>
                )}

                <div className="form-field">
                  <label htmlFor="side_effects" className="form-label">
                    Known Side Effects
                  </label>
                  <textarea
                    id="side_effects"
                    value={formData.side_effects}
                    onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                    className="form-input form-textarea"
                    rows="2"
                    placeholder="e.g., Nausea, dizziness"
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={resetForm} className="cancel-btn" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Saving..." : editingMed ? "Update Medication" : isDoctor ? "Prescribe Medication" : "Add Medication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
