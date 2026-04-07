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

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
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

function Tabs({ tab, setTab }) {
  const tabs = [
    { label: "Users", icon: UsersRound },
    { label: "Family Members", icon: UsersRound },
    { label: "Queries", icon: Database },
  ];

  return (
    <div className="phase-tabs" role="tablist" aria-label="Phase 5 demo sections">
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = tab === item.label;

        return (
          <button
            key={item.label}
            onClick={() => setTab(item.label)}
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
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });

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
    try {
      await api("/api/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ first_name: "", last_name: "", email: "", phone_number: "" });
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
          <p className="phase-eyebrow">CRUD Table</p>
          <h2 className="phase-section-title">Users</h2>
          <p className="phase-section-copy">
            Create sample users, then verify the UI refreshes from the backend.
          </p>
        </div>
        <div className="phase-section-icon">
          <UsersRound />
        </div>
      </div>

      <form onSubmit={add} className="phase-form phase-form--four">
        <input
          className="phase-input"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          className="phase-input"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <input
          className="phase-input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="phase-input"
          placeholder="Phone number"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        />
        <button className="phase-primary-btn" type="submit">
          <Plus className="phase-btn-icon" />
          Add User
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
              <th>action</th>
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
                  <button className="phase-delete-btn" onClick={() => del(r.user_id)} type="button">
                    <Trash2 className="phase-btn-icon" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyTable message="No users loaded yet." />}
      </div>
    </section>
  );
}

function FamilyMembers() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    relationship: "",
  });

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
    try {
      await api("/api/family-members", {
        method: "POST",
        body: JSON.stringify({ ...form, user_id: Number(form.user_id) }),
      });
      setForm({ user_id: "", first_name: "", last_name: "", date_of_birth: "", relationship: "" });
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
          <p className="phase-eyebrow">Relational Data</p>
          <h2 className="phase-section-title">Family Members</h2>
          <p className="phase-section-copy">
            Add family-member rows connected to existing users and inspect joined emails.
          </p>
        </div>
        <div className="phase-section-icon">
          <UsersRound />
        </div>
      </div>

      <form onSubmit={add} className="phase-form phase-form--five">
        <input
          className="phase-input"
          placeholder="user_id (existing)"
          value={form.user_id}
          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
        />
        <input
          className="phase-input"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          className="phase-input"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <input
          className="phase-input"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
        />
        <input
          className="phase-input"
          placeholder="Relationship"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
        />
        <button className="phase-primary-btn" type="submit">
          <Plus className="phase-btn-icon" />
          Add Family Member
        </button>
      </form>

      <ErrorMessage error={err} />

      <div className="phase-table-wrap">
        <table className="phase-table">
          <thead>
            <tr>
              <th>member_id</th>
              <th>user_id</th>
              <th>name</th>
              <th>relationship</th>
              <th>date_of_birth</th>
              <th>user_email</th>
              <th>action</th>
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
                  <button className="phase-delete-btn" onClick={() => del(r.member_id)} type="button">
                    <Trash2 className="phase-btn-icon" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyTable message="No family members loaded yet." />}
      </div>
    </section>
  );
}

function Queries() {
  const [qid, setQid] = useState("q24");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  async function runQuery() {
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
          <p className="phase-eyebrow">SQL Showcase</p>
          <h2 className="phase-section-title">Queries q01-q40</h2>
          <p className="phase-section-copy">
            Run stored query endpoints and preview the JSON returned by the backend.
          </p>
        </div>
        <div className="phase-section-icon">
          <Database />
        </div>
      </div>

      <div className="phase-query-bar">
        <input
          className="phase-input phase-query-input"
          value={qid}
          onChange={(e) => setQid(e.target.value)}
          placeholder="q01 ... q40"
        />
        <button className="phase-primary-btn" onClick={runQuery} type="button">
          <Play className="phase-btn-icon" />
          Run Query
        </button>
        <span className="phase-query-hint">Try: q24, q22, q36</span>
      </div>

      <ErrorMessage error={err} />
      {result && (
        <pre className="phase-result">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </section>
  );
}

export default function Phase5Demo() {
  const [tab, setTab] = useState("Users");

  return (
    <div className="phase-page">
      <div className="phase-bg-orb phase-bg-orb--one" />
      <div className="phase-bg-orb phase-bg-orb--two" />

      <main className="phase-container">
        <section className="phase-hero">
          <div>
            <div className="phase-hero-badge">
              <Sparkles className="phase-hero-badge-icon" />
              CS340 Phase 5 Integration
            </div>
            <h1 className="phase-title">Sillah Phase 5 Demo</h1>
            <p className="phase-subtitle">
              A polished database demo that connects the React interface to the MySQL/Express backend and runs SQL through the application.
            </p>
          </div>

          <div className="phase-hero-card">
            <Server className="phase-hero-card-icon" />
            <span>React UI</span>
            <strong>MySQL + Express</strong>
          </div>
        </section>

        <Tabs tab={tab} setTab={setTab} />

        {tab === "Users" && <Users />}
        {tab === "Family Members" && <FamilyMembers />}
        {tab === "Queries" && <Queries />}
      </main>
    </div>
  );
}
