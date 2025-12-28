import { createUser } from "@/lib/queries/users";
import crypto from "crypto";

export async function POST(req) {
  const body = await req.json();

  const passwordHash = crypto
    .createHash("sha256")
    .update(body.password)
    .digest("hex");

  await createUser({
    name: body.name,
    email: body.email,
    passwordHash,
    role: body.role,
  });

  return new Response("OK");
}
