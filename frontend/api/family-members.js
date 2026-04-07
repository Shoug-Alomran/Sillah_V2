import { getPool } from "./_db.js";
import { allowMethods, jsonBody } from "./_utils.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const [rows] = await pool.query(
        `SELECT fm.*, u.email AS user_email
         FROM FamilyMember fm
         JOIN \`User\` u ON fm.user_id = u.user_id
         ORDER BY fm.member_id DESC`
      );
      return res.status(200).json(rows);
    }

    const { user_id, first_name, last_name, date_of_birth, relationship } = jsonBody(req);
    const [result] = await pool.query(
      `INSERT INTO FamilyMember (user_id, first_name, last_name, date_of_birth, relationship)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(user_id), first_name, last_name, date_of_birth, relationship]
    );
    return res.status(200).json({ insertedId: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

