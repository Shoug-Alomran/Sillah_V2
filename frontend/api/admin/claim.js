import { allowMethods, jsonBody } from "../_utils.js";
import { getSupabaseAdmin } from "../_supabaseAdmin.js";

async function getAuthenticatedUser(req, admin) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data?.user) return null;
  return data.user;
}

function emailDomain(email) {
  const parts = String(email || "").toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const inviteCode = process.env.ADMIN_INVITE_CODE;
    if (!inviteCode) {
      return res.status(500).json({
        error: "Admin invite code is not configured. Add ADMIN_INVITE_CODE in Vercel, then redeploy.",
      });
    }

    const admin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, admin);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const body = jsonBody(req);
    const submittedCode = String(body.inviteCode || "").trim();
    if (!submittedCode || submittedCode !== inviteCode) {
      return res.status(403).json({ error: "Invalid admin invite code." });
    }

    const allowedDomains = String(process.env.ADMIN_ALLOWED_EMAIL_DOMAINS || "")
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);

    if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain(user.email))) {
      return res.status(403).json({
        error: "This email domain is not allowed for admin accounts.",
      });
    }

    const { data: profile, error } = await admin
      .from("profiles")
      .update({
        role: "admin",
        selected_doctor_id: null,
      })
      .eq("id", user.id)
      .select("id, email, full_name, phone_number, role, selected_doctor_id, patient_code, created_at")
      .single();
    if (error) throw error;

    const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        role: "admin",
      },
    });
    if (metadataError) throw metadataError;

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("ADMIN_CLAIM_ERROR", error);
    return res.status(500).json({ error: error.message || "Unable to activate admin account." });
  }
}
