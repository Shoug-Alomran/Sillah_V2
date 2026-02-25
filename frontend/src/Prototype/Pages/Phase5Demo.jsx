import { useEffect, useState } from "react";
import { api } from "../../api";

function Tabs({ tab, setTab }) {
  const tabs = ["Users", "Family Members", "Queries"];
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: tab === t ? "#f2f2f2" : "white",
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
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
      setRows(data);
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
    <div>
      <h2 style={{ marginTop: 0 }}>Users (CRUD)</h2>

      <form onSubmit={add} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <input
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone number"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        />
        <button type="submit">Add User</button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
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
                  <button onClick={() => del(r.user_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      setRows(data);
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
    <div>
      <h2 style={{ marginTop: 0 }}>Family Members (CRUD)</h2>

      <form onSubmit={add} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <input
          placeholder="user_id (existing)"
          value={form.user_id}
          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
        />
        <input
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <input
          type="date"
          value={form.date_of_birth}
          onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
        />
        <input
          placeholder="Relationship"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
        />
        <button type="submit">Add Family Member</button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
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
                  <button onClick={() => del(r.member_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    <div>
      <h2 style={{ marginTop: 0 }}>Queries (q01–q40)</h2>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input value={qid} onChange={(e) => setQid(e.target.value)} placeholder="q01 ... q40" />
        <button onClick={runQuery}>Run</button>
        <span style={{ color: "#666" }}>Try: q24, q22, q36</span>
      </div>

      {err && <pre style={{ color: "crimson", marginTop: 14 }}>{err}</pre>}
      {result && (
        <pre style={{ marginTop: 14, background: "#f7f7f7", padding: 12, borderRadius: 10 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Phase5Demo() {
  const [tab, setTab] = useState("Users");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Sillah — Phase 5 Demo</h1>
      <p style={{ color: "#666", marginTop: 6 }}>
        This page connects the React UI to the MySQL/Express backend and runs SQL through the application.
      </p>

      <Tabs tab={tab} setTab={setTab} />

      {tab === "Users" && <Users />}
      {tab === "Family Members" && <FamilyMembers />}
      {tab === "Queries" && <Queries />}
    </div>
  );
}