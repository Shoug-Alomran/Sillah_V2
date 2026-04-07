import React, { useEffect, useMemo, useState } from "react";
import { Users, Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../contexts/LanguageContext";
import OnboardingPrompt from "../../Components/OnboardingPrompt";
import Tooltip from "../../Components/Tooltip";

const EMPTY_FORM = {
  full_name: "",
  relationship: "",
  gender: "",
  date_of_birth: "",
  condition_selection: "",
  custom_condition: "",
  diagnosis_date: "",
  condition_notes: ""
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

export default function FamilyTree() {
  const { currentUser, isPatient } = useAuth();
  const { language, t } = useLanguage();
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [latestConditionsByMember, setLatestConditionsByMember] = useState({});
  const [formErrors, setFormErrors] = useState({});

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

        const members = data || [];
        const memberIds = members.map((m) => m.id);
        let latestByMember = {};

        if (memberIds.length > 0) {
          const { data: history, error: historyError } = await supabase
            .from("medical_history")
            .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
            .in("family_member_id", memberIds)
            .order("diagnosis_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (historyError) throw historyError;

          latestByMember = (history || []).reduce((acc, row) => {
            if (!acc[row.family_member_id]) acc[row.family_member_id] = row;
            return acc;
          }, {});
        }

        if (!cancelled) {
          setFamilyMembers(members);
          setLatestConditionsByMember(latestByMember);
        }
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
      [member.full_name, member.relationship, member.gender, latestConditionsByMember[member.id]?.condition_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [familyMembers, latestConditionsByMember, searchTerm]);
  const hasVisibleMembers = familyMembers.some(
    (member) => String(member.relationship || "").toLowerCase() !== "self"
  );

  function mapConditionToForm(conditionName) {
    const name = String(conditionName || "").trim();
    if (!name) return { condition_selection: "", custom_condition: "" };
    if (CONDITION_OPTIONS.includes(name)) return { condition_selection: name, custom_condition: "" };
    return { condition_selection: "Other", custom_condition: name };
  }

  function openCreateModal() {
    setEditingMember(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEditModal(member) {
    setEditingMember(member);
    const latestCondition = latestConditionsByMember[member.id]?.condition_name || "";
    const mappedCondition = mapConditionToForm(latestCondition);
    setFormData({
      full_name: member.full_name || "",
      relationship: member.relationship || "",
      gender: member.gender || "",
      date_of_birth: member.date_of_birth || "",
      condition_selection: mappedCondition.condition_selection,
      custom_condition: mappedCondition.custom_condition,
      diagnosis_date: latestConditionsByMember[member.id]?.diagnosis_date || "",
      condition_notes: latestConditionsByMember[member.id]?.notes || ""
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingMember(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  }

  function isFutureDate(dateStr) {
    if (!dateStr) return false;
    return dateStr > todayISO;
  }

  function validateMemberForm(values = formData) {
    const errors = {};
    if (!values.full_name.trim()) errors.full_name = t("family.validationName");
    if (!values.relationship.trim()) errors.relationship = t("family.validationRelationship");
    if (isFutureDate(values.date_of_birth)) errors.date_of_birth = t("family.validationDateFuture");
    return errors;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!currentUser?.id || !isPatient) return;

    const nextErrors = validateMemberForm();
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    if (isFutureDate(formData.diagnosis_date)) {
      alert("Diagnosis date cannot be in the future.");
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

      let savedMember = null;

      if (editingMember?.id) {
        const { data, error: updateError } = await supabase
          .from("family_members")
          .update(payload)
          .eq("id", editingMember.id)
          .eq("user_id", currentUser.id)
          .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
          .single();

        if (updateError) throw updateError;
        savedMember = data;

        setFamilyMembers((prev) => prev.map((m) => (m.id === editingMember.id ? data : m)));
      } else {
        const { data, error: insertError } = await supabase
          .from("family_members")
          .insert(payload)
          .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
          .single();

        if (insertError) throw insertError;
        savedMember = data;

        setFamilyMembers((prev) => [data, ...prev]);
      }

      if (savedMember?.id) {
        const existingCondition = latestConditionsByMember[savedMember.id];
        const conditionName =
          formData.condition_selection === "Other"
            ? formData.custom_condition.trim()
            : formData.condition_selection.trim();

        if (formData.condition_selection === "Other" && !conditionName) {
          alert("Please enter the condition name for Other.");
          setSaving(false);
          return;
        }

        const conditionPayload = {
          condition_name: conditionName,
          diagnosis_date: formData.diagnosis_date || null,
          notes: formData.condition_notes?.trim() || null
        };

        if (conditionPayload.condition_name) {
          if (existingCondition?.id) {
            const { data: updatedCondition, error: conditionUpdateError } = await supabase
              .from("medical_history")
              .update(conditionPayload)
              .eq("id", existingCondition.id)
              .eq("family_member_id", savedMember.id)
              .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
              .single();

            if (conditionUpdateError) throw conditionUpdateError;

            setLatestConditionsByMember((prev) => ({ ...prev, [savedMember.id]: updatedCondition }));
          } else {
            const { data: insertedCondition, error: conditionInsertError } = await supabase
              .from("medical_history")
              .insert({
                family_member_id: savedMember.id,
                ...conditionPayload
              })
              .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
              .single();

            if (conditionInsertError) throw conditionInsertError;

            setLatestConditionsByMember((prev) => ({ ...prev, [savedMember.id]: insertedCondition }));
          }
        }
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
      const { error: historyDeleteError } = await supabase
        .from("medical_history")
        .delete()
        .eq("family_member_id", memberId);
      if (historyDeleteError) throw historyDeleteError;

      const { error: deleteError } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId)
        .eq("user_id", currentUser.id);

      if (deleteError) throw deleteError;

      setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
      setLatestConditionsByMember((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } catch (err) {
      console.error("Error deleting family member:", err);
      alert(err?.message || "Failed to delete family member");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Not provided";
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="family-tree-page">
        <div className="family-tree-container">
          <header className="family-tree-header">
            <div>
              <h1 className="family-tree-title">{t("family.title")}</h1>
              <p className="family-tree-subtitle">Loading family members...</p>
            </div>
          </header>
          <div className="empty-state">
            <Users className="empty-icon" style={{ animation: "pulse 2s infinite" }} />
            <p className="empty-title">Loading Family Tree</p>
            <p className="empty-text">We are preparing your family health records.</p>
          </div>
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
              {t("common.tryAgain")}
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
            <h1 className="family-tree-title">{t("family.title")}</h1>
            <p className="family-tree-subtitle">{t("family.subtitle")}</p>
          </div>
          <button onClick={openCreateModal} className="add-member-btn" type="button">
            <Plus className="btn-icon" />
            {t("family.add")}
          </button>
        </header>

        <OnboardingPrompt
          storageKey="sillah-family-onboarding"
          title={t("family.firstTimeTitle")}
          body={t("family.firstTimeBody")}
          actionLabel={t("family.firstTimeAction")}
          onAction={openCreateModal}
        />

        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder={t("family.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {!hasVisibleMembers ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <p className="empty-title">{t("family.emptyTitle")}</p>
            <p className="empty-text">{t("family.emptyText")}</p>
            <button onClick={openCreateModal} className="empty-action-btn" type="button">
              <Plus className="empty-action-icon" />
              {t("family.addFirst")}
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <Search className="empty-icon" />
            <p className="empty-title">{t("family.noMatches")}</p>
            <p className="empty-text">{t("family.noMatchesBody")}</p>
          </div>
        ) : (
          <div className="family-members-grid">
            {filteredMembers.map((member) => (
              <div key={member.id} className="family-member-card-new">
                <div className="family-card-header-new">
                  <div className="family-card-header-left">
                    <h3 className="family-member-name-new">{member.full_name || t("family.unnamed")}</h3>
                    <p className="family-member-relationship-new">{member.relationship || t("family.unknownRelation")}</p>
                  </div>
                  <div className="family-card-header-right">
                    <button onClick={() => openEditModal(member)} className="family-edit-btn-new" title={t("family.editTooltip")} type="button">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="family-delete-btn-new" title={t("family.deleteTooltip")} type="button">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="family-card-content-new">
                  <p className="family-member-age-new">
                    <strong>{t("family.genderLabel")}</strong> {member.gender || "Not specified"}
                  </p>
                  <p className="family-member-age-new">
                    <strong>{t("family.dobLabel")}</strong> {formatDate(member.date_of_birth)}
                  </p>
                  {latestConditionsByMember[member.id]?.condition_name && (
                    <>
                      <p className="family-member-age-new">
                        <strong>{t("family.latestCondition")}</strong> {latestConditionsByMember[member.id].condition_name}
                      </p>
                      {latestConditionsByMember[member.id].diagnosis_date && (
                        <p className="family-member-age-new">
                          <strong>{t("family.diagnosisDate")}</strong> {formatDate(latestConditionsByMember[member.id].diagnosis_date)}
                        </p>
                      )}
                    </>
                  )}
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
              <h2 className="modal-title">{editingMember ? t("family.edit") : t("family.add")}</h2>
              <button onClick={closeModal} className="modal-close" type="button">×</button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="form-content">
                <div className="form-field">
                  <label htmlFor="full_name" className="form-label">{t("family.fullName")} *</label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => {
                      const nextValues = { ...formData, full_name: e.target.value };
                      setFormData((p) => ({ ...p, full_name: e.target.value }));
                      setFormErrors(validateMemberForm(nextValues));
                    }}
                    className={`form-input ${formErrors.full_name ? "form-input--error" : ""}`}
                    required
                  />
                  {formErrors.full_name && <p className="inline-field-error">{formErrors.full_name}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="relationship" className="form-label">
                    {t("family.relationship")} *
                    <Tooltip content={t("family.relationshipHelp")} iconOnly>
                      <span className="label-help">?</span>
                    </Tooltip>
                  </label>
                  <select
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => {
                      const nextValues = { ...formData, relationship: e.target.value };
                      setFormData((p) => ({ ...p, relationship: e.target.value }));
                      setFormErrors(validateMemberForm(nextValues));
                    }}
                    className={`form-input ${formErrors.relationship ? "form-input--error" : ""}`}
                    required
                  >
                    <option value="">{t("family.relationshipPlaceholder")}</option>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {formErrors.relationship && <p className="inline-field-error">{formErrors.relationship}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="gender" className="form-label">{t("family.gender")}</label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">{t("family.genderPlaceholder")}</option>
                    <option value="male">{t("family.male")}</option>
                    <option value="female">{t("family.female")}</option>
                    <option value="other">{t("family.other")}</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="date_of_birth" className="form-label">
                    {t("family.dateOfBirth")}
                    <Tooltip content={t("family.dateOfBirthHelp")} iconOnly>
                      <span className="label-help">?</span>
                    </Tooltip>
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => {
                      const nextValues = { ...formData, date_of_birth: e.target.value };
                      setFormData((p) => ({ ...p, date_of_birth: e.target.value }));
                      setFormErrors(validateMemberForm(nextValues));
                    }}
                    className={`form-input ${formErrors.date_of_birth ? "form-input--error" : ""}`}
                    max={todayISO}
                  />
                  {formErrors.date_of_birth && <p className="inline-field-error">{formErrors.date_of_birth}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="condition_name" className="form-label">Condition / Diagnosis (Optional)</label>
                  <select
                    id="condition_name"
                    value={formData.condition_selection}
                    onChange={(e) => setFormData((p) => ({ ...p, condition_selection: e.target.value }))}
                    className="form-input"
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
                    />
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="diagnosis_date" className="form-label">Condition Diagnosis Date</label>
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
                  <label htmlFor="condition_notes" className="form-label">Condition Notes</label>
                  <textarea
                    id="condition_notes"
                    value={formData.condition_notes}
                    onChange={(e) => setFormData((p) => ({ ...p, condition_notes: e.target.value }))}
                    className="form-input form-textarea"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" onClick={closeModal} className="cancel-btn" style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem" }}>
                  {t("common.cancel")}
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
