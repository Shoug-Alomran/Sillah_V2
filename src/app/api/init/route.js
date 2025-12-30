import { getDB } from "@/lib/db";

export async function GET() {
  const db = await getDB();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'provider')),
      doctor_id INTEGER
    );
  `);

  return Response.json({ message: "Database initialized" });
}
