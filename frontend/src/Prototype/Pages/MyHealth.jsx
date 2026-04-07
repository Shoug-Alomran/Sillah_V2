import React, { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Calendar, Edit, Trash2, AlertTriangle } from "lucide-react";
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

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingRecord(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (record) => {
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

  if (loading) {
    return (
      <div className="my-health-page">
        <div className="my-health-container">
          <h1 className="my-health-title">My Health Records</h1>
          <p>Loading your health records...</p>
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
            {healthRecords.map((record) => (
              <div key={record.id} className="health-record-card">
                <div className="health-card-header">
                  <div className="health-card-header-left">
                    <h3 className="health-condition-name">{record.condition_name}</h3>
                    <div className="health-diagnosis-date">
                      <Calendar size={14} />
                      <span>Diagnosed: {formatDate(record.diagnosis_date)}</span>
                    </div>
                  </div>

                  <div className="health-card-header-right">
                    <button onClick={() => openEdit(record)} className="health-edit-btn" title="Edit">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="health-delete-btn" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="health-card-content">
                  {record.notes && (
                    <div className="health-notes-section">
                      <strong>Notes:</strong>
                      <p className="notes-text">{record.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}
