import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, FileText, Shield, XCircle } from "lucide-react";
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
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [adminNotes, setAdminNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingDoctorId, setSavingDoctorId] = useState("");
  const [feedback, setFeedback] = useState(null);

  async function getAccessToken() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("Your session has expired. Please log in again.");
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
      if (!response.ok) throw new Error(result.error || "Unable to load doctor profiles.");

      setProfiles(result.profiles || []);
      setAdminNotes(
        Object.fromEntries((result.profiles || []).map((profile) => [profile.doctor_id, profile.admin_notes || ""]))
      );
      setFeedback(null);
    } catch (loadError) {
      setFeedback({ type: "error", message: loadError?.message || "Unable to load doctor profiles." });
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
      if (!response.ok) throw new Error(result.error || "Unable to update doctor profile.");

      setProfiles((prev) =>
        prev.map((profile) =>
          profile.doctor_id === doctorId
            ? { ...profile, ...result.profile, doctor: profile.doctor }
            : profile
        )
      );
      setFeedback({ type: "success", message: `Doctor profile marked ${status}.` });
    } catch (saveError) {
      setFeedback({ type: "error", message: saveError?.message || "Unable to update doctor profile." });
    } finally {
      setSavingDoctorId("");
    }
  }

  if (loading) {
    return <AppLoadingScreen title="Doctor Verification" message="Loading doctor profile submissions..." />;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">
              <ClipboardCheck className="title-icon" />
              Doctor Verification
            </h1>
            <p className="admin-subtitle">
              Review professional profiles without accessing patient medical records.
            </p>
          </div>
        </header>

        <div className="admin-privacy-card">
          <Shield />
          <div>
            <strong>Privacy boundary</strong>
            <p>
              This admin screen only shows doctor-submitted professional information. It does not expose patient
              records, family history, diagnoses, medications, appointments, or risk data.
            </p>
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
              {item}
            </button>
          ))}
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="empty-state">
            <ClipboardCheck className="empty-icon" />
            <p className="empty-title">No doctor profiles found</p>
            <p className="empty-text">There are no {filter === "all" ? "" : filter} profiles to review.</p>
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
                      <h2>{doctor.full_name || doctor.email || "Doctor"}</h2>
                      <p>{doctor.email || "No email available"}</p>
                    </div>
                    <span className={`doctor-profile-status doctor-profile-status--${doctorProfile.verification_status || "pending"}`}>
                      {doctorProfile.verification_status || "pending"}
                    </span>
                  </div>

                  <div className="admin-review-details">
                    <div><strong>Specialty:</strong> {doctorProfile.specialty || "Not provided"}</div>
                    <div><strong>License:</strong> {doctorProfile.license_number || "Not provided"}</div>
                    <div><strong>Experience:</strong> {doctorProfile.experience_years ?? "Not provided"} years</div>
                    <div><strong>Clinic:</strong> {doctorProfile.clinic_affiliation || "Not provided"}</div>
                    <div><strong>Submitted:</strong> {formatDate(doctorProfile.submitted_at || doctorProfile.updated_at)}</div>
                  </div>

                  <div className="admin-review-section">
                    <strong>Education</strong>
                    <p>{doctorProfile.education || "Not provided"}</p>
                  </div>

                  <div className="admin-review-section">
                    <strong>Certificates</strong>
                    <p>{doctorProfile.certifications || "Not provided"}</p>
                  </div>

                  <div className="admin-review-section">
                    <strong>About</strong>
                    <p>{doctorProfile.bio || "Not provided"}</p>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor={`admin-notes-${doctorProfile.doctor_id}`}>
                      Admin notes
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
                      placeholder="Reason for approval/rejection or what needs to be corrected."
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
                      Approve
                    </button>
                    <button
                      type="button"
                      className="admin-reject-btn"
                      disabled={disabled}
                      onClick={() => updateStatus(doctorProfile.doctor_id, "rejected")}
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                    <button
                      type="button"
                      className="admin-pending-btn"
                      disabled={disabled}
                      onClick={() => updateStatus(doctorProfile.doctor_id, "pending")}
                    >
                      <AlertTriangle size={18} />
                      Needs Review
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
