import React, { useEffect, useMemo, useState } from "react";
import { Users, Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = {
  full_name: "",
  relationship: "",
  gender: "",
  date_of_birth: ""
};

const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Cousin",
  "Spouse",
  "Other"
];

export default function FamilyTree() {
  const { currentUser, isPatient } = useAuth();

  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;

    async function fetchFamilyMembers() {
      if (!currentUser?.id) {
        if (!cancelled) {
          setError("Please log in to view family members");
          setLoading(false);
        }
        return;
      }

      if (!isPatient) {
        if (!cancelled) {
          setError("Family tree is available for patient accounts only.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data, error: fetchError } = await supabase
          .from("family_members")
          .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (!cancelled) setFamilyMembers(data || []);
      } catch (err) {
        console.error("Error fetching family members:", err);
        if (!cancelled) setError(err?.message || "Unable to load family members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFamilyMembers();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isPatient]);

  const filteredMembers = useMemo(() => {
    const visibleMembers = familyMembers.filter(
      (member) => String(member.relationship || "").toLowerCase() !== "self"
    );

    const q = searchTerm.trim().toLowerCase();
    if (!q) return visibleMembers;

    return visibleMembers.filter((member) =>
      [member.full_name, member.relationship, member.gender]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [familyMembers, searchTerm]);
  const hasVisibleMembers = familyMembers.some(
    (member) => String(member.relationship || "").toLowerCase() !== "self"
  );

  function openCreateModal() {
    setEditingMember(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(member) {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name || "",
      relationship: member.relationship || "",
      gender: member.gender || "",
      date_of_birth: member.date_of_birth || ""
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingMember(null);
    setFormData(EMPTY_FORM);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!currentUser?.id || !isPatient) return;

    if (!formData.full_name.trim() || !formData.relationship.trim()) {
      alert("Full name and relationship are required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        user_id: currentUser.id,
        full_name: formData.full_name.trim(),
        relationship: formData.relationship.trim(),
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null
      };

      if (editingMember?.id) {
        const { data, error: updateError } = await supabase
          .from("family_members")
          .update(payload)
          .eq("id", editingMember.id)
          .eq("user_id", currentUser.id)
          .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
          .single();

        if (updateError) throw updateError;

        setFamilyMembers((prev) => prev.map((m) => (m.id === editingMember.id ? data : m)));
      } else {
        const { data, error: insertError } = await supabase
          .from("family_members")
          .insert(payload)
          .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
          .single();

        if (insertError) throw insertError;

        setFamilyMembers((prev) => [data, ...prev]);
      }

      closeModal();
    } catch (err) {
      console.error("Error saving family member:", err);
      alert(err?.message || "Failed to save family member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(memberId) {
    if (!currentUser?.id || !isPatient) return;
    if (!window.confirm("Are you sure you want to delete this family member?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId)
        .eq("user_id", currentUser.id);

      if (deleteError) throw deleteError;

      setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Error deleting family member:", err);
      alert(err?.message || "Failed to delete family member");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Not provided";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="family-tree-page">
        <div className="family-tree-container">
          <h1 className="family-tree-title">Family Health Tree</h1>
          <p>Loading family members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="family-tree-page">
        <div className="family-tree-container">
          <div className="empty-state">
            <AlertTriangle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">{error}</p>
            <button className="empty-action-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="family-tree-page">
      <div className="family-tree-container">
        <header className="family-tree-header">
          <div>
            <h1 className="family-tree-title">Family Health Tree</h1>
            <p className="family-tree-subtitle">Manage your family members</p>
          </div>
          <button onClick={openCreateModal} className="add-member-btn" type="button">
            <Plus className="btn-icon" />
            Add Family Member
          </button>
        </header>

        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, relationship, or gender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {!hasVisibleMembers ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <p className="empty-title">No Family Members Added Yet</p>
            <p className="empty-text">Start by adding a family member.</p>
            <button onClick={openCreateModal} className="empty-action-btn" type="button">
              <Plus className="empty-action-icon" />
              Add Your First Family Member
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <Search className="empty-icon" />
            <p className="empty-title">No matching family members</p>
            <p className="empty-text">Try a different search term.</p>
          </div>
        ) : (
          <div className="family-members-grid">
            {filteredMembers.map((member) => (
              <div key={member.id} className="family-member-card-new">
                <div className="family-card-header-new">
                  <div className="family-card-header-left">
                    <h3 className="family-member-name-new">{member.full_name || "Unnamed"}</h3>
                    <p className="family-member-relationship-new">{member.relationship || "Unknown relation"}</p>
                  </div>
                  <div className="family-card-header-right">
                    <button onClick={() => openEditModal(member)} className="family-edit-btn-new" title="Edit" type="button">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="family-delete-btn-new" title="Delete" type="button">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="family-card-content-new">
                  <p className="family-member-age-new">
                    <strong>Gender:</strong> {member.gender || "Not specified"}
                  </p>
                  <p className="family-member-age-new">
                    <strong>Date of Birth:</strong> {formatDate(member.date_of_birth)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingMember ? "Edit Family Member" : "Add Family Member"}</h2>
              <button onClick={closeModal} className="modal-close" type="button">×</button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="form-content">
                <div className="form-field">
                  <label htmlFor="full_name" className="form-label">Full Name *</label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="relationship" className="form-label">Relationship *</label>
                  <select
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData((p) => ({ ...p, relationship: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="gender" className="form-label">Gender</label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="date_of_birth" className="form-label">Date of Birth</label>
                  <input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData((p) => ({ ...p, date_of_birth: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={closeModal} className="cancel-btn" style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem" }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Saving..." : editingMember ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
