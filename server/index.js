import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { QUERIES } from "./queries.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// health check
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json(rows[0]);
  } catch (err) {
    console.error("HEALTH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// helper
async function run(res, sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

/* -----------------------
   USERS (CRUD)
------------------------ */

app.get("/api/users", (req, res) => {
  return run(res, "SELECT * FROM `User` ORDER BY user_id DESC");
});

app.post("/api/users", async (req, res) => {
  const { first_name, last_name, email, phone_number } = req.body;

  try {
    const [result] = await pool.query(
      "INSERT INTO `User` (first_name, last_name, email, phone_number) VALUES (?, ?, ?, ?)",
      [first_name, last_name, email, phone_number]
    );
    res.json({ insertedId: result.insertId });
  } catch (err) {
    console.error("INSERT USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const user_id = Number(req.params.id);
  const { first_name, last_name, email, phone_number } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE \`User\`
       SET first_name = ?, last_name = ?, email = ?, phone_number = ?
       WHERE user_id = ?`,
      [first_name, last_name, email, phone_number, user_id]
    );
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const user_id = Number(req.params.id);

  try {
    const [result] = await pool.query("DELETE FROM `User` WHERE user_id = ?", [user_id]);
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------
   FAMILY MEMBERS (CRUD)
------------------------ */

app.get("/api/family-members", (req, res) => {
  return run(
    res,
    `SELECT fm.*, u.email AS user_email
     FROM FamilyMember fm
     JOIN \`User\` u ON fm.user_id = u.user_id
     ORDER BY fm.member_id DESC`
  );
});

app.post("/api/family-members", async (req, res) => {
  const { user_id, first_name, last_name, date_of_birth, relationship } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO FamilyMember (user_id, first_name, last_name, date_of_birth, relationship)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(user_id), first_name, last_name, date_of_birth, relationship]
    );
    res.json({ insertedId: result.insertId });
  } catch (err) {
    console.error("INSERT FAMILY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/family-members/:id", async (req, res) => {
  const member_id = Number(req.params.id);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM RiskAlert WHERE member_id = ?", [member_id]);
    const [result] = await conn.query("DELETE FROM FamilyMember WHERE member_id = ?", [member_id]);
    await conn.commit();
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE FAMILY ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* -----------------------
   QUERIES (q01–q40)
------------------------ */

app.get("/api/queries/:qid", async (req, res) => {
  const qid = req.params.qid;
  const q = QUERIES[qid];
  if (!q) return res.status(404).json({ error: "Unknown query id" });

  let params = [];

  if (qid === "q03") {
    const term = req.query.term ?? "";
    params = [term];
  }

  if (qid === "q06") {
    const user_id = Number(req.query.user_id ?? 0);
    params = [user_id];
  }

  if (qid === "q09") {
    const severity = req.query.severity ?? "Low";
    params = [severity];
  }

  if (qid === "q12" || qid === "q14" || qid === "q16") {
    const member_id = Number(req.query.member_id ?? 0);
    params = [member_id];
  }

  return run(res, q, params);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
