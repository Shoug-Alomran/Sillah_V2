import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, FileText, Shield, XCircle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabaseClient";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminDoctorVerification() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [adminNotes, setAdminNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingDoctorId, setSavingDoctorId] = useState("");
  const [feedback, setFeedback] = useState(null);

  async function getAccessToken() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error(t("admin.sessionExpired"));
    return accessToken;
  }

  async function fetchProfiles() {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      const response = await fetch("/api/doctor-profiles?mode=admin", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || t("admin.loadFailed"));

      setProfiles(result.profiles || []);
      setAdminNotes(
        Object.fromEntries((result.profiles || []).map((profile) => [profile.doctor_id, profile.admin_notes || ""]))
      );
      setFeedback(null);
    } catch (loadError) {
      setFeedback({ type: "error", message: loadError?.message || t("admin.loadFailed") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    if (filter === "all") return profiles;
    return profiles.filter((profile) => (profile.verification_status || "pending") === filter);
  }, [filter, profiles]);

  function translateStatus(status) {
    const value = String(status || "pending").toLowerCase();
    if (value === "approved") return t("admin.approved");
    if (value === "rejected") return t("admin.rejected");
    if (value === "all") return t("admin.all");
    return t("admin.pending");
  }

  async function updateStatus(doctorId, status) {
    try {
      setSavingDoctorId(doctorId);
      const accessToken = await getAccessToken();
      const response = await fetch("/api/doctor-profiles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          doctorId,
          status,
          adminNotes: adminNotes[doctorId] || "",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || t("admin.updateUserFailed"));

      setProfiles((prev) =>
        prev.map((profile) =>
          profile.doctor_id === doctorId
            ? { ...profile, ...result.profile, doctor: profile.doctor }
            : profile
        )
      );
      const assignedCount = Number(result.assignedPatientsCount || 0);
      const assignmentMessage =
        status === "approved" && assignedCount > 0
          ? ` ${t("admin.autoAssignedPatients", {
              count: assignedCount,
              suffix: assignedCount === 1 ? "" : "s",
              verb: assignedCount === 1 ? "was" : "were",
              label: assignedCount === 1 ? t("signup.patient") : t("admin.patients"),
            })}`
          : "";
      setFeedback({
        type: "success",
        message: `${t("admin.doctorProfileMarked", { status: translateStatus(status) })}${assignmentMessage}`,
      });
    } catch (saveError) {
      setFeedback({ type: "error", message: saveError?.message || t("admin.updateUserFailed") });
    } finally {
      setSavingDoctorId("");
    }
  }

  if (loading) {
    return <AppLoadingScreen title={t("admin.verificationTitle")} message={t("admin.verificationSubtitle")} />;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">
              <ClipboardCheck className="title-icon" />
              {t("admin.verificationTitle")}
            </h1>
            <p className="admin-subtitle">{t("admin.verificationSubtitle")}</p>
          </div>
        </header>

        <div className="admin-privacy-card">
          <Shield />
          <div>
            <strong>{t("admin.privacyTitle")}</strong>
            <p>{t("admin.verificationPrivacyBody")}</p>
          </div>
        </div>

        {feedback && (
          <div className={`diagnosis-feedback diagnosis-feedback--${feedback.type}`}>
            <FileText size={18} />
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="admin-filter-tabs">
          {["pending", "approved", "rejected", "all"].map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-tab ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item === "pending"
                ? t("admin.pending")
                : item === "approved"
                ? t("admin.approved")
                : item === "rejected"
                ? t("admin.rejected")
                : t("admin.all")}
            </button>
          ))}
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="empty-state">
            <ClipboardCheck className="empty-icon" />
            <p className="empty-title">{t("admin.noDoctorProfiles")}</p>
            <p className="empty-text">{t("admin.noDoctorProfilesBody", { filter: filter === "all" ? t("admin.all") : filter })}</p>
          </div>
        ) : (
          <div className="admin-review-grid">
            {filteredProfiles.map((doctorProfile) => {
              const doctor = doctorProfile.doctor || {};
              const disabled = savingDoctorId === doctorProfile.doctor_id;

              return (
                <article key={doctorProfile.doctor_id} className="admin-review-card">
                  <div className="admin-review-card-header">
                    <div>
                      <h2>{doctor.full_name || doctor.email || t("signup.doctor")}</h2>
                      <p>{doctor.email || t("admin.notProvided")}</p>
                    </div>
                    <span className={`doctor-profile-status doctor-profile-status--${doctorProfile.verification_status || "pending"}`}>
                      {translateStatus(doctorProfile.verification_status)}
                    </span>
                  </div>

                  <div className="admin-review-details">
                    <div><strong>{t("admin.specialty")}:</strong> {doctorProfile.specialty || t("admin.notProvided")}</div>
                    <div><strong>{t("admin.license")}:</strong> {doctorProfile.license_number || t("admin.notProvided")}</div>
                    <div><strong>{t("admin.experience")}:</strong> {doctorProfile.experience_years ?? t("admin.notProvided")} {doctorProfile.experience_years != null ? t("admin.yearsUnit") : ""}</div>
                    <div><strong>{t("admin.clinic")}:</strong> {doctorProfile.clinic_affiliation || t("admin.notProvided")}</div>
                    <div><strong>{t("admin.submitted")}:</strong> {formatDate(doctorProfile.submitted_at || doctorProfile.updated_at)}</div>
                  </div>

                  <div className="admin-review-section">
                    <strong>{t("admin.education")}</strong>
                    <p>{doctorProfile.education || t("admin.notProvided")}</p>
                  </div>

                  <div className="admin-review-section">
                    <strong>{t("admin.certificates")}</strong>
                    <p>{doctorProfile.certifications || t("admin.notProvided")}</p>
                  </div>

                  <div className="admin-review-section">
                    <strong>{t("admin.about")}</strong>
                    <p>{doctorProfile.bio || t("admin.notProvided")}</p>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor={`admin-notes-${doctorProfile.doctor_id}`}>
                      {t("admin.adminNotes")}
                    </label>
                    <textarea
                      id={`admin-notes-${doctorProfile.doctor_id}`}
                      className="form-input form-textarea"
                      value={adminNotes[doctorProfile.doctor_id] || ""}
                      onChange={(event) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [doctorProfile.doctor_id]: event.target.value,
                        }))
                      }
                      rows="3"
                      placeholder={t("admin.adminNotesPlaceholder")}
                    />
                  </div>

                  <div className="admin-review-actions">
                    <button
                      type="button"
                      className="admin-approve-btn"
                      disabled={disabled}
                      onClick={() => updateStatus(doctorProfile.doctor_id, "approved")}
                    >
                      <BadgeCheck size={18} />
                      {t("admin.approve")}
                    </button>
                    <button
                      type="button"
                      className="admin-reject-btn"
                      disabled={disabled}
                      onClick={() => updateStatus(doctorProfile.doctor_id, "rejected")}
                    >
                      <XCircle size={18} />
                      {t("admin.reject")}
                    </button>
                    <button
                      type="button"
                      className="admin-pending-btn"
                      disabled={disabled}
                      onClick={() => updateStatus(doctorProfile.doctor_id, "pending")}
                    >
                      <AlertTriangle size={18} />
                      {t("admin.needsReview")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
