import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  User,
  X,
  CheckCircle,
  AlertTriangle,
  Plus,
  Phone,
  Star,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { clinicsData } from "../../data/clinics";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../contexts/LanguageContext";
import OnboardingPrompt from "../../Components/OnboardingPrompt";
import Tooltip from "../../Components/Tooltip";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

function toAppointmentTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  if (!timeStr) return `${dateStr}T00:00:00`;

  const amPmMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const meridiem = amPmMatch[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return `${dateStr}T${String(hours).padStart(2, "0")}:${minutes}:00`;
  }

  const hhmmMatch = String(timeStr).trim().match(/^(\d{2}):(\d{2})$/);
  if (hhmmMatch) return `${dateStr}T${hhmmMatch[1]}:${hhmmMatch[2]}:00`;

  return `${dateStr}T00:00:00`;
}

function isUpcomingStatus(status) {
  const value = String(status || "").toLowerCase();
  return value === "pending" || value === "scheduled" || value === "confirmed";
}

async function updateAppointmentStatusSafe({ appointmentId, doctorId, preferredStatuses }) {
  let lastError = null;

  for (const status of preferredStatuses) {
    let query = supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .select("id, status");

    if (doctorId) query = query.eq("doctor_id", doctorId);

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) return status;
    if (!error && (!Array.isArray(data) || data.length === 0)) {
      lastError = new Error("No appointment row was updated. Please verify doctor assignment and RLS policies.");
      continue;
    }

    lastError = error;
    if (error.code === "22P02") continue;
    throw error;
  }

  throw lastError || new Error("Unable to update appointment status");
}

async function insertAppointment(basePayload) {
  const { data, error } = await supabase.from("appointments").insert(basePayload).select("*").single();
  if (error) throw error;
  return data;
}

