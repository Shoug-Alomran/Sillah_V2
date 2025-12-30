import bcrypt from "bcrypt";
import { getDB } from "@/lib/db";

export async function GET() {
  const db = await getDB();

  const password_hash = await bcrypt.hash("password123", 10);

  await db.run(
    "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    "Dr. Test",
    "doctor@test.com",
    "0500000000",
    password_hash,
    "provider"
  );

  return Response.json({ message: "Doctor added" });
}
