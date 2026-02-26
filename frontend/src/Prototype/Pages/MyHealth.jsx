// frontend/src/Prototype/Pages/MyHealth.jsx  (or wherever your MyHealth page lives)
import React, { useEffect, useState } from "react";
import {
  Heart,
  Plus,
  Calendar,
  Pill,
  FileText,
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function MyHealth() {
  const { currentUser } = useAuth();

  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    condition_name: "",
    diagnosis_date: "",
    current_medications: "",
    doctor_name: "",
    treatment_plan: "",
    notes: "",
    is_chronic: false,
  });

  useEffect(() => {
    fetchHealthRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  async function fetchHealthRecords() {
    if (!currentUser?.id) {
      setError("Please log in to view health records");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error: selectError } = await supabase
        .from("personal_health_records")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("diagnosis_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (selectError) throw selectError;

      setHealthRecords(data || []);
    } catch (e) {
      console.error("Error fetching health records:", e);
      setError(e?.message || "Unable to load health records");
      setHealthRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      condition_name: "",
      diagnosis_date: "",
      current_medications: "",
      doctor_name: "",
      treatment_plan: "",
      notes: "",
      is_chronic: false,
    });
    setEditingRecord(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      condition_name: record.condition_name || "",
      diagnosis_date: record.diagnosis_date || "",
      current_medications: record.current_medications || "",
      doctor_name: record.doctor_name || "",
      treatment_plan: record.treatment_plan || "",
      notes: record.notes || "",
      is_chronic: !!record.is_chronic,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) {
      alert("You must be logged in.");
      return;
    }

    if (!formData.condition_name.trim()) {
      alert("Condition/Diagnosis is required.");
      return;
    }

    if (!formData.diagnosis_date) {
      alert("Diagnosis Date is required.");
      return;
    }

    try {
      setError("");

      const payload = {
        user_id: currentUser.id,
        condition_name: formData.condition_name.trim(),
        diagnosis_date: formData.diagnosis_date,
        current_medications: formData.current_medications?.trim() || null,
        doctor_name: formData.doctor_name?.trim() || null,
        treatment_plan: formData.treatment_plan?.trim() || null,
        notes: formData.notes?.trim() || null,
        is_chronic: !!formData.is_chronic,
        updated_at: new Date().toISOString(),
      };

      if (editingRecord?.id) {
        const { error: updateError } = await supabase
          .from("personal_health_records")
          .update(payload)
          .eq("id", editingRecord.id)
          .eq("user_id", currentUser.id);

        if (updateError) throw updateError;

        alert("Health record updated successfully!");
      } else {
        const { error: insertError } = await supabase
          .from("personal_health_records")
          .insert([{ ...payload, created_at: new Date().toISOString() }]);

        if (insertError) throw insertError;

        alert("Health record added successfully!");
      }

      closeModal();
      await fetchHealthRecords();
    } catch (e2) {
      console.error("Error saving health record:", e2);
      alert(e2?.message || "Failed to save health record");
    }
  };

  const handleDelete = async (recordId) => {
    if (!currentUser?.id) return;
    if (!window.confirm("Are you sure you want to delete this health record?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("personal_health_records")
        .delete()
        .eq("id", recordId)
        .eq("user_id", currentUser.id);

      if (deleteError) throw deleteError;

      setHealthRecords((prev) => prev.filter((r) => r.id !== recordId));
      alert("Health record deleted successfully!");
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
      day: "numeric",
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
            <button onClick={fetchHealthRecords} className="empty-action-btn">
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
            <p className="my-health-subtitle">
              Your personal medical history and current treatments
            </p>
          </div>

          <button onClick={openAdd} className="add-record-btn">
            <Plus className="btn-icon" />
            Add Health Record
          </button>
        </header>

        {healthRecords.length === 0 ? (
          <div className="empty-state">
            <Heart className="empty-icon" />
            <p className="empty-title">No Health Records Yet</p>
            <p className="empty-text">
              Start tracking your personal health history by adding your diagnoses,
              medications, and treatments.
            </p>
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
                    <button
                      onClick={() => openEdit(record)}
                      className="health-edit-btn"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="health-delete-btn"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="health-card-content">
                  {record.is_chronic && (
                    <div className="chronic-badge">
                      <Activity size={14} />
                      <span>Chronic Condition</span>
                    </div>
                  )}

                  {record.doctor_name && (
                    <div className="health-info-row">
                      <strong>Doctor:</strong>
                      <span>{record.doctor_name}</span>
                    </div>
                  )}

                  {record.current_medications && (
                    <div className="health-medications-section">
                      <div className="section-header">
                        <Pill size={16} />
                        <strong>Current Medications:</strong>
                      </div>
                      <p className="medication-text">{record.current_medications}</p>
                    </div>
                  )}

                  {record.treatment_plan && (
                    <div className="health-treatment-section">
                      <div className="section-header">
                        <FileText size={16} />
                        <strong>Treatment Plan:</strong>
                      </div>
                      <p className="treatment-text">{record.treatment_plan}</p>
                    </div>
                  )}

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
              <h2 className="modal-title">
                {editingRecord ? "Edit Health Record" : "Add Health Record"}
              </h2>
              <button onClick={closeModal} className="modal-close">
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="form-content">
                <div className="form-field">
                  <label htmlFor="condition_name" className="form-label">
                    Condition/Diagnosis *
                  </label>
                  <input
                    id="condition_name"
                    type="text"
                    value={formData.condition_name}
                    onChange={(e) =>
                      setFormData({ ...formData, condition_name: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g., Type 2 Diabetes, Hypertension"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="diagnosis_date" className="form-label">
                    Diagnosis Date *
                  </label>
                  <input
                    id="diagnosis_date"
                    type="date"
                    value={formData.diagnosis_date}
                    onChange={(e) =>
                      setFormData({ ...formData, diagnosis_date: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="doctor_name" className="form-label">
                    Doctor/Healthcare Provider
                  </label>
                  <input
                    id="doctor_name"
                    type="text"
                    value={formData.doctor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, doctor_name: e.target.value })
                    }
                    className="form-input"
                    placeholder="Dr. John Smith"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="current_medications" className="form-label">
                    Current Medications
                  </label>
                  <textarea
                    id="current_medications"
                    value={formData.current_medications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_medications: e.target.value,
                      })
                    }
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="e.g., Metformin 500mg twice daily"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="treatment_plan" className="form-label">
                    Treatment Plan
                  </label>
                  <textarea
                    id="treatment_plan"
                    value={formData.treatment_plan}
                    onChange={(e) =>
                      setFormData({ ...formData, treatment_plan: e.target.value })
                    }
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="Lifestyle changes, therapies, etc."
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="notes" className="form-label">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="form-input form-textarea"
                    rows="2"
                    placeholder="Any additional information"
                  />
                </div>

                <div className="form-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_chronic}
                      onChange={(e) =>
                        setFormData({ ...formData, is_chronic: e.target.checked })
                      }
                      className="form-checkbox"
                    />
                    <span>This is a chronic condition (ongoing/long-term)</span>
                  </label>
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingRecord ? "Update Record" : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}