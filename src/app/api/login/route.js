import { verifyUser, getUserByEmail } from "../../../lib/queries/users";
import crypto from "crypto";

export async function POST(req) {
  const body = await req.json();

  const passwordHash = crypto
    .createHash("sha256")
    .update(body.password)
    .digest("hex");

  const user = await verifyUser(body.email, passwordHash);

  if (!user) {
    return new Response("Invalid", { status: 401 });
  }

  return Response.json({
    role: user.role,
  });
}