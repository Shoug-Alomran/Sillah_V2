import bcrypt from "bcrypt";
import { getDB } from "@/lib/db";

export async function POST(req) {
  const { full_name, email, phone, password, role, doctor_id } = await req.json();

  const db = await getDB();

  const existing = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (existing) {
    return new Response("Email already exists", { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  await db.run(
    "INSERT INTO users (full_name, email, phone, password_hash, role, doctor_id) VALUES (?, ?, ?, ?, ?, ?)",
    full_name,
    email,
    phone,
    password_hash,
    role,
    role === "citizen" ? doctor_id : null
  );

  return new Response("Signup successful", { status: 200 });
}
