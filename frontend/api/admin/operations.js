import { allowMethods, jsonBody } from "../_utils.js";
import { getSupabaseAdmin } from "../_supabaseAdmin.js";

const PUBLIC_PROFILE_FIELDS = "id, email, full_name, phone_number, role, selected_doctor_id, patient_code, created_at";
const CLINIC_FIELDS = "id, name, location, contact_number, created_at";
const CONTENT_FIELDS =
  "id, title, summary, category, reading_time, image_url, content_body, status, is_featured, created_at, updated_at, reviewed_at, reviewed_by";
const CONTENT_FALLBACK_FIELDS = "id, title, summary, category, reading_time, image_url, status, is_featured, created_at, updated_at";
const AUDIT_FIELDS = "id, actor_id, action_type, target_type, target_id, details, created_at";

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

function isMissingTable(error) {
  const message = error?.message || "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    /does not exist/i.test(message) ||
    /schema cache/i.test(message) ||
    /could not find the table/i.test(message)
  );
}

function isMissingSchemaColumn(error) {
  const message = error?.message || "";
  return error?.code === "PGRST204" || /could not find.*column/i.test(message) || /schema cache/i.test(message);
}

function isRecoverableAdminDataError(error) {
  return isMissingTable(error) || isMissingSchemaColumn(error);
}

async function safeValue(label, promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    console.warn(`ADMIN_${label}_SKIPPED`, error?.message || error);
    return fallback;
  }
}

async function requireAdmin(req) {
  const admin = getSupabaseAdmin();
  const user = await getAuthenticatedUser(req, admin);
  if (!user) return { error: { status: 401, message: "Unauthorized" } };

  const profile = await getProfile(admin, user.id);
  if (profile?.role !== "admin") {
    return { error: { status: 403, message: "Admin access required." } };
  }

  return { admin, user, profile };
}

async function writeAudit(admin, actorId, actionType, targetType, targetId, details = {}) {
  const { error } = await admin.from("admin_audit_logs").insert({
    actor_id: actorId,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId || null,
    details,
  });

  if (error && !isRecoverableAdminDataError(error)) {
    console.warn("ADMIN_AUDIT_LOG_SKIPPED", error.message);
  }
}

async function safeCount(admin, tableName, filters = []) {
  let query = admin.from(tableName).select("*", { count: "exact", head: true });
  for (const filter of filters) query = query[filter.method](...filter.args);

  const { count, error } = await query;
  if (error) {
    console.warn(`ADMIN_COUNT_${tableName}_SKIPPED`, error.message);
    return 0;
  }
  return count || 0;
}

async function getOverview(admin) {
  const [patients, doctors, admins, clinics, pendingDoctors, pendingContent, auditLogs] = await Promise.all([
    safeValue("OVERVIEW_PATIENT_COUNT", safeCount(admin, "profiles", [{ method: "eq", args: ["role", "patient"] }]), 0),
    safeValue("OVERVIEW_DOCTOR_COUNT", safeCount(admin, "profiles", [{ method: "eq", args: ["role", "doctor"] }]), 0),
    safeValue("OVERVIEW_ADMIN_COUNT", safeCount(admin, "profiles", [{ method: "eq", args: ["role", "admin"] }]), 0),
    safeValue("OVERVIEW_CLINIC_COUNT", safeCount(admin, "clinics"), 0),
    safeValue(
      "OVERVIEW_PENDING_DOCTOR_COUNT",
      safeCount(admin, "doctor_profiles", [{ method: "eq", args: ["verification_status", "pending"] }]),
      0
    ),
    safeValue(
      "OVERVIEW_PENDING_CONTENT_COUNT",
      safeCount(admin, "awareness_content", [{ method: "eq", args: ["status", "pending"] }]),
      0
    ),
    safeValue("OVERVIEW_AUDIT_LOGS", listAuditLogs(admin, 6), []),
  ]);

  return {
    patients,
    doctors,
    admins,
    clinics,
    pendingDoctors,
    pendingContent,
    recentActivity: auditLogs,
  };
}

