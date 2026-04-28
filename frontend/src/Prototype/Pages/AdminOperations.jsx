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
import { useLanguage } from "../../contexts/LanguageContext";
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

function StatusBadge({ status, label }) {
  const value = String(status || "pending").toLowerCase();
  return <span className={`admin-status-badge admin-status-badge--${value}`}>{label || value}</span>;
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
  const { t } = useLanguage();
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
      { id: "users", label: t("admin.usersAndRoles"), icon: Users, count: users.length },
      { id: "clinics", label: t("admin.clinics"), icon: Building2, count: clinics.length },
      { id: "content", label: t("admin.awarenessContent"), icon: BookOpen, count: content.length },
      { id: "audit", label: t("admin.auditLog"), icon: ClipboardList, count: auditLogs.length },
    ],
    [auditLogs.length, clinics.length, content.length, t, users.length]
  );

  const translateValue = useCallback(
    (value) => {
      const normalized = String(value || "").toLowerCase();
      if (normalized === "patient") return t("signup.patient");
      if (normalized === "doctor") return t("signup.doctor");
      if (normalized === "admin") return t("signup.admin");
      if (normalized === "approved") return t("admin.approved");
      if (normalized === "rejected") return t("admin.rejected");
      if (normalized === "pending") return t("admin.pending");
      return value;
    },
    [t]
  );

  const authHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error(t("admin.sessionExpired"));
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
        const firstError = failedRequests[0].reason?.message || t("admin.loadFailed");
        setError(`${failedRequests.length} admin section(s) could not load: ${firstError}`);
      }
    } catch (loadError) {
      console.error("Admin operations load failed:", loadError);
      setError(loadError.message || t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [adminFetch, currentUser?.id, t]);

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
      setNotice(t("admin.roleUpdated", { email: user.email, role: translateValue(nextRole) }));
    } catch (saveError) {
      setError(saveError.message || t("admin.updateUserFailed"));
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
      setNotice(t("admin.clinicSaved"));
    } catch (saveError) {
      setError(saveError.message || t("admin.saveClinicFailed"));
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
      setNotice(t("admin.contentSaved"));
    } catch (saveError) {
      setError(saveError.message || t("admin.saveContentFailed"));
    } finally {
      setSavingId("");
    }
  }

  async function deleteContentItem(id) {
    if (!window.confirm(t("admin.deleteContentConfirm"))) return;
    try {
      setSavingId(id);
      setNotice("");
      await adminFetch("content", { method: "DELETE", query: `&id=${encodeURIComponent(id)}` });
      setContent((prev) => prev.filter((item) => item.id !== id));
      setNotice(t("admin.contentDeleted"));
    } catch (deleteError) {
      setError(deleteError.message || t("admin.deleteContentFailed"));
    } finally {
      setSavingId("");
    }
  }

  if (loading) return <AppLoadingScreen title={t("admin.operationsTitle")} message={t("admin.operationsSubtitle")} />;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">
              <Shield />
              {t("admin.operationsTitle")}
            </h1>
            <p className="admin-subtitle">{t("admin.operationsSubtitle")}</p>
          </div>
          <button type="button" className="admin-secondary-btn" onClick={loadAdminData}>
            <RefreshCw size={18} />
            {t("admin.refresh")}
          </button>
        </header>

        <div className="admin-privacy-card">
          <Shield />
          <div>
            <strong>{t("admin.privacyTitle")}</strong>
            <p>{t("admin.privacyBody")}</p>
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
            <p>{t("admin.patients")}</p>
            <strong>{overview?.patients ?? 0}</strong>
          </div>
          <div className="admin-overview-card">
            <Users />
            <p>{t("admin.doctors")}</p>
            <strong>{overview?.doctors ?? 0}</strong>
          </div>
          <div className="admin-overview-card">
            <Building2 />
            <p>{t("admin.clinics")}</p>
            <strong>{overview?.clinics ?? clinics.length}</strong>
          </div>
          <div className="admin-overview-card">
            <Activity />
            <p>{t("admin.pendingReviews")}</p>
            <strong>{(overview?.pendingDoctors ?? 0) + (overview?.pendingContent ?? 0)}</strong>
          </div>
        </div>

        <div className="admin-filter-tabs" role="tablist" aria-label={t("admin.operationsTitle")}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`admin-nav-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="admin-nav-tab__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="admin-nav-tab__content">
                  <span className="admin-nav-tab__label">{tab.label}</span>
                  <span className="admin-nav-tab__meta">{tab.count}</span>
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === "users" && (
          <section className="admin-review-card">
            <div className="admin-section-heading">
              <h2>{t("admin.userRoleManagement")}</h2>
              <p>{t("admin.userRoleManagementBody")}</p>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("admin.name")}</th>
                    <th>{t("admin.email")}</th>
                    <th>{t("admin.phone")}</th>
                    <th>{t("admin.role")}</th>
                    <th>{t("admin.created")}</th>
                    <th>{t("admin.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.full_name || t("admin.unnamedUser")}</td>
                      <td>{user.email}</td>
                      <td>{user.phone_number || t("admin.notProvided")}</td>
                      <td>
                        <StatusBadge status={user.role} label={translateValue(user.role)} />
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
                          <option value="patient">{t("signup.patient")}</option>
                          <option value="doctor">{t("signup.doctor")}</option>
                          <option value="admin">{t("signup.admin")}</option>
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
              <h2>{clinicForm.id ? t("admin.editClinic") : t("admin.addClinic")}</h2>
              <p>{t("admin.clinicHelp")}</p>
              </div>
              <input
                className="form-input"
                placeholder={t("admin.clinicName")}
                value={clinicForm.name}
                onChange={(event) => setClinicForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder={t("admin.clinicLocation")}
                value={clinicForm.location}
                onChange={(event) => setClinicForm((prev) => ({ ...prev, location: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder={t("admin.clinicContact")}
                value={clinicForm.contact_number}
                onChange={(event) => setClinicForm((prev) => ({ ...prev, contact_number: event.target.value }))}
              />
              <div className="admin-review-actions">
                <button type="submit" className="admin-approve-btn" disabled={savingId === "clinic"}>
                  <Save size={16} />
                  {savingId === "clinic" ? t("admin.saving") : t("admin.saveClinic")}
                </button>
                {clinicForm.id && (
                  <button type="button" className="admin-pending-btn" onClick={() => setClinicForm(defaultClinicForm)}>
                    {t("admin.cancelEdit")}
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
                  <p>{clinic.contact_number || t("admin.noContactNumber")}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "content" && (
          <section className="admin-two-column">
            <form className="admin-review-card admin-form-card" onSubmit={saveContent}>
              <div className="admin-section-heading">
                <h2>{contentForm.id ? t("admin.editContent") : t("admin.addContent")}</h2>
                <p>{t("admin.contentHelp")}</p>
              </div>
              <input
                className="form-input"
                placeholder={t("admin.contentTitle")}
                value={contentForm.title}
                onChange={(event) => setContentForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder={t("admin.category")}
                value={contentForm.category}
                onChange={(event) => setContentForm((prev) => ({ ...prev, category: event.target.value }))}
              />
              <textarea
                className="form-input"
                placeholder={t("admin.summary")}
                value={contentForm.summary}
                onChange={(event) => setContentForm((prev) => ({ ...prev, summary: event.target.value }))}
                required
              />
              <textarea
                className="form-input"
                placeholder={t("admin.body")}
                value={contentForm.content_body}
                onChange={(event) => setContentForm((prev) => ({ ...prev, content_body: event.target.value }))}
              />
              <select
                className="form-input"
                value={contentForm.status}
                onChange={(event) => setContentForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="pending">{t("admin.pending")}</option>
                <option value="approved">{t("admin.approved")}</option>
                <option value="rejected">{t("admin.rejected")}</option>
              </select>
              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  checked={contentForm.is_featured}
                  onChange={(event) => setContentForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
                />
                {t("admin.featureArticle")}
              </label>
              <div className="admin-review-actions">
                <button type="submit" className="admin-approve-btn" disabled={savingId === "content"}>
                  <Save size={16} />
                  {savingId === "content" ? t("admin.saving") : t("admin.saveContent")}
                </button>
                {contentForm.id && (
                  <button type="button" className="admin-pending-btn" onClick={() => setContentForm(defaultContentForm)}>
                    {t("admin.cancelEdit")}
                  </button>
                )}
              </div>
            </form>

            <div className="admin-review-grid">
              {content.length === 0 ? (
                <div className="admin-review-card">
                  <h2>{t("admin.noDatabaseContent")}</h2>
                  <p>{t("admin.noDatabaseContentBody")}</p>
                </div>
              ) : (
                content.map((item) => (
                  <article key={item.id} className="admin-review-card">
                    <div className="admin-review-card-header">
                      <div>
                        <h2>{item.title}</h2>
                        <p>{item.category}</p>
                      </div>
                      <StatusBadge status={item.status} label={translateValue(item.status)} />
                    </div>
                    <p>{item.summary}</p>
                    <div className="admin-review-actions">
                      <button type="button" className="admin-pending-btn" onClick={() => setContentForm(item)}>
                        <Edit3 size={16} />
                        {t("admin.edit")}
                      </button>
                      <button
                        type="button"
                        className="admin-reject-btn"
                        onClick={() => deleteContentItem(item.id)}
                        disabled={savingId === item.id}
                      >
                        <Trash2 size={16} />
                        {t("admin.delete")}
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
              <h2>{t("admin.auditTitle")}</h2>
              <p>{t("admin.auditBody")}</p>
            </div>
            {auditLogs.length === 0 ? (
              <div className="admin-empty-state">
                <ClipboardList size={34} />
                <strong>{t("admin.noAuditLogs")}</strong>
                <p>{t("admin.noAuditLogsBody")}</p>
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
                              {log.target_type || t("admin.system")}
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
