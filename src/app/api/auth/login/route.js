import bcrypt from "bcrypt";
import { getDB } from "@/lib/db";

export async function POST(req) {
  const { email, password } = await req.json();

  const db = await getDB();

  const user = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (!user) return new Response("Invalid credentials", { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });

  return Response.json({ role: user.role });
}
