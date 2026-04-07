import { getPool } from "./_db.js";
import { allowMethods, jsonBody } from "./_utils.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const [rows] = await pool.query("SELECT * FROM `User` ORDER BY user_id DESC");
      return res.status(200).json(rows);
    }

    const { first_name, last_name, email, phone_number } = jsonBody(req);
    const [result] = await pool.query(
      "INSERT INTO `User` (first_name, last_name, email, phone_number) VALUES (?, ?, ?, ?)",
      [first_name, last_name, email, phone_number]
    );
    return res.status(200).json({ insertedId: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

