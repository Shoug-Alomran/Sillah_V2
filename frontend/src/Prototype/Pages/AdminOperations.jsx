import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  Edit3,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

const defaultClinicForm = { id: "", name: "", location: "", contact_number: "" };
const defaultContentForm = {
  id: "",
  title: "",
  summary: "",
  category: "General",
  reading_time: 5,
  image_url: "",
  content_body: "",
  status: "pending",
  is_featured: false,
};

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase();
  return <span className={`admin-status-badge admin-status-badge--${value}`}>{value}</span>;
}

function formatAuditAction(value) {
  return String(value || "admin.action")
    .replaceAll(".", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAuditDetails(details) {
  if (!details || typeof details !== "object") return [];
  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key: key.replaceAll("_", " "),
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
    }));
}

function getAdminErrorMessage(result) {
  const details = [result?.error, result?.code, result?.details, result?.hint].filter(Boolean);
  return details.length > 0 ? details.join(" - ") : "Admin request failed.";
}

export default function AdminOperations() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [content, setContent] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [clinicForm, setClinicForm] = useState(defaultClinicForm);
  const [contentForm, setContentForm] = useState(defaultContentForm);
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const tabs = useMemo(
    () => [
      { id: "users", label: "Users & Roles", icon: Users },
      { id: "clinics", label: "Clinics", icon: Building2 },
      { id: "content", label: "Awareness Content", icon: BookOpen },
      { id: "audit", label: "Audit Log", icon: ClipboardList },
    ],
    []
  );

  const authHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Your session expired. Please log in again.");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [currentUser]);

  const adminFetch = useCallback(
    async (resource, options = {}) => {
      const headers = await authHeaders();
      const response = await fetch(`/api/admin/operations?resource=${resource}${options.query || ""}`, {
        ...options,
        headers,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getAdminErrorMessage(result));
      return result;
    },
    [authHeaders]
  );

  const loadAdminData = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError("");
      const [overviewResult, usersResult, clinicsResult, contentResult, auditResult] = await Promise.allSettled([
        adminFetch("overview"),
        adminFetch("users"),
        adminFetch("clinics"),
        adminFetch("content"),
        adminFetch("audit"),
      ]);

      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value.overview || null);
      if (usersResult.status === "fulfilled") setUsers(usersResult.value.users || []);
      if (clinicsResult.status === "fulfilled") setClinics(clinicsResult.value.clinics || []);
      if (contentResult.status === "fulfilled") setContent(contentResult.value.content || []);
      if (auditResult.status === "fulfilled") setAuditLogs(auditResult.value.logs || []);

      const failedRequests = [overviewResult, usersResult, clinicsResult, contentResult, auditResult].filter(
        (result) => result.status === "rejected"
      );
      if (failedRequests.length > 0) {
        const firstError = failedRequests[0].reason?.message || "Some admin data could not be loaded.";
        setError(`${failedRequests.length} admin section(s) could not load: ${firstError}`);
      }
    } catch (loadError) {
      console.error("Admin operations load failed:", loadError);
      setError(loadError.message || "Unable to load admin operations.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch, currentUser?.id]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function updateUser(user, nextRole) {
    try {
      setSavingId(user.id);
      setNotice("");
      const result = await adminFetch("users", {
        method: "PATCH",
        body: JSON.stringify({
          userId: user.id,
          role: nextRole,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          selectedDoctorId: nextRole === "patient" ? user.selected_doctor_id : null,
        }),
      });
      setUsers((prev) => prev.map((row) => (row.id === user.id ? result.user : row)));
      setNotice(`${user.email} updated to ${nextRole}.`);
    } catch (saveError) {
      setError(saveError.message || "Unable to update user.");
    } finally {
      setSavingId("");
    }
  }

  async function saveClinic(event) {
    event.preventDefault();
    try {
      setSavingId("clinic");
      setNotice("");
      const result = await adminFetch("clinics", {
        method: clinicForm.id ? "PATCH" : "POST",
        body: JSON.stringify(clinicForm),
      });
      setClinics((prev) => {
        const exists = prev.some((clinic) => clinic.id === result.clinic.id);
        return exists
          ? prev.map((clinic) => (clinic.id === result.clinic.id ? result.clinic : clinic))
          : [result.clinic, ...prev];
      });
      setClinicForm(defaultClinicForm);
      setNotice("Clinic saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save clinic.");
    } finally {
      setSavingId("");
    }
  }

  async function saveContent(event) {
    event.preventDefault();
    try {
      setSavingId("content");
      setNotice("");
      const result = await adminFetch("content", {
        method: contentForm.id ? "PATCH" : "POST",
        body: JSON.stringify(contentForm),
      });
      setContent((prev) => {
        const exists = prev.some((item) => item.id === result.item.id);
        return exists ? prev.map((item) => (item.id === result.item.id ? result.item : item)) : [result.item, ...prev];
      });
      setContentForm(defaultContentForm);
      setNotice("Awareness content saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save content. Make sure the awareness_content table exists.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteContentItem(id) {
    if (!window.confirm("Delete this awareness content item?")) return;
    try {
      setSavingId(id);
      setNotice("");
      await adminFetch("content", { method: "DELETE", query: `&id=${encodeURIComponent(id)}` });
      setContent((prev) => prev.filter((item) => item.id !== id));
      setNotice("Awareness content deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete content.");
    } finally {
      setSavingId("");
    }
  }

  if (loading) return <AppLoadingScreen title="Admin Operations" message="Loading operational controls..." />;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">
              <Shield />
              Admin Operations
            </h1>
            <p className="admin-subtitle">
              Manage access, clinics, education content, and operational activity without opening patient medical records.
            </p>
          </div>
          <button type="button" className="admin-secondary-btn" onClick={loadAdminData}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </header>

        <div className="admin-privacy-card">
          <Shield />
          <div>
            <strong>Privacy boundary</strong>
            <p>
              This page shows operational metadata only. Admins can manage accounts, clinic entries, and education content,
              but cannot browse patient diagnoses, medications, family conditions, or risk reports.
            </p>
          </div>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="auth-success" role="status">
            {notice}
          </div>
        )}

        <div className="admin-overview-grid">
          <div className="admin-overview-card">
            <Users />
            <p>Patients</p>
            <strong>{overview?.patients ?? 0}</strong>
          </div>
          <div className="admin-overview-card">
            <Users />
            <p>Doctors</p>
            <strong>{overview?.doctors ?? 0}</strong>
          </div>
          <div className="admin-overview-card">
            <Building2 />
            <p>Clinics</p>
            <strong>{overview?.clinics ?? clinics.length}</strong>
          </div>
          <div className="admin-overview-card">
            <Activity />
            <p>Pending Reviews</p>
            <strong>{(overview?.pendingDoctors ?? 0) + (overview?.pendingContent ?? 0)}</strong>
          </div>
        </div>

        <div className="admin-filter-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "users" && (
          <section className="admin-review-card">
            <div className="admin-section-heading">
              <h2>User & Role Management</h2>
              <p>Change operational roles only. Patient medical records stay outside this admin view.</p>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.full_name || "Unnamed user"}</td>
                      <td>{user.email}</td>
                      <td>{user.phone_number || "Not provided"}</td>
                      <td>
                        <StatusBadge status={user.role} />
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <select
                          aria-label={`Change role for ${user.email}`}
                          value={user.role || "patient"}
                          disabled={savingId === user.id}
                          onChange={(event) => updateUser(user, event.target.value)}
                          className="admin-inline-select"
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "clinics" && (
          <section className="admin-two-column">
            <form className="admin-review-card admin-form-card" onSubmit={saveClinic}>
              <div className="admin-section-heading">
                <h2>{clinicForm.id ? "Edit Clinic" : "Add Clinic"}</h2>
                <p>These clinic records power appointment booking and clinic lookup.</p>
              </div>
              <input
                className="form-input"
                placeholder="Clinic name"
                value={clinicForm.name}
                onChange={(event) => setClinicForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder="City or location"
                value={clinicForm.location}
                onChange={(event) => setClinicForm((prev) => ({ ...prev, location: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder="Contact number"
                value={clinicForm.contact_number}
                onChange={(event) => setClinicForm((prev) => ({ ...prev, contact_number: event.target.value }))}
              />
              <div className="admin-review-actions">
                <button type="submit" className="admin-approve-btn" disabled={savingId === "clinic"}>
                  <Save size={16} />
                  {savingId === "clinic" ? "Saving..." : "Save Clinic"}
                </button>
                {clinicForm.id && (
                  <button type="button" className="admin-pending-btn" onClick={() => setClinicForm(defaultClinicForm)}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <div className="admin-review-grid">
              {clinics.map((clinic) => (
                <article key={clinic.id} className="admin-review-card">
                  <div className="admin-review-card-header">
                    <div>
                      <h2>{clinic.name}</h2>
                      <p>{clinic.location}</p>
                    </div>
                    <button type="button" className="admin-icon-btn" onClick={() => setClinicForm(clinic)}>
                      <Edit3 size={18} />
                    </button>
                  </div>
                  <p>{clinic.contact_number || "No contact number listed"}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "content" && (
          <section className="admin-two-column">
            <form className="admin-review-card admin-form-card" onSubmit={saveContent}>
              <div className="admin-section-heading">
                <h2>{contentForm.id ? "Edit Awareness Content" : "Add Awareness Content"}</h2>
                <p>Only approved items should be shown publicly.</p>
              </div>
              <input
                className="form-input"
                placeholder="Title"
                value={contentForm.title}
                onChange={(event) => setContentForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder="Category"
                value={contentForm.category}
                onChange={(event) => setContentForm((prev) => ({ ...prev, category: event.target.value }))}
              />
              <textarea
                className="form-input"
                placeholder="Short summary"
                value={contentForm.summary}
                onChange={(event) => setContentForm((prev) => ({ ...prev, summary: event.target.value }))}
                required
              />
              <textarea
                className="form-input"
                placeholder="Article body or admin notes"
                value={contentForm.content_body}
                onChange={(event) => setContentForm((prev) => ({ ...prev, content_body: event.target.value }))}
              />
              <select
                className="form-input"
                value={contentForm.status}
                onChange={(event) => setContentForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  checked={contentForm.is_featured}
                  onChange={(event) => setContentForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
                />
                Feature this article
              </label>
              <div className="admin-review-actions">
                <button type="submit" className="admin-approve-btn" disabled={savingId === "content"}>
                  <Save size={16} />
                  {savingId === "content" ? "Saving..." : "Save Content"}
                </button>
                {contentForm.id && (
                  <button type="button" className="admin-pending-btn" onClick={() => setContentForm(defaultContentForm)}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <div className="admin-review-grid">
              {content.length === 0 ? (
                <div className="admin-review-card">
                  <h2>No database content yet</h2>
                  <p>
                    Run the awareness content setup SQL, then use this panel to create, approve, and publish education
                    articles.
                  </p>
                </div>
              ) : (
                content.map((item) => (
                  <article key={item.id} className="admin-review-card">
                    <div className="admin-review-card-header">
                      <div>
                        <h2>{item.title}</h2>
                        <p>{item.category}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p>{item.summary}</p>
                    <div className="admin-review-actions">
                      <button type="button" className="admin-pending-btn" onClick={() => setContentForm(item)}>
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-reject-btn"
                        onClick={() => deleteContentItem(item.id)}
                        disabled={savingId === item.id}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "audit" && (
          <section className="admin-review-card admin-audit-panel">
            <div className="admin-section-heading">
              <h2>Administrative Audit Log</h2>
              <p>Tracks admin actions for accountability. It does not store patient medical details.</p>
            </div>
            {auditLogs.length === 0 ? (
              <div className="admin-empty-state">
                <ClipboardList size={34} />
                <strong>No admin audit logs yet</strong>
                <p>
                  Audit entries will appear here after admins update roles, save clinics, publish awareness content, or
                  delete content.
                </p>
              </div>
            ) : (
              <div className="admin-audit-list">
                {auditLogs.map((log) => {
                  const details = formatAuditDetails(log.details);
                  return (
                    <article key={log.id} className="admin-audit-item">
                      <div className="admin-audit-icon">
                        <ClipboardList size={20} />
                      </div>
                      <div className="admin-audit-content">
                        <div className="admin-audit-heading">
                          <div>
                            <h3>{formatAuditAction(log.action_type)}</h3>
                            <p>
                              {log.target_type || "system"}
                              {log.target_id ? ` - ${log.target_id}` : ""}
                            </p>
                          </div>
                          <time dateTime={log.created_at}>{formatDate(log.created_at)}</time>
                        </div>
                        {details.length > 0 && (
                          <div className="admin-audit-details">
                            {details.map((detail) => (
                              <span key={`${log.id}-${detail.key}`}>
                                <strong>{detail.key}:</strong> {detail.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
