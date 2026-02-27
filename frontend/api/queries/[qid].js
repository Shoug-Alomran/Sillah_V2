import { getPool } from "../_db.js";
import { allowMethods } from "../_utils.js";
import { QUERIES } from "../_queries.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;

  const qid = req.query.qid;
  const sql = QUERIES[qid];
  if (!sql) return res.status(404).json({ error: "Unknown query id" });

  let params = [];

  if (qid === "q03") params = [req.query.term ?? ""];
  if (qid === "q06") params = [Number(req.query.user_id ?? 0)];
  if (qid === "q09") params = [req.query.severity ?? "Low"];
  if (qid === "q12" || qid === "q14" || qid === "q16") {
    params = [Number(req.query.member_id ?? 0)];
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