async function listUsers(admin) {
  const query = admin
    .from("profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .order("created_at", { ascending: false, nullsFirst: false });
  const { data: profiles, error } = await query;

  if (error && isMissingSchemaColumn(error)) {
    const { data: fallbackProfiles, error: fallbackError } = await admin
      .from("profiles")
      .select("id, email, full_name, phone_number, role, created_at")
      .order("created_at", { ascending: false, nullsFirst: false });

    if (fallbackError) throw fallbackError;
    return (fallbackProfiles || []).map((profile) => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      role: profile.role,
      patient_code: null,
      selected_doctor_id: null,
      created_at: profile.created_at,
    }));
  }

  if (error) throw error;

  return (profiles || []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone_number: profile.phone_number,
    role: profile.role,
    patient_code: profile.role === "patient" ? profile.patient_code : null,
    selected_doctor_id: profile.role === "patient" ? profile.selected_doctor_id : null,
    created_at: profile.created_at,
  }));
}

async function updateUser(admin, actorId, body) {
  const userId = String(body.userId || body.id || "").trim();
  const role = String(body.role || "").trim().toLowerCase();
  const fullName = String(body.fullName || body.full_name || "").trim() || null;
  const phoneNumber = String(body.phoneNumber || body.phone_number || "").trim() || null;

  if (!userId) throw new Error("User id is required.");
  if (!["patient", "doctor", "admin"].includes(role)) throw new Error("Role must be patient, doctor, or admin.");

  const updates = {
    role,
    full_name: fullName,
    phone_number: phoneNumber,
    selected_doctor_id: role === "patient" ? body.selectedDoctorId || body.selected_doctor_id || null : null,
  };

  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select(PUBLIC_PROFILE_FIELDS)
    .single();
  if (error) throw error;

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      role,
      full_name: fullName,
      phone_number: phoneNumber,
    },
  });
  if (authUpdateError) console.warn("ADMIN_USER_METADATA_UPDATE_SKIPPED", authUpdateError.message);

  await writeAudit(admin, actorId, "user.updated", "profile", userId, {
    role,
    full_name: fullName,
    phone_number: phoneNumber ? "provided" : "empty",
  });

  return data;
}

async function listClinics(admin) {
  const { data, error } = await admin
    .from("clinics")
    .select(CLINIC_FIELDS)
    .order("created_at", { ascending: false, nullsFirst: false });
  if (error) {
    if (isMissingTable(error)) return [];
    if (isMissingSchemaColumn(error)) {
      const { data: fallbackData, error: fallbackError } = await admin
        .from("clinics")
        .select("id, name, location")
        .order("name", { ascending: true });
      if (fallbackError) {
        if (isMissingTable(fallbackError)) return [];
        throw fallbackError;
      }
      return (fallbackData || []).map((clinic) => ({
        ...clinic,
        contact_number: null,
        created_at: null,
      }));
    }
    throw error;
  }
  return data || [];
}

async function upsertClinic(admin, actorId, body) {
  const clinicId = String(body.id || "").trim();
  const clinic = {
    name: String(body.name || "").trim(),
    location: String(body.location || "").trim(),
    contact_number: String(body.contact_number || body.contactNumber || "").trim() || null,
  };

  if (!clinic.name || !clinic.location) throw new Error("Clinic name and location are required.");

  const query = clinicId
    ? admin.from("clinics").update(clinic).eq("id", clinicId)
    : admin.from("clinics").insert(clinic);

  const { data, error } = await query.select(CLINIC_FIELDS).single();
  if (error) throw error;

  await writeAudit(admin, actorId, clinicId ? "clinic.updated" : "clinic.created", "clinic", data.id, {
    name: clinic.name,
    location: clinic.location,
  });

  return data;
}

