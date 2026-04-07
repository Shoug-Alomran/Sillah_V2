import { allowMethods, jsonBody } from "./_utils.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

const PUBLIC_DOCTOR_FIELDS = "id, full_name, email, phone_number";
const DOCTOR_PROFILE_FIELDS = `
  doctor_id,
  specialty,
  license_number,
  education,
  certifications,
  experience_years,
  clinic_affiliation,
  public_contact_email,
  public_phone,
  bio,
  verification_status,
  admin_notes,
  submitted_at,
  reviewed_at,
  reviewed_by,
  created_at,
  updated_at
`;

async function getAuthenticatedUser(req, admin) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data?.user) return null;
  return data.user;
}

async function getProfile(admin, userId) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, phone_number, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function normalizeDoctorProfile(payload = {}) {
  return {
    specialty: String(payload.specialty || "").trim() || null,
    license_number: String(payload.licenseNumber || payload.license_number || "").trim() || null,
    education: String(payload.education || "").trim() || null,
    certifications: String(payload.certifications || "").trim() || null,
    experience_years:
      payload.experienceYears === "" || payload.experienceYears === null || payload.experienceYears === undefined
        ? null
        : Number(payload.experienceYears),
    clinic_affiliation: String(payload.clinicAffiliation || payload.clinic_affiliation || "").trim() || null,
    public_contact_email: String(payload.publicContactEmail || payload.public_contact_email || "").trim() || null,
    public_phone: String(payload.publicPhone || payload.public_phone || "").trim() || null,
    bio: String(payload.bio || "").trim() || null,
  };
}

function publicDoctorCard(profile, doctorProfile) {
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: doctorProfile.public_contact_email || profile.email,
    phone_number: doctorProfile.public_phone || profile.phone_number,
    specialty: doctorProfile.specialty,
    education: doctorProfile.education,
    certifications: doctorProfile.certifications,
    experience_years: doctorProfile.experience_years,
    clinic_affiliation: doctorProfile.clinic_affiliation,
    bio: doctorProfile.bio,
    verification_status: doctorProfile.verification_status,
  };
}

async function listApprovedDoctors(admin) {
  const { data: doctorProfiles, error: doctorProfilesError } = await admin
    .from("doctor_profiles")
    .select(DOCTOR_PROFILE_FIELDS)
    .eq("verification_status", "approved")
    .order("updated_at", { ascending: false, nullsFirst: false });
  if (doctorProfilesError) throw doctorProfilesError;

  const doctorIds = (doctorProfiles || []).map((profile) => profile.doctor_id).filter(Boolean);
  if (doctorIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select(PUBLIC_DOCTOR_FIELDS)
    .in("id", doctorIds)
    .eq("role", "doctor");
  if (profilesError) throw profilesError;

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  return (doctorProfiles || [])
    .map((doctorProfile) => {
      const profile = profilesById.get(doctorProfile.doctor_id);
      return profile ? publicDoctorCard(profile, doctorProfile) : null;
    })
    .filter(Boolean);
}

async function listProfilesForAdmin(admin) {
  const { data: doctorProfiles, error: doctorProfilesError } = await admin
    .from("doctor_profiles")
    .select(DOCTOR_PROFILE_FIELDS)
    .order("updated_at", { ascending: false, nullsFirst: false });
  if (doctorProfilesError) throw doctorProfilesError;

  const doctorIds = (doctorProfiles || []).map((profile) => profile.doctor_id).filter(Boolean);
  let doctors = [];

  if (doctorIds.length > 0) {
    const { data, error } = await admin
      .from("profiles")
      .select(PUBLIC_DOCTOR_FIELDS)
      .in("id", doctorIds)
      .eq("role", "doctor");
    if (error) throw error;
    doctors = data || [];
  }

  const profilesById = new Map(doctors.map((profile) => [profile.id, profile]));
  return (doctorProfiles || []).map((doctorProfile) => ({
    ...doctorProfile,
    doctor: profilesById.get(doctorProfile.doctor_id) || null,
  }));
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET", "POST", "PATCH"])) return;

  try {
    const admin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, admin);
    const actorProfile = user ? await getProfile(admin, user.id) : null;

    if (req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const mode = url.searchParams.get("mode");

      if (mode === "admin") {
        if (actorProfile?.role !== "admin") return res.status(403).json({ error: "Admin access required." });
        return res.status(200).json({ profiles: await listProfilesForAdmin(admin) });
      }

      if (mode === "mine") {
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        if (actorProfile?.role !== "doctor") return res.status(403).json({ error: "Doctor access required." });

        const { data: doctorProfile, error } = await admin
          .from("doctor_profiles")
          .select(DOCTOR_PROFILE_FIELDS)
          .eq("doctor_id", user.id)
          .maybeSingle();
        if (error) throw error;
        return res.status(200).json({ profile: doctorProfile || null });
      }

      return res.status(200).json({ doctors: await listApprovedDoctors(admin) });
    }

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "POST") {
      if (actorProfile?.role !== "doctor") return res.status(403).json({ error: "Doctor access required." });

      const nextProfile = normalizeDoctorProfile(jsonBody(req));
      if (!nextProfile.specialty || !nextProfile.license_number || !nextProfile.education) {
        return res.status(400).json({ error: "Specialty, license number, and education are required." });
      }

      const { data: profile, error } = await admin
        .from("doctor_profiles")
        .upsert(
          {
            doctor_id: user.id,
            ...nextProfile,
            verification_status: "pending",
            admin_notes: null,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "doctor_id" }
        )
        .select(DOCTOR_PROFILE_FIELDS)
        .single();
      if (error) throw error;

      return res.status(200).json({ profile });
    }

    if (req.method === "PATCH") {
      if (actorProfile?.role !== "admin") return res.status(403).json({ error: "Admin access required." });

      const body = jsonBody(req);
      const doctorId = String(body.doctorId || "").trim();
      const status = String(body.status || "").trim().toLowerCase();
      const adminNotes = String(body.adminNotes || body.admin_notes || "").trim() || null;

      if (!doctorId) return res.status(400).json({ error: "Doctor id is required." });
      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ error: "Status must be approved, rejected, or pending." });
      }

      const { data: profile, error } = await admin
        .from("doctor_profiles")
        .update({
          verification_status: status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("doctor_id", doctorId)
        .select(DOCTOR_PROFILE_FIELDS)
        .single();
      if (error) throw error;

      return res.status(200).json({ profile });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("DOCTOR_PROFILES_ERROR", error);
    return res.status(500).json({ error: error.message || "Doctor profile request failed." });
  }
}
