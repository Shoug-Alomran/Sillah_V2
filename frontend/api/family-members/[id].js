import { getPool } from "../_db.js";
import { allowMethods } from "../_utils.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["DELETE"])) return;

  const memberId = Number(req.query.id);
  const pool = getPool();

  try {
    const [result] = await pool.query("DELETE FROM FamilyMember WHERE member_id = ?", [memberId]);
    return res.status(200).json({ affectedRows: result.affectedRows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