async function listContent(admin) {
  const { data, error } = await admin
    .from("awareness_content")
    .select(CONTENT_FIELDS)
    .order("updated_at", { ascending: false, nullsFirst: false });
  if (error) {
    if (isMissingSchemaColumn(error)) {
      const { data: fallbackData, error: fallbackError } = await admin
        .from("awareness_content")
        .select(CONTENT_FALLBACK_FIELDS)
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (fallbackError) {
        if (isRecoverableAdminDataError(fallbackError)) return [];
        throw fallbackError;
      }

      return (fallbackData || []).map((item) => ({
        ...item,
        content_body: null,
        reviewed_at: null,
        reviewed_by: null,
      }));
    }
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data || [];
}

async function selectContent(admin, query) {
  const { data, error } = await query.select(CONTENT_FIELDS).single();
  if (!error) return data;
  if (!isMissingSchemaColumn(error)) throw error;

  const { data: fallbackData, error: fallbackError } = await query.select(CONTENT_FALLBACK_FIELDS).single();
  if (fallbackError) throw fallbackError;
  return {
    ...fallbackData,
    content_body: null,
    reviewed_at: null,
    reviewed_by: null,
  };
}

async function upsertContent(admin, actorId, body) {
  const contentId = String(body.id || "").trim();
  const status = String(body.status || "pending").trim().toLowerCase();
  const content = {
    title: String(body.title || "").trim(),
    summary: String(body.summary || "").trim(),
    category: String(body.category || "").trim() || "General",
    reading_time: Number(body.reading_time || body.readingTime || 5),
    image_url: String(body.image_url || body.imageUrl || "").trim() || null,
    status: ["pending", "approved", "rejected"].includes(status) ? status : "pending",
    is_featured: Boolean(body.is_featured || body.isFeatured),
    updated_at: new Date().toISOString(),
  };

  const contentBody = String(body.content_body || body.contentBody || "").trim() || null;

  if (!content.title || !content.summary) throw new Error("Content title and summary are required.");

  if (content.status === "approved" || content.status === "rejected") {
    content.reviewed_at = new Date().toISOString();
    content.reviewed_by = actorId;
  }

  const fullContent = {
    ...content,
    content_body: contentBody,
  };

  const query = contentId
    ? admin.from("awareness_content").update(fullContent).eq("id", contentId)
    : admin.from("awareness_content").insert(fullContent);

  let data;
  try {
    data = await selectContent(admin, query);
  } catch (error) {
    if (!isMissingSchemaColumn(error)) throw error;

    const fallbackContent = { ...content };
    delete fallbackContent.reviewed_at;
    delete fallbackContent.reviewed_by;
    const fallbackQuery = contentId
      ? admin.from("awareness_content").update(fallbackContent).eq("id", contentId)
      : admin.from("awareness_content").insert(fallbackContent);
    data = await selectContent(admin, fallbackQuery);
  }

  await writeAudit(admin, actorId, contentId ? "content.updated" : "content.created", "awareness_content", data.id, {
    title: content.title,
    status: content.status,
  });

  return data;
}

async function deleteContent(admin, actorId, contentId) {
  if (!contentId) throw new Error("Content id is required.");
  const { error } = await admin.from("awareness_content").delete().eq("id", contentId);
  if (error) throw error;
  await writeAudit(admin, actorId, "content.deleted", "awareness_content", contentId);
}

async function listAuditLogs(admin, limit = 25) {
  const { data, error } = await admin
    .from("admin_audit_logs")
    .select(AUDIT_FIELDS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isRecoverableAdminDataError(error)) return [];
    throw error;
  }
  return data || [];
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;

  try {
    const context = await requireAdmin(req);
    if (context.error) return res.status(context.error.status).json({ error: context.error.message });
    const { admin, user } = context;

    const url = new URL(req.url, "http://localhost");
    const resource = url.searchParams.get("resource") || "overview";
    const body = req.method === "GET" ? {} : jsonBody(req);

    if (req.method === "GET") {
      if (resource === "overview") return res.status(200).json({ overview: await getOverview(admin) });
      if (resource === "users") return res.status(200).json({ users: await listUsers(admin) });
      if (resource === "clinics") return res.status(200).json({ clinics: await listClinics(admin) });
      if (resource === "content") return res.status(200).json({ content: await listContent(admin) });
      if (resource === "audit") return res.status(200).json({ logs: await listAuditLogs(admin) });
      return res.status(400).json({ error: "Unsupported admin resource." });
    }

    if (req.method === "POST") {
      if (resource === "clinics") return res.status(200).json({ clinic: await upsertClinic(admin, user.id, body) });
      if (resource === "content") return res.status(200).json({ item: await upsertContent(admin, user.id, body) });
      return res.status(400).json({ error: "Unsupported create resource." });
    }

    if (req.method === "PATCH") {
      if (resource === "users") return res.status(200).json({ user: await updateUser(admin, user.id, body) });
      if (resource === "clinics") return res.status(200).json({ clinic: await upsertClinic(admin, user.id, body) });
      if (resource === "content") return res.status(200).json({ item: await upsertContent(admin, user.id, body) });
      return res.status(400).json({ error: "Unsupported update resource." });
    }

    if (req.method === "DELETE") {
      if (resource === "content") {
        await deleteContent(admin, user.id, url.searchParams.get("id"));
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: "Unsupported delete resource." });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("ADMIN_OPERATIONS_ERROR", error);
    return res.status(500).json({
      error: error.message || "Admin operation failed.",
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
    });
  }
}
