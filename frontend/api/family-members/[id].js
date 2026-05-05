import { getPool } from "../_db.js";
import { allowMethods } from "../_utils.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["DELETE"])) return;

  const memberId = Number(req.query.id);
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM RiskAlert WHERE member_id = ?", [memberId]);
    const [result] = await conn.query("DELETE FROM FamilyMember WHERE member_id = ?", [memberId]);
    await conn.commit();
    return res.status(200).json({ affectedRows: result.affectedRows });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
}
