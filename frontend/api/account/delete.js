import { allowMethods, jsonBody } from "../_utils.js";
import { getSupabaseAdmin } from "../_supabaseAdmin.js";

function isMissingColumnError(error) {
  return error?.code === "42703";
}

async function runDelete(queryPromise) {
  const { error } = await queryPromise;
  if (error && !isMissingColumnError(error)) throw error;
}

async function runUpdate(queryPromise) {
  const { error } = await queryPromise;
  if (error && !isMissingColumnError(error)) throw error;
}

async function getAuthenticatedUser(req, admin) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const admin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, admin);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = jsonBody(req);
    const confirmation = String(body.confirmation || "").trim().toUpperCase();
    if (confirmation !== "DELETE") {
      return res.status(400).json({ error: "Confirmation text must be DELETE." });
    }

    const userId = user.id;
    const { data: profile, error: profileFetchError } = await admin
      .from("profiles")
      .select("patient_code, role")
      .eq("id", userId)
      .maybeSingle();
    if (profileFetchError) throw profileFetchError;

    const { data: familyMembers, error: familyFetchError } = await admin
      .from("family_members")
      .select("id")
      .eq("user_id", userId);
    if (familyFetchError) throw familyFetchError;

    const familyMemberIds = (familyMembers || []).map((row) => row.id).filter(Boolean);
    if (familyMemberIds.length > 0) {
      const { error: historyError } = await admin
        .from("medical_history")
        .delete()
        .in("family_member_id", familyMemberIds);
      if (historyError) throw historyError;
    }

    await runDelete(admin.from("risk_alerts").delete().eq("patient_id", userId));
    await runDelete(admin.from("appointments").delete().eq("patient_id", userId));
    await runDelete(admin.from("appointments").delete().eq("doctor_id", userId));
    await runDelete(admin.from("doctor_patient").delete().eq("patient_id", userId));
    await runDelete(admin.from("doctor_patient").delete().eq("doctor_id", userId));
    await runUpdate(
      admin.from("profiles").update({ selected_doctor_id: null }).eq("selected_doctor_id", userId)
    );

    await runDelete(admin.from("medications").delete().eq("patient_id", userId));
    await runDelete(admin.from("medications").delete().eq("doctor_id", userId));
    await runDelete(admin.from("medications").delete().eq("user_id", userId));
    await runDelete(admin.from("medications").delete().eq("prescribed_by", userId));

    if (profile?.patient_code) {
      await runDelete(
        admin.from("medications").delete().eq("prescribed_for_patient", profile.patient_code)
      );
    }

    await runDelete(admin.from("family_members").delete().eq("user_id", userId));

    const { error: profileDeleteError } = await admin.from("profiles").delete().eq("id", userId);
    if (profileDeleteError) throw profileDeleteError;

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteError) throw authDeleteError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("ACCOUNT_DELETE_ERROR", error);
    return res.status(500).json({ error: error.message || "Failed to delete account." });
  }
}
