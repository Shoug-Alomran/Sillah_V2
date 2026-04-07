import React, { useEffect, useState } from "react";
import { BadgeCheck, FileText, GraduationCap, Save, Stethoscope } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

const EMPTY_FORM = {
  specialty: "",
  licenseNumber: "",
  education: "",
  certifications: "",
  experienceYears: "",
  clinicAffiliation: "",
  publicContactEmail: "",
  publicPhone: "",
  bio: "",
};

function statusLabel(status) {
  if (!status) return "Not submitted";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function DoctorProfile() {
  const { profile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error("Your session has expired. Please log in again.");

        const response = await fetch("/api/doctor-profiles?mode=mine", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to load doctor profile.");

        if (cancelled) return;
        const next = result.profile || {};
        setForm({
          specialty: next.specialty || "",
          licenseNumber: next.license_number || "",
          education: next.education || "",
          certifications: next.certifications || "",
          experienceYears: next.experience_years ?? "",
          clinicAffiliation: next.clinic_affiliation || "",
          publicContactEmail: next.public_contact_email || profile?.email || "",
          publicPhone: next.public_phone || profile?.phone_number || "",
          bio: next.bio || "",
        });
        setVerificationStatus(next.verification_status || "");
        setAdminNotes(next.admin_notes || "");
      } catch (loadError) {
        if (!cancelled) {
          setFeedback({ type: "error", message: loadError?.message || "Unable to load doctor profile." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [profile?.email, profile?.phone_number]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFeedback(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);

    try {
      setSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired. Please log in again.");

      const response = await fetch("/api/doctor-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to save doctor profile.");

      setVerificationStatus(result.profile?.verification_status || "pending");
      setAdminNotes(result.profile?.admin_notes || "");
      setFeedback({
        type: "success",
        message: "Profile submitted for admin review. Patients will see it after approval.",
      });
    } catch (saveError) {
      setFeedback({ type: "error", message: saveError?.message || "Unable to save doctor profile." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AppLoadingScreen title="Doctor Profile" message="Loading your professional profile..." />;
  }

  return (
    <div className="doctor-profile-page">
      <div className="doctor-profile-container">
        <header className="doctor-profile-header">
          <div>
            <h1 className="doctor-profile-title">
              <Stethoscope className="title-icon" />
              Doctor Profile
            </h1>
            <p className="doctor-profile-subtitle">
              Add your credentials so patients can choose verified doctors with confidence.
            </p>
          </div>
          <span className={`doctor-profile-status doctor-profile-status--${verificationStatus || "draft"}`}>
            <BadgeCheck size={18} />
            {statusLabel(verificationStatus)}
          </span>
        </header>

        {feedback && (
          <div className={`diagnosis-feedback diagnosis-feedback--${feedback.type}`}>
            <FileText size={18} />
            <span>{feedback.message}</span>
          </div>
        )}

        {adminNotes && (
          <div className="doctor-profile-admin-note">
            <strong>Admin note:</strong>
            <p>{adminNotes}</p>
          </div>
        )}

        <form className="doctor-profile-card" onSubmit={handleSubmit}>
          <div className="doctor-profile-section-title">
            <GraduationCap />
            Professional Information
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="doctor-specialty">Specialty *</label>
              <input
                id="doctor-specialty"
                className="form-input"
                value={form.specialty}
                onChange={(event) => updateField("specialty", event.target.value)}
                placeholder="e.g., Family Medicine, Hematology"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="doctor-license">License / Registration Number *</label>
              <input
                id="doctor-license"
                className="form-input"
                value={form.licenseNumber}
                onChange={(event) => updateField("licenseNumber", event.target.value)}
                placeholder="Official medical license number"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="doctor-education">Education *</label>
            <textarea
              id="doctor-education"
              className="form-input form-textarea"
              value={form.education}
              onChange={(event) => updateField("education", event.target.value)}
              placeholder="Degrees, universities, residencies, fellowships"
              rows="4"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="doctor-certifications">Certificates / Board Certifications</label>
            <textarea
              id="doctor-certifications"
              className="form-input form-textarea"
              value={form.certifications}
              onChange={(event) => updateField("certifications", event.target.value)}
              placeholder="Board certifications, credentials, professional memberships"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="doctor-experience">Years of Experience</label>
              <input
                id="doctor-experience"
                className="form-input"
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={(event) => updateField("experienceYears", event.target.value)}
                placeholder="e.g., 8"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="doctor-clinic">Clinic / Hospital Affiliation</label>
              <input
                id="doctor-clinic"
                className="form-input"
                value={form.clinicAffiliation}
                onChange={(event) => updateField("clinicAffiliation", event.target.value)}
                placeholder="Hospital or clinic name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="doctor-public-email">Public Contact Email</label>
              <input
                id="doctor-public-email"
                className="form-input"
                type="email"
                value={form.publicContactEmail}
                onChange={(event) => updateField("publicContactEmail", event.target.value)}
                placeholder="Shown to patients after approval"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="doctor-public-phone">Public Phone</label>
              <input
                id="doctor-public-phone"
                className="form-input"
                value={form.publicPhone}
                onChange={(event) => updateField("publicPhone", event.target.value)}
                placeholder="Shown to patients after approval"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="doctor-bio">About Your Practice</label>
            <textarea
              id="doctor-bio"
              className="form-input form-textarea"
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Briefly describe your clinical focus and patient care approach."
              rows="5"
            />
          </div>

          <div className="form-footer">
            <button className="save-btn" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
