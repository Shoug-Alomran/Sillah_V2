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

function buildReportNotes({ symptoms, assessment, treatmentPlan, followUp, doctorEmail }) {
  const sections = [
    ["Symptoms / Concerns", symptoms],
    ["Clinical Assessment", assessment],
    ["Treatment Plan", treatmentPlan],
    ["Follow-up Instructions", followUp],
    ["Recorded By", doctorEmail || "Assigned doctor"],
  ];

  const body = sections
    .filter(([, value]) => String(value || "").trim() !== "")
    .map(([label, value]) => `${label}:\n${String(value).trim()}`)
    .join("\n\n");

  return `Doctor Diagnosis Report${body ? `\n\n${body}` : ""}`;
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
    const patientId = String(body.patientId || "").trim();
    const diagnosis = String(body.diagnosis || "").trim();
    const diagnosisDate = body.diagnosisDate ? String(body.diagnosisDate) : new Date().toISOString().slice(0, 10);

    if (!patientId) return res.status(400).json({ error: "Patient id is required." });
    if (!diagnosis) return res.status(400).json({ error: "Diagnosis is required." });
    if (diagnosisDate > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: "Diagnosis date cannot be in the future." });
    }

    const { data: doctorProfile, error: doctorError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (doctorError) throw doctorError;

    if (doctorProfile?.role !== "doctor") {
      return res.status(403).json({ error: "Only doctors can save diagnosis reports." });
    }

    const { data: assignment, error: assignmentError } = await admin
      .from("doctor_patient")
      .select("doctor_id, patient_id")
      .eq("doctor_id", user.id)
      .eq("patient_id", patientId)
      .maybeSingle();
    if (assignmentError) throw assignmentError;

    if (!assignment) {
      return res.status(403).json({ error: "This patient is not assigned to you." });
    }

    const { data: patientProfile, error: patientError } = await admin
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", patientId)
      .eq("role", "patient")
      .maybeSingle();
    if (patientError) throw patientError;

    if (!patientProfile) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const { data: familyMembers, error: membersError } = await admin
      .from("family_members")
      .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
      .eq("user_id", patientId);
    if (membersError) throw membersError;

    let selfMember = (familyMembers || []).find(
      (member) => String(member.relationship || "").trim().toLowerCase() === "self"
    );

    if (!selfMember) {
      const { data: createdSelf, error: createSelfError } = await admin
        .from("family_members")
        .insert({
          user_id: patientId,
          full_name: patientProfile.full_name || "Patient",
          relationship: "Self",
          gender: null,
          date_of_birth: null,
        })
        .select("id, user_id, full_name, gender, relationship, date_of_birth, created_at")
        .single();

      if (createSelfError) throw createSelfError;
      selfMember = createdSelf;
    }

    const { data: report, error: reportError } = await admin
      .from("medical_history")
      .insert({
        family_member_id: selfMember.id,
        condition_name: diagnosis,
        diagnosis_date: diagnosisDate,
        notes: buildReportNotes({
          symptoms: body.symptoms,
          assessment: body.assessment,
          treatmentPlan: body.treatmentPlan,
          followUp: body.followUp,
          doctorEmail: user.email,
        }),
      })
      .select("id, family_member_id, condition_name, diagnosis_date, notes, created_at")
      .single();

    if (reportError) throw reportError;

    return res.status(200).json({ report, selfMember });
  } catch (error) {
    console.error("DIAGNOSIS_REPORT_ERROR", error);
    return res.status(500).json({ error: error.message || "Failed to save diagnosis report." });
  }
}
