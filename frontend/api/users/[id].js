import { getPool } from "../_db.js";
import { allowMethods, jsonBody } from "../_utils.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["PUT", "DELETE"])) return;

  const userId = Number(req.query.id);
  const pool = getPool();

  try {
    if (req.method === "PUT") {
      const { first_name, last_name, email, phone_number } = jsonBody(req);
      const [result] = await pool.query(
        `UPDATE \`User\`
         SET first_name = ?, last_name = ?, email = ?, phone_number = ?
         WHERE user_id = ?`,
        [first_name, last_name, email, phone_number, userId]
      );
      return res.status(200).json({ affectedRows: result.affectedRows });
    }

    const [result] = await pool.query("DELETE FROM `User` WHERE user_id = ?", [userId]);
    return res.status(200).json({ affectedRows: result.affectedRows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

