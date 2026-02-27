import React, { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Calendar, FileText, Edit, Trash2, AlertTriangle, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = {
  family_member_id: "",
  condition_name: "",
  diagnosis_date: "",
  notes: ""
};

export default function MyHealth() {
  const { currentUser, isPatient } = useAuth();

  const [familyMembers, setFamilyMembers] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;

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

        const { data: members, error: membersError } = await supabase
          .from("family_members")
          .select("id, full_name, relationship")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (membersError) throw membersError;

        const memberIds = (members || []).map((m) => m.id);

        let records = [];
        if (memberIds.length > 0) {
          const { data: history, error: historyError } = await supabase
            .from("medical_history")
            .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
            .in("family_member_id", memberIds)
            .order("diagnosis_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (historyError) throw historyError;
          records = history || [];
        }

        if (!cancelled) {
          setFamilyMembers(members || []);
          setHealthRecords(records);
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
  }, [currentUser?.id, isPatient]);

  const memberNameById = useMemo(() => {
    const map = new Map();
    familyMembers.forEach((m) => map.set(m.id, m.full_name || "Family Member"));
    return map;
  }, [familyMembers]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingRecord(null);
  };

  const openAdd = () => {
    resetForm();
    if (familyMembers.length === 1) {
      setFormData((prev) => ({ ...prev, family_member_id: familyMembers[0].id }));
    }
    setShowAddModal(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      family_member_id: record.family_member_id || "",
      condition_name: record.condition_name || "",
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

    if (!formData.family_member_id || !formData.condition_name.trim()) {
      alert("Family member and condition are required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        family_member_id: formData.family_member_id,
        condition_name: formData.condition_name.trim(),
        diagnosis_date: formData.diagnosis_date || null,
        notes: formData.notes?.trim() || null
      };

      if (editingRecord?.id) {
        const { data, error: updateError } = await supabase
          .from("medical_history")
          .update(payload)
          .eq("id", editingRecord.id)
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
    if (!window.confirm("Are you sure you want to delete this health record?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("medical_history")
        .delete()
        .eq("id", recordId);

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
            <p className="my-health-subtitle">Track conditions across your family members</p>
          </div>

          <button onClick={openAdd} className="add-record-btn" disabled={familyMembers.length === 0}>
            <Plus className="btn-icon" />
            Add Health Record
          </button>
        </header>

        {familyMembers.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <p className="empty-title">No Family Members Yet</p>
            <p className="empty-text">Add family members first, then you can add medical history records.</p>
          </div>
        ) : healthRecords.length === 0 ? (
          <div className="empty-state">
            <Heart className="empty-icon" />
            <p className="empty-title">No Health Records Yet</p>
            <p className="empty-text">Start tracking conditions by adding your first record.</p>
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
                  <div className="health-info-row">
                    <strong>Family Member:</strong>
                    <span>{memberNameById.get(record.family_member_id) || "Unknown"}</span>
                  </div>

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
                  <label htmlFor="family_member_id" className="form-label">Family Member *</label>
                  <select
                    id="family_member_id"
                    value={formData.family_member_id}
                    onChange={(e) => setFormData((p) => ({ ...p, family_member_id: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="">Select a family member</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.relationship || "relation"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="condition_name" className="form-label">Condition/Diagnosis *</label>
                  <input
                    id="condition_name"
                    type="text"
                    value={formData.condition_name}
                    onChange={(e) => setFormData((p) => ({ ...p, condition_name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="diagnosis_date" className="form-label">Diagnosis Date</label>
                  <input
                    id="diagnosis_date"
                    type="date"
                    value={formData.diagnosis_date}
                    onChange={(e) => setFormData((p) => ({ ...p, diagnosis_date: e.target.value }))}
                    className="form-input"
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