export default function Appointments() {
  const location = useLocation();
  const { currentUser, isDoctor, isPatient } = useAuth();
  const { language, t } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicsError, setClinicsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [bookingErrors, setBookingErrors] = useState({});
  const [bookingForm, setBookingForm] = useState({
    clinic_id: "",
    clinic_name: "",
    appointment_date: "",
    appointment_time: "",
    location: "",
    reason: "",
    notes: "",
    phone: "",
    address: "",
  });

  const incomingClinic = location.state?.clinic;
  const isBooking = location.state?.isBooking;
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const clinicsById = useMemo(() => {
    const map = new Map();
    clinics.forEach((clinic) => map.set(String(clinic.id), clinic));
    return map;
  }, [clinics]);

  function enrichClinic(clinicRow) {
    if (!clinicRow) return null;
    const staticMatch = clinicsData.find((clinic) => clinic.name === clinicRow.name);

    return {
      ...staticMatch,
      ...clinicRow,
      id: clinicRow.id,
      name: clinicRow.name,
      location: clinicRow.location || staticMatch?.location || "",
      specialty: staticMatch?.specialty || "General Practice",
      address: staticMatch?.address || clinicRow.location || "Location details unavailable",
      phone: clinicRow.contact_number || staticMatch?.phone || "Contact unavailable",
      rating: staticMatch?.rating ?? null,
      reviews: staticMatch?.reviews ?? null,
      hours: staticMatch?.hours || "Hours unavailable",
      available_slots: staticMatch?.available_slots || [],
    };
  }

  function resetBookingForm() {
    setBookingForm({
      clinic_id: "",
      clinic_name: "",
      appointment_date: "",
      appointment_time: "",
      location: "",
      reason: "",
      notes: "",
      phone: "",
      address: "",
    });
    setBookingErrors({});
    setSelectedClinic(null);
  }

  function validateBookingForm(values = bookingForm) {
    const errors = {};

    if (!values.clinic_id) errors.clinic_id = t("appointments.validationClinic");
    if (!values.appointment_date) errors.appointment_date = t("appointments.validationDate");
    if (!values.appointment_time) errors.appointment_time = t("appointments.validationTime");

    const requestedAt = new Date(
      toAppointmentTimestamp(values.appointment_date, values.appointment_time)
    );

    if (
      values.appointment_date &&
      values.appointment_time &&
      !Number.isNaN(requestedAt.getTime()) &&
      requestedAt < new Date()
    ) {
      errors.appointment_time = t("appointments.validationPast");
    }

    return errors;
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(appointment) {
    if (appointment.appointment_time) return appointment.appointment_time;
    if (!appointment.appointment_date) return "N/A";

    const parsed = new Date(appointment.appointment_date);
    if (Number.isNaN(parsed.getTime())) return "N/A";

    return parsed.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusLabel(status) {
    const normalized = String(status || "pending").toLowerCase();
    if (normalized === "pending") return t("appointments.statusPending");
    if (normalized === "confirmed") return t("appointments.statusConfirmed");
    if (normalized === "scheduled") return t("appointments.statusScheduled");
    if (normalized === "completed") return t("appointments.statusCompleted");
    if (normalized === "cancelled") return t("appointments.statusCancelled");
    return normalized;
  }

  function getEmptyTitle() {
    if (filter === "all") return t("appointments.emptyAllTitle");
    if (filter === "upcoming") return t("appointments.emptyUpcoming");
    if (filter === "completed") return t("appointments.emptyCompleted");
    return t("appointments.emptyCancelled");
  }

  function getMinDate() {
    return new Date().toISOString().split("T")[0];
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchClinics() {
      try {
        setClinicsError("");
        const { data, error: fetchError } = await supabase
          .from("clinics")
          .select("id, name, location, contact_number, created_at")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        if (!cancelled) setClinics(data || []);
      } catch (fetchErr) {
        console.error("Error loading clinics:", fetchErr);
        if (!cancelled) {
          setClinics([]);
          setClinicsError(fetchErr?.message || "Unable to load clinics");
        }
      }
    }

    fetchClinics();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isBooking && incomingClinic && isPatient) {
      const clinicFromDb = clinics.find((clinic) => clinic.name === incomingClinic.name);
      if (clinicFromDb) {
        const clinic = enrichClinic(clinicFromDb);
        setSelectedClinic(clinic);
        setBookingForm({
          clinic_id: clinic.id,
          clinic_name: clinic.name,
          appointment_date: "",
          appointment_time: "",
          location: clinic.location,
          address: clinic.address,
          phone: clinic.phone,
          reason: "",
          notes: "",
        });
      }
      setShowBookingModal(true);
    }
  }, [isBooking, incomingClinic, isPatient, clinics]);

  const fetchAppointments = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Please log in to view appointments");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("appointments").select("*");
      if (isPatient) query = query.eq("patient_id", currentUser.id);
      else if (isDoctor) query = query.eq("doctor_id", currentUser.id);

      const { data, error: fetchError } = await query
        .order("appointment_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      let rows = data || [];
      if (isDoctor && rows.length > 0) {
        const patientIds = [...new Set(rows.map((row) => row.patient_id).filter(Boolean))];
        if (patientIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, patient_code")
            .in("id", patientIds);

          if (profileError) throw profileError;

          const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
          rows = rows.map((row) => {
            const patient = profilesById.get(row.patient_id);
            return {
              ...row,
              patient_name: row.patient_name || patient?.full_name || patient?.email || "Patient",
              patient_code: row.patient_code || patient?.patient_code || null,
            };
          });
        }
      }

      setAppointments(rows);
    } catch (fetchErr) {
      console.error("Error fetching appointments:", fetchErr);
      setError(fetchErr?.message || "Unable to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, isDoctor, isPatient]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`appointments-live-${currentUser.id}-${isDoctor ? "doctor" : "patient"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        const newRow = payload.new || {};
        const oldRow = payload.old || {};

        if (isPatient && (newRow.patient_id === currentUser.id || oldRow.patient_id === currentUser.id)) {
          fetchAppointments();
        }

        if (isDoctor && (newRow.doctor_id === currentUser.id || oldRow.doctor_id === currentUser.id)) {
          fetchAppointments();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isDoctor, isPatient, fetchAppointments]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const pollId = window.setInterval(() => {
      fetchAppointments();
    }, 10000);

    const onFocus = () => fetchAppointments();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [currentUser?.id, fetchAppointments]);

  function handleClinicSelect(event) {
    const clinicId = event.target.value;
    const clinic = enrichClinic(clinicsById.get(String(clinicId)));

    if (clinic) {
      setSelectedClinic(clinic);
      const nextValues = {
        ...bookingForm,
        clinic_id: clinic.id || "",
        clinic_name: clinic.name,
        location: clinic.location,
        address: clinic.address,
        phone: clinic.phone,
      };
      setBookingForm(nextValues);
      setBookingErrors(validateBookingForm(nextValues));
      return;
    }

    const nextValues = {
      ...bookingForm,
      clinic_id: "",
      clinic_name: "",
      location: "",
      address: "",
      phone: "",
    };
    setSelectedClinic(null);
    setBookingForm(nextValues);
    setBookingErrors(validateBookingForm(nextValues));
  }

  async function resolveDoctorIdForPatient() {
    if (!currentUser?.id) return null;

    const { data: relation, error: relationError } = await supabase
      .from("doctor_patient")
      .select("doctor_id")
      .eq("patient_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (relationError) throw relationError;
    if (relation?.doctor_id) return relation.doctor_id;

    const { data: patientProfile, error: profileError } = await supabase
      .from("profiles")
      .select("selected_doctor_id")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) throw profileError;
    return patientProfile?.selected_doctor_id || null;
  }

  async function handleBookAppointment(event) {
    event.preventDefault();

    if (!currentUser?.id || !isPatient) {
      alert(t("appointments.patientOnly"));
      return;
    }

    const nextErrors = validateBookingForm();
    setBookingErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const doctorId = await resolveDoctorIdForPatient();
      if (!doctorId) {
        throw new Error(
          "No doctor is linked to your account yet. Please connect with a doctor before booking an appointment."
        );
      }

      const data = await insertAppointment({
        patient_id: currentUser.id,
        doctor_id: doctorId,
        clinic_id: bookingForm.clinic_id,
        appointment_date: toAppointmentTimestamp(
          bookingForm.appointment_date,
          bookingForm.appointment_time
        ),
        status: "pending",
      });

      setAppointments((prev) => [data, ...prev]);
      setShowBookingModal(false);
      resetBookingForm();
      alert(t("appointments.bookSuccess"));
    } catch (bookingError) {
      console.error("Error booking appointment:", bookingError);
      alert(bookingError?.message || t("appointments.bookFail"));
    }
  }

  async function handleCancelAppointment(appointmentId) {
    if (!window.confirm(t("appointments.cancelConfirm"))) return;

    try {
      let query = supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId)
        .select("id, status");

      if (isPatient) query = query.eq("patient_id", currentUser.id);
      if (isDoctor) query = query.eq("doctor_id", currentUser.id);

      const { data, error: updateError } = await query;

      if (updateError) throw updateError;
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No appointment row was updated. Please verify your appointment access.");
      }

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: "cancelled" } : appointment
        )
      );
      alert(t("appointments.cancelSuccess"));
    } catch (cancelError) {
      console.error("Error cancelling appointment:", cancelError);
      alert(cancelError?.message || t("appointments.cancelFail"));
    }
  }

  async function handleCompleteAppointment(appointmentId) {
    if (!isDoctor) return;

    try {
      await updateAppointmentStatusSafe({
        appointmentId,
        doctorId: currentUser.id,
        preferredStatuses: ["completed"],
      });

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: "completed" } : appointment
        )
      );
      alert(t("appointments.completeSuccess"));
    } catch (completeError) {
      console.error("Error completing appointment:", completeError);
      alert(completeError?.message || t("appointments.completeFail"));
    }
  }

  async function handleConfirmAppointment(appointmentId) {
    if (!isDoctor) return;

    try {
      const chosenStatus = await updateAppointmentStatusSafe({
        appointmentId,
        doctorId: currentUser.id,
        preferredStatuses: ["confirmed", "scheduled", "pending"],
      });

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: chosenStatus } : appointment
        )
      );

      if (chosenStatus === "pending") alert(t("appointments.confirmFallback"));
      else alert(t("appointments.confirmSuccess"));
    } catch (confirmError) {
      console.error("Error confirming appointment:", confirmError);
      alert(confirmError?.message || t("appointments.confirmFail"));
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return isUpcomingStatus(appointment.status);
    return String(appointment.status || "").toLowerCase() === filter;
  });

  if (loading) {
    return (
      <AppLoadingScreen
        title={isDoctor ? t("appointments.titleDoctor") : t("appointments.titlePatient")}
        message={t("appointments.loading")}
      />
    );
  }

  if (error) {
    return (
      <div className="appointments-page">
        <div className="appointments-container">
          <header className="appointments-header">
            <h1 className="appointments-title">
              <Calendar className="title-icon" />
              {isDoctor ? t("appointments.titleDoctor") : t("appointments.titlePatient")}
            </h1>
            <p className="appointments-subtitle">{t("appointments.errorSubtitle")}</p>
          </header>
          <div className="empty-state">
            <AlertTriangle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">{error}</p>
            <p className="empty-text">{t("appointments.errorBody")}</p>
            <button onClick={() => window.location.reload()} className="empty-action-btn">
              {t("common.tryAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-page">
      <div className="appointments-container">
        <header
          className="appointments-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <div>
            <h1 className="appointments-title">
              <Calendar className="title-icon" />
              {isDoctor ? t("appointments.titleDoctor") : t("appointments.titlePatient")}
            </h1>
            <p className="appointments-subtitle">
              {isDoctor
                ? t("appointments.countDoctor", {
                    count: appointments.length,
                    suffix: appointments.length !== 1 ? "s" : "",
                  })
                : t("appointments.countPatient", {
                    count: appointments.length,
                    suffix: appointments.length !== 1 ? "s" : "",
                  })}
            </p>
          </div>
          {isPatient && (
            <button onClick={() => setShowBookingModal(true)} className="add-member-btn" style={{ marginTop: 0 }}>
              <Plus className="btn-icon" />
              {t("appointments.book")}
            </button>
          )}
        </header>

        {isPatient && (
          <OnboardingPrompt
            storageKey="sillah-appointments-onboarding"
            title={t("appointments.firstTimeTitle")}
            body={t("appointments.firstTimeBody")}
            actionLabel={t("appointments.firstTimeAction")}
            onAction={() => setShowBookingModal(true)}
          />
        )}

        <div className="appointments-filters">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            {t("appointments.filters.all")} ({appointments.length})
          </button>
          <button className={`filter-btn ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>
            {t("appointments.filters.upcoming")} ({appointments.filter((item) => isUpcomingStatus(item.status)).length})
          </button>
          <button className={`filter-btn ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
            {t("appointments.filters.completed")} ({appointments.filter((item) => String(item.status || "").toLowerCase() === "completed").length})
          </button>
          <button className={`filter-btn ${filter === "cancelled" ? "active" : ""}`} onClick={() => setFilter("cancelled")}>
            {t("appointments.filters.cancelled")} ({appointments.filter((item) => String(item.status || "").toLowerCase() === "cancelled").length})
          </button>
        </div>

        <div className="appointments-list">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-icon" />
              <p className="empty-title">{getEmptyTitle()}</p>
              <p className="empty-text">
                {filter === "all"
                  ? isDoctor
                    ? t("appointments.emptyDoctor")
                    : t("appointments.emptyPatient")
                  : t("appointments.emptyFiltered")}
              </p>
              {isPatient && filter === "all" && (
                <button onClick={() => setShowBookingModal(true)} className="empty-action-btn">
                  <Plus className="empty-action-icon" />
                  {t("appointments.emptyAction")}
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const normalizedStatus = String(appointment.status || "pending").toLowerCase();
              const clinicMeta = enrichClinic(clinicsById.get(String(appointment.clinic_id)));

              return (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="appointment-header-content">
                      <h2 className="appointment-clinic">
                        {clinicMeta?.name || appointment.clinic_name || "Clinic Appointment"}
                      </h2>
                      <span
                        className="appointment-badge"
                        style={{
                          background:
                            normalizedStatus === "scheduled" || normalizedStatus === "pending" || normalizedStatus === "confirmed"
                              ? "#dbeafe"
                              : normalizedStatus === "completed"
                                ? "#d1fae5"
                                : normalizedStatus === "cancelled"
                                  ? "#fee2e2"
                                  : "#f3f4f6",
                          color:
                            normalizedStatus === "scheduled" || normalizedStatus === "pending" || normalizedStatus === "confirmed"
                              ? "#1e40af"
                              : normalizedStatus === "completed"
                                ? "#065f46"
                                : normalizedStatus === "cancelled"
                                  ? "#991b1b"
                                  : "#374151",
                          borderColor:
                            normalizedStatus === "scheduled" || normalizedStatus === "pending" || normalizedStatus === "confirmed"
                              ? "#bfdbfe"
                              : normalizedStatus === "completed"
                                ? "#a7f3d0"
                                : normalizedStatus === "cancelled"
                                  ? "#fecaca"
                                  : "#d1d5db",
                        }}
                      >
                        {getStatusLabel(normalizedStatus)}
                      </span>
                    </div>
                    {isUpcomingStatus(normalizedStatus) && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="cancel-btn"
                        title={t("appointments.cancelTooltip")}
                      >
                        <X className="cancel-icon" />
                      </button>
                    )}
                  </div>

                  <div className="appointment-body">
                    <div className="appointment-info-grid">
                      <div className="appointment-info-item">
                        <Calendar className="info-icon" />
                        <span className="info-text">{formatDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="appointment-info-item">
                        <Clock className="info-icon" />
                        <span className="info-text">{formatTime(appointment)}</span>
                      </div>
                      <div className="appointment-info-item">
                        <MapPin className="info-icon" />
                        <span className="info-text">{clinicMeta?.location || appointment.location || "N/A"}</span>
                      </div>
                      {isDoctor && appointment.patient_name && (
                        <div className="appointment-info-item">
                          <User className="info-icon" />
                          <span className="info-text">{appointment.patient_name}</span>
                        </div>
                      )}
                    </div>

                    {appointment.reason && (
                      <div className="appointment-detail-box">
                        <p className="detail-text">
                          <strong>{t("appointments.reasonLabel")}</strong> {appointment.reason}
                        </p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="appointment-detail-box">
                        <p className="detail-text">
                          <strong>{t("appointments.notesLabel")}</strong> {appointment.notes}
                        </p>
                      </div>
                    )}

                    {isDoctor && isUpcomingStatus(normalizedStatus) && (
                      <div className="appointment-actions">
                        {normalizedStatus === "pending" && (
                          <button
                            onClick={() => handleConfirmAppointment(appointment.id)}
                            className="complete-btn"
                            style={{ marginRight: "0.5rem" }}
                          >
                            <CheckCircle className="complete-icon" />
                            {t("appointments.confirmAppointment")}
                          </button>
                        )}
                        <button onClick={() => handleCompleteAppointment(appointment.id)} className="complete-btn">
                          <CheckCircle className="complete-icon" />
                          {t("appointments.markCompleted")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showBookingModal && isPatient && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t("appointments.modalTitle")}</h2>
              <button onClick={() => setShowBookingModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleBookAppointment} className="modal-body">
              <div className="form-content">
                <div className="form-field">
                  <label htmlFor="clinic_select" className="form-label">
                    <MapPin className="form-label-icon" />
                    {t("appointments.clinic")} *
                    <Tooltip content={t("appointments.clinicHelp")} iconOnly>
                      <span className="label-help">?</span>
                    </Tooltip>
                  </label>
                  <select
                    id="clinic_select"
                    value={bookingForm.clinic_id}
                    onChange={handleClinicSelect}
                    className={`form-input ${bookingErrors.clinic_id ? "form-input--error" : ""}`}
                    required
                    disabled={clinics.length === 0}
                  >
                    <option value="">{t("appointments.clinicPlaceholder")}</option>
                    {clinics.map((clinicRow) => {
                      const clinic = enrichClinic(clinicRow);
                      return (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name} - {clinic.location} ({clinic.specialty})
                        </option>
                      );
                    })}
                  </select>
                  {clinics.length === 0 && <p className="inline-field-error">{t("appointments.noClinics")}</p>}
                  {clinicsError && <p className="inline-field-error">{clinicsError}</p>}
                  {bookingErrors.clinic_id && <p className="inline-field-error">{bookingErrors.clinic_id}</p>}
                </div>

                {selectedClinic && (
                  <div className="clinic-details-box">
                    <div className="clinic-detail-row">
                      <MapPin className="clinic-detail-icon" />
                      <span>{selectedClinic.address}</span>
                    </div>
                    <div className="clinic-detail-row">
                      <Phone className="clinic-detail-icon" />
                      <span>{selectedClinic.phone}</span>
                    </div>
                    <div className="clinic-detail-row">
                      <Clock className="clinic-detail-icon" />
                      <span>{selectedClinic.hours}</span>
                    </div>
                    <div className="clinic-detail-row">
                      <Star className="clinic-detail-icon" style={{ color: "#f59e0b" }} />
                      <span>{selectedClinic.rating} / 5 ({selectedClinic.reviews} reviews)</span>
                    </div>
                  </div>
                )}

                {selectedClinic && selectedClinic.available_slots && (
                  <div className="form-field">
                    <label className="form-label">
                      <Clock className="form-label-icon" />
                      {t("appointments.availableToday")}
                      <Tooltip content={t("appointments.availableHelp")} iconOnly>
                        <span className="label-help">?</span>
                      </Tooltip>
                    </label>
                    <div className="time-slots-grid">
                      {selectedClinic.available_slots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`time-slot-btn ${bookingForm.appointment_time === slot ? "selected" : ""}`}
                          onClick={() => {
                            const nextValues = {
                              ...bookingForm,
                              appointment_time: slot,
                              appointment_date: new Date().toISOString().split("T")[0],
                            };
                            setBookingForm(nextValues);
                            setBookingErrors(validateBookingForm(nextValues));
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-grid-two">
                  <div className="form-field">
                    <label htmlFor="appointment_date" className="form-label">
                      <Calendar className="form-label-icon" />
                      {t("appointments.date")} *
                    </label>
                    <input
                      id="appointment_date"
                      type="date"
                      min={getMinDate()}
                      value={bookingForm.appointment_date}
                      onChange={(event) => {
                        const nextValues = {
                          ...bookingForm,
                          appointment_date: event.target.value,
                        };
                        setBookingForm(nextValues);
                        setBookingErrors(validateBookingForm(nextValues));
                      }}
                      className={`form-input ${bookingErrors.appointment_date ? "form-input--error" : ""}`}
                      required
                    />
                    {bookingErrors.appointment_date && (
                      <p className="inline-field-error">{bookingErrors.appointment_date}</p>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="appointment_time" className="form-label">
                      <Clock className="form-label-icon" />
                      {t("appointments.time")} *
                    </label>
                    <input
                      id="appointment_time"
                      type="time"
                      value={bookingForm.appointment_time}
                      onChange={(event) => {
                        const nextValues = {
                          ...bookingForm,
                          appointment_time: event.target.value,
                        };
                        setBookingForm(nextValues);
                        setBookingErrors(validateBookingForm(nextValues));
                      }}
                      className={`form-input ${bookingErrors.appointment_time ? "form-input--error" : ""}`}
                      required
                    />
                    {bookingErrors.appointment_time && (
                      <p className="inline-field-error">{bookingErrors.appointment_time}</p>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reason" className="form-label">
                    <User className="form-label-icon" />
                    {t("appointments.reason")}
                    <Tooltip content={t("appointments.reasonHelp")} iconOnly>
                      <span className="label-help">?</span>
                    </Tooltip>
                  </label>
                  <input
                    id="reason"
                    type="text"
                    value={bookingForm.reason}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, reason: event.target.value }))
                    }
                    className="form-input"
                    placeholder={t("appointments.reasonPlaceholder")}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="notes" className="form-label">
                    {t("appointments.notes")}
                    <Tooltip content={t("appointments.notesHelp")} iconOnly>
                      <span className="label-help">?</span>
                    </Tooltip>
                  </label>
                  <textarea
                    id="notes"
                    value={bookingForm.notes}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="form-input form-textarea"
                    placeholder={t("appointments.notesPlaceholder")}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    resetBookingForm();
                  }}
                  className="cancel-btn"
                  style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem" }}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="save-btn">
                  <Calendar className="btn-icon" style={{ width: "1rem", height: "1rem" }} />
                  {t("appointments.confirmBooking")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
