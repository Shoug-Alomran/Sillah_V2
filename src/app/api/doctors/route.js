import { getDB } from "@/lib/db";

export async function GET() {
  const db = await getDB();

  const doctors = await db.all(
    "SELECT id, full_name FROM users WHERE role = 'provider'"
  );

  return Response.json(doctors);
}
