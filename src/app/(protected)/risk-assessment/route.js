import { db } from "@/lib/db";

export async function GET() {
  const doctors = await db.doctor.findMany({
    select: { id: true, full_name: true },
  });

  return Response.json(doctors);
}
