import { useEffect, useState } from "react";
import {
  Database,
  Play,
  Plus,
  Server,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import { api } from "../../api";
import LanguageToggle from "../../Components/LanguageToggle";
import OnboardingPrompt from "../../Components/OnboardingPrompt";
import Tooltip from "../../Components/Tooltip";
import { useLanguage } from "../../contexts/LanguageContext";

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function formatCellValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function QueryOutputTable({ rows }) {
  if (!rows.length) return <EmptyTable message="No rows returned by this query." />;

  const columns = Object.keys(rows[0]);

  return (
    <div className="phase-table-wrap phase-query-table-wrap">
      <table className="phase-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${columns.map((column) => row[column]).join("-")}`}>
              {columns.map((column) => (
                <td key={column}>{formatCellValue(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyTable({ message }) {
  return (
    <div className="phase-empty">
      <Database className="phase-empty-icon" />
      <p>{message}</p>
    </div>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;
  return <p className="phase-error">{error}</p>;
}

function InlineError({ error }) {
  if (!error) return null;
  return <p className="inline-field-error phase-inline-error">{error}</p>;
}

function Tabs({ tab, setTab }) {
  const { t } = useLanguage();
  const tabs = [
    { value: "Users", label: t("phase5.usersTab"), icon: UsersRound },
    { value: "Family Members", label: t("phase5.familyTab"), icon: UsersRound },
    { value: "Queries", label: t("phase5.queriesTab"), icon: Database },
  ];

  return (
    <div className="phase-tabs" role="tablist" aria-label="Phase 5 demo sections">
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = tab === item.value;

        return (
          <button
            key={item.value}
            onClick={() => setTab(item.value)}
            className={`phase-tab ${active ? "phase-tab--active" : ""}`}
            type="button"
            role="tab"
            aria-selected={active}
          >
            <Icon className="phase-tab-icon" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Users() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });

  function validate(nextForm = form) {
    const errors = {};
    if (!nextForm.first_name.trim()) errors.first_name = t("phase5.validationFirstName");
    if (!nextForm.last_name.trim()) errors.last_name = t("phase5.validationLastName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextForm.email.trim())) {
      errors.email = t("phase5.validationEmail");
    }
    if (!nextForm.phone_number.trim()) errors.phone_number = t("phase5.validationPhone");
    return errors;
  }

  function updateField(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setFieldErrors(validate(nextForm));
  }

  async function load() {
    setErr("");
    try {
      const data = await api("/api/users");
      setRows(normalizeRows(data));
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setErr("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await api("/api/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ first_name: "", last_name: "", email: "", phone_number: "" });
      setFieldErrors({});
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function del(id) {
    setErr("");
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <section className="phase-card">
      <div className="phase-section-header">
        <div>
          <p className="phase-eyebrow">{t("phase5.usersEyebrow")}</p>
          <h2 className="phase-section-title">{t("phase5.usersTitle")}</h2>
          <p className="phase-section-copy">{t("phase5.usersCopy")}</p>
        </div>
        <div className="phase-section-icon">
          <UsersRound />
        </div>
      </div>

      <form onSubmit={add} className="phase-form phase-form--four">
        <div>
          <input
            className={`phase-input ${fieldErrors.first_name ? "form-input--error" : ""}`}
            placeholder={t("phase5.firstName")}
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
          />
          <InlineError error={fieldErrors.first_name} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.last_name ? "form-input--error" : ""}`}
            placeholder={t("phase5.lastName")}
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
          />
          <InlineError error={fieldErrors.last_name} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.email ? "form-input--error" : ""}`}
            placeholder={t("phase5.email")}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <InlineError error={fieldErrors.email} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.phone_number ? "form-input--error" : ""}`}
            placeholder={t("phase5.phone")}
            value={form.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
          />
          <InlineError error={fieldErrors.phone_number} />
        </div>
        <button className="phase-primary-btn" type="submit">
          <Plus className="phase-btn-icon" />
          {t("phase5.addUser")}
        </button>
      </form>

      <ErrorMessage error={err} />

      <div className="phase-table-wrap">
        <table className="phase-table">
          <thead>
            <tr>
              <th>user_id</th>
              <th>first_name</th>
              <th>last_name</th>
              <th>email</th>
              <th>phone_number</th>
              <th>{t("phase5.columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td>{r.user_id}</td>
                <td>{r.first_name}</td>
                <td>{r.last_name}</td>
                <td>{r.email}</td>
                <td>{r.phone_number}</td>
                <td>
                  <Tooltip content={t("phase5.deleteUserHelp")}>
                    <button className="phase-delete-btn" onClick={() => del(r.user_id)} type="button">
                      <Trash2 className="phase-btn-icon" />
                      {t("phase5.delete")}
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyTable message={t("phase5.noUsers")} />}
      </div>
    </section>
  );
}

function FamilyMembers() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    relationship: "",
  });

  function validate(nextForm = form) {
    const errors = {};
    if (!/^\d+$/.test(String(nextForm.user_id).trim())) errors.user_id = t("phase5.validationUserId");
    if (!nextForm.first_name.trim()) errors.first_name = t("phase5.validationFirstName");
    if (!nextForm.last_name.trim()) errors.last_name = t("phase5.validationLastName");
    if (!nextForm.date_of_birth) errors.date_of_birth = t("phase5.validationDate");
    if (!nextForm.relationship.trim()) errors.relationship = t("phase5.validationRelationship");
    return errors;
  }

  function updateField(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setFieldErrors(validate(nextForm));
  }

  async function load() {
    setErr("");
    try {
      const data = await api("/api/family-members");
      setRows(normalizeRows(data));
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setErr("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await api("/api/family-members", {
        method: "POST",
        body: JSON.stringify({ ...form, user_id: Number(form.user_id) }),
      });
      setForm({ user_id: "", first_name: "", last_name: "", date_of_birth: "", relationship: "" });
      setFieldErrors({});
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function del(id) {
    setErr("");
    try {
      await api(`/api/family-members/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <section className="phase-card">
      <div className="phase-section-header">
        <div>
          <p className="phase-eyebrow">{t("phase5.familyEyebrow")}</p>
          <h2 className="phase-section-title">{t("phase5.familyTitle")}</h2>
          <p className="phase-section-copy">{t("phase5.familyCopy")}</p>
        </div>
        <div className="phase-section-icon">
          <UsersRound />
        </div>
      </div>

      <form onSubmit={add} className="phase-form phase-form--five">
        <div>
          <Tooltip content={t("phase5.userIdHelp")}>
            <input
              className={`phase-input ${fieldErrors.user_id ? "form-input--error" : ""}`}
              placeholder={t("phase5.userId")}
              value={form.user_id}
              onChange={(e) => updateField("user_id", e.target.value)}
            />
          </Tooltip>
          <InlineError error={fieldErrors.user_id} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.first_name ? "form-input--error" : ""}`}
            placeholder={t("phase5.firstName")}
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
          />
          <InlineError error={fieldErrors.first_name} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.last_name ? "form-input--error" : ""}`}
            placeholder={t("phase5.lastName")}
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
          />
          <InlineError error={fieldErrors.last_name} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.date_of_birth ? "form-input--error" : ""}`}
            type="date"
            value={form.date_of_birth}
            onChange={(e) => updateField("date_of_birth", e.target.value)}
          />
          <InlineError error={fieldErrors.date_of_birth} />
        </div>
        <div>
          <input
            className={`phase-input ${fieldErrors.relationship ? "form-input--error" : ""}`}
            placeholder={t("phase5.relationship")}
            value={form.relationship}
            onChange={(e) => updateField("relationship", e.target.value)}
          />
          <InlineError error={fieldErrors.relationship} />
        </div>
        <button className="phase-primary-btn" type="submit">
          <Plus className="phase-btn-icon" />
          {t("phase5.addFamilyMember")}
        </button>
      </form>

      <ErrorMessage error={err} />

      <div className="phase-table-wrap">
        <table className="phase-table">
          <thead>
            <tr>
              <th>member_id</th>
              <th>user_id</th>
              <th>{t("phase5.columns.name")}</th>
              <th>relationship</th>
              <th>date_of_birth</th>
              <th>user_email</th>
              <th>{t("phase5.columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.member_id}>
                <td>{r.member_id}</td>
                <td>{r.user_id}</td>
                <td>
                  {r.first_name} {r.last_name}
                </td>
                <td>{r.relationship}</td>
                <td>{String(r.date_of_birth || "").slice(0, 10)}</td>
                <td>{r.user_email}</td>
                <td>
                  <Tooltip content={t("phase5.deleteFamilyHelp")}>
                    <button className="phase-delete-btn" onClick={() => del(r.member_id)} type="button">
                      <Trash2 className="phase-btn-icon" />
                      {t("phase5.delete")}
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyTable message={t("phase5.noFamily")} />}
      </div>
    </section>
  );
}

function Queries() {
  const { t } = useLanguage();
  const [qid, setQid] = useState("q24");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [fieldError, setFieldError] = useState("");

  function validate(value = qid) {
    return /^q\d{2}$/i.test(value.trim()) ? "" : t("phase5.validationQuery");
  }

  async function runQuery() {
    const error = validate();
    setFieldError(error);
    if (error) return;

    setErr("");
    setResult(null);
    try {
      const data = await api(`/api/queries/${qid}`);
      setResult(data);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <section className="phase-card">
      <div className="phase-section-header">
        <div>
          <p className="phase-eyebrow">{t("phase5.queriesEyebrow")}</p>
          <h2 className="phase-section-title">{t("phase5.queriesTitle")}</h2>
          <p className="phase-section-copy">{t("phase5.queriesCopy")}</p>
        </div>
        <div className="phase-section-icon">
          <Database />
        </div>
      </div>

      <div className="phase-query-bar">
        <div>
          <Tooltip content={t("phase5.queryHelp")}>
            <input
              className={`phase-input phase-query-input ${fieldError ? "form-input--error" : ""}`}
              value={qid}
              onChange={(e) => {
                setQid(e.target.value);
                setFieldError(validate(e.target.value));
              }}
              placeholder="q01 ... q40"
              aria-label={t("phase5.queryId")}
            />
          </Tooltip>
          <InlineError error={fieldError} />
        </div>
        <button className="phase-primary-btn" onClick={runQuery} type="button">
          <Play className="phase-btn-icon" />
          {t("phase5.runQuery")}
        </button>
        <span className="phase-query-hint">{t("phase5.tryQueries")}</span>
      </div>

      <ErrorMessage error={err} />
      {result && (
        <div className="phase-query-results">
          <div>
            <h3 className="phase-result-title">Visual output</h3>
            <QueryOutputTable rows={normalizeRows(result)} />
          </div>
          <div>
            <h3 className="phase-result-title">JSON output</h3>
            <pre className="phase-result">
              {JSON.stringify(normalizeRows(result), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Phase5Demo() {
  const [tab, setTab] = useState("Users");
  const { t } = useLanguage();

  return (
    <div className="phase-page">
      <div className="phase-bg-orb phase-bg-orb--one" />
      <div className="phase-bg-orb phase-bg-orb--two" />

      <main className="phase-container">
        <div className="phase-language-row">
          <LanguageToggle />
        </div>

        <section className="phase-hero">
          <div>
            <div className="phase-hero-badge">
              <Sparkles className="phase-hero-badge-icon" />
              {t("phase5.badge")}
            </div>
            <h1 className="phase-title">{t("phase5.title")}</h1>
            <p className="phase-subtitle">{t("phase5.subtitle")}</p>
          </div>

          <div className="phase-hero-card">
            <Server className="phase-hero-card-icon" />
            <span>{t("phase5.stackTop")}</span>
            <strong>{t("phase5.stackBottom")}</strong>
          </div>
        </section>

        <OnboardingPrompt
          storageKey="sillah-phase5-onboarding"
          title={t("phase5.onboardingTitle")}
          body={t("phase5.onboardingBody")}
        />

        <Tabs tab={tab} setTab={setTab} />

        {tab === "Users" && <Users />}
        {tab === "Family Members" && <FamilyMembers />}
        {tab === "Queries" && <Queries />}
      </main>
    </div>
  );
}
