import { allowMethods, jsonBody } from "./_utils.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

async function getAuthenticatedUser(req, admin) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const admin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, admin);

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const body = jsonBody(req);
    const medicalHistoryId = String(body.medicalHistoryId || "").trim();
    const requestedDoctorId = String(body.requestedDoctorId || "").trim();
    const message = String(body.message || "").trim() || null;

    if (!medicalHistoryId) return res.status(400).json({ error: "Medical history record is required." });
    if (!requestedDoctorId) return res.status(400).json({ error: "Please choose a doctor." });

    const { data: patientProfile, error: patientError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (patientError) throw patientError;

    if (patientProfile?.role !== "patient") {
      return res.status(403).json({ error: "Only patients can request a second opinion." });
    }

    const { data: doctorProfile, error: doctorError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", requestedDoctorId)
      .eq("role", "doctor")
      .maybeSingle();
    if (doctorError) throw doctorError;

    if (!doctorProfile) return res.status(404).json({ error: "Selected doctor was not found." });

    const { data: historyRecord, error: historyError } = await admin
      .from("medical_history")
      .select("id, family_member_id")
      .eq("id", medicalHistoryId)
      .maybeSingle();
    if (historyError) throw historyError;

    if (!historyRecord) {
      return res.status(404).json({ error: "Diagnosis report was not found." });
    }

    const { data: familyMember, error: familyMemberError } = await admin
      .from("family_members")
      .select("id, user_id")
      .eq("id", historyRecord.family_member_id)
      .maybeSingle();
    if (familyMemberError) throw familyMemberError;

    if (familyMember?.user_id !== user.id) {
      return res.status(403).json({ error: "This diagnosis report does not belong to your account." });
    }

    const { data: request, error: requestError } = await admin
      .from("second_opinion_requests")
      .insert({
        patient_id: user.id,
        requested_doctor_id: requestedDoctorId,
        medical_history_id: medicalHistoryId,
        status: "pending",
        message,
      })
      .select("id, patient_id, requested_doctor_id, medical_history_id, status, message, created_at")
      .single();

    if (requestError) throw requestError;

    return res.status(200).json({ request });
  } catch (error) {
    console.error("SECOND_OPINION_REQUEST_ERROR", error);
    return res.status(500).json({ error: error.message || "Failed to request second opinion." });
  }
}
