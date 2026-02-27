import { getPool } from "./_db.js";
import { allowMethods } from "./_utils.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;

  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

