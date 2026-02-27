import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, User, X, CheckCircle, AlertTriangle, Plus, Phone, Star } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { clinicsData } from "../../data/clinics";
import { supabase } from "../../lib/supabaseClient";

function toAppointmentTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  if (!timeStr) return `${dateStr}T00:00:00`;

  // Handles "HH:mm" from <input type="time"> and "h:mm AM/PM" from preset slots.
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

function appointmentTimeLabel(appointment) {
  if (appointment.appointment_time) return appointment.appointment_time;
  if (!appointment.appointment_date) return "N/A";
  const parsed = new Date(appointment.appointment_date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isUpcomingStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "pending" || s === "scheduled" || s === "confirmed";
}

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Pending Confirmation";
  if (!s) return "Pending Confirmation";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function insertAppointment(basePayload) {
  const { data, error } = await supabase
    .from("appointments")
    .insert(basePayload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export default function Appointments() {
  const location = useLocation();
  const { currentUser, isDoctor, isPatient } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    clinic_id: "",
    clinic_name: "",
    appointment_date: "",
    appointment_time: "",
    location: "",
    reason: "",
    notes: "",
    phone: "",
    address: ""
  });

  const incomingClinic = location.state?.clinic;
  const isBooking = location.state?.isBooking;

  useEffect(() => {
    if (isBooking && incomingClinic && isPatient) {
      const clinic = clinicsData.find((c) => c.name === incomingClinic.name);
      if (clinic) {
        setSelectedClinic(clinic);
        setBookingForm({
          clinic_id: clinic.db_id || "",
          clinic_name: clinic.name,
          appointment_date: "",
          appointment_time: "",
          location: clinic.location,
          address: clinic.address,
          phone: clinic.phone,
          reason: "",
          notes: ""
        });
      }
      setShowBookingModal(true);
    }
  }, [isBooking, incomingClinic, isPatient]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAppointments() {
      if (!currentUser?.id) {
        if (!cancelled) {
          setError("Please log in to view appointments");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase.from("appointments").select("*");

        if (isPatient) {
          query = query.eq("patient_id", currentUser.id);
        } else if (isDoctor) {
          query = query.eq("doctor_id", currentUser.id);
        }

        const { data, error: fetchError } = await query
          .order("appointment_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (!cancelled) {
          setAppointments(data || []);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        if (!cancelled) setError(err?.message || "Unable to load appointments. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAppointments();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isPatient, isDoctor]);

  const handleClinicSelect = (e) => {
    const clinicId = e.target.value;
    const clinic = clinicsData.find((c) => String(c.db_id) === String(clinicId));

    if (clinic) {
      setSelectedClinic(clinic);
      setBookingForm((prev) => ({
        ...prev,
        clinic_id: clinic.db_id || "",
        clinic_name: clinic.name,
        location: clinic.location,
        address: clinic.address,
        phone: clinic.phone
      }));
    } else {
      setSelectedClinic(null);
      setBookingForm((prev) => ({
        ...prev,
        clinic_id: "",
        clinic_name: "",
        location: "",
        address: "",
        phone: ""
      }));
    }
  };

  async function resolveDoctorIdForPatient() {
    if (!currentUser?.id) return null;

    const { data: relation } = await supabase
      .from("doctor_patient")
      .select("doctor_id")
      .eq("patient_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (relation?.doctor_id) return relation.doctor_id;

    const { data: patientProfile } = await supabase
      .from("profiles")
      .select("selected_doctor_id")
      .eq("id", currentUser.id)
      .maybeSingle();

    return patientProfile?.selected_doctor_id || null;
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!currentUser?.id || !isPatient) {
      alert("Only patient accounts can book appointments.");
      return;
    }

    if (!bookingForm.clinic_id || !bookingForm.appointment_date || !bookingForm.appointment_time) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const doctorId = await resolveDoctorIdForPatient();

      const newAppointment = {
        patient_id: currentUser.id,
        doctor_id: doctorId,
        clinic_id: bookingForm.clinic_id,
        appointment_date: toAppointmentTimestamp(bookingForm.appointment_date, bookingForm.appointment_time),
        status: "pending"
      };

      const data = await insertAppointment(newAppointment);

      setAppointments((prev) => [data, ...prev]);
      setBookingForm({
        clinic_id: "",
        clinic_name: "",
        appointment_date: "",
        appointment_time: "",
        location: "",
        reason: "",
        notes: "",
        phone: "",
        address: ""
      });
      setSelectedClinic(null);
      setShowBookingModal(false);

      alert("Appointment booked successfully!");
    } catch (err) {
      console.error("Error booking appointment:", err);
      alert(err?.message || "Failed to book appointment. Please try again.");
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return isUpcomingStatus(apt.status);
    return String(apt.status || "").toLowerCase() === filter;
  });

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (updateError) throw updateError;

      setAppointments((prev) => prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt)));
      alert("Appointment cancelled successfully");
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert(err?.message || "Failed to cancel appointment. Please try again.");
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!isDoctor) return;

    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId)
        .eq("doctor_id", currentUser.id);

      if (updateError) throw updateError;

      setAppointments((prev) => prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "completed" } : apt)));
      alert("Appointment marked as completed");
    } catch (err) {
      console.error("Error completing appointment:", err);
      alert(err?.message || "Failed to complete appointment. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="appointments-page">
        <div className="appointments-container">
          <header className="appointments-header">
            <h1 className="appointments-title">
              <Calendar className="title-icon" />
              {isDoctor ? "Patient Appointments" : "My Appointments"}
            </h1>
            <p className="appointments-subtitle">Loading appointments...</p>
          </header>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointments-page">
        <div className="appointments-container">
          <header className="appointments-header">
            <h1 className="appointments-title">
              <Calendar className="title-icon" />
              {isDoctor ? "Patient Appointments" : "My Appointments"}
            </h1>
            <p className="appointments-subtitle">Unable to load appointments</p>
          </header>
          <div className="empty-state">
            <AlertTriangle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">{error}</p>
            <p className="empty-text">Please check your connection or try again later.</p>
            <button onClick={() => window.location.reload()} className="empty-action-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-page">
      <div className="appointments-container">
        <header className="appointments-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="appointments-title">
              <Calendar className="title-icon" />
              {isDoctor ? "Patient Appointments" : "My Appointments"}
            </h1>
            <p className="appointments-subtitle">
              {isDoctor
                ? `Managing ${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`
                : `You have ${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {isPatient && (
            <button onClick={() => setShowBookingModal(true)} className="add-member-btn" style={{ marginTop: 0 }}>
              <Plus className="btn-icon" />
              Book Appointment
            </button>
          )}
        </header>

        <div className="appointments-filters">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            All ({appointments.length})
          </button>
          <button className={`filter-btn ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>
            Upcoming ({appointments.filter((a) => isUpcomingStatus(a.status)).length})
          </button>
          <button className={`filter-btn ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
            Completed ({appointments.filter((a) => String(a.status || "").toLowerCase() === "completed").length})
          </button>
          <button className={`filter-btn ${filter === "cancelled" ? "active" : ""}`} onClick={() => setFilter("cancelled")}>
            Cancelled ({appointments.filter((a) => String(a.status || "").toLowerCase() === "cancelled").length})
          </button>
        </div>

        <div className="appointments-list">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-icon" />
              <p className="empty-title">{filter === "all" ? "No Appointments Yet" : `No ${filter} appointments`}</p>
              <p className="empty-text">
                {filter === "all"
                  ? isDoctor
                    ? "You don't have any appointments scheduled with your patients yet."
                    : "You haven't booked any appointments yet."
                  : "Try changing the filter to see other appointments."}
              </p>
              {isPatient && filter === "all" && (
                <button onClick={() => setShowBookingModal(true)} className="empty-action-btn">
                  <Plus className="empty-action-icon" />
                  Book Your First Appointment
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const normalizedStatus = String(appointment.status || "pending").toLowerCase();
              const clinicMeta = clinicsData.find((c) => String(c.db_id) === String(appointment.clinic_id));
              return (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-header-content">
                    <h2 className="appointment-clinic">{clinicMeta?.name || appointment.clinic_name || "Clinic Appointment"}</h2>
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
                                : "#d1d5db"
                      }}
                    >
                      {statusLabel(normalizedStatus)}
                    </span>
                  </div>
                  {isUpcomingStatus(normalizedStatus) && (
                    <button onClick={() => handleCancelAppointment(appointment.id)} className="cancel-btn" title="Cancel appointment">
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
                      <span className="info-text">{appointmentTimeLabel(appointment)}</span>
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
                      <p className="detail-text"><strong>Reason:</strong> {appointment.reason}</p>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="appointment-detail-box">
                      <p className="detail-text"><strong>Notes:</strong> {appointment.notes}</p>
                    </div>
                  )}

                  {isDoctor && isUpcomingStatus(normalizedStatus) && (
                    <div className="appointment-actions">
                      <button onClick={() => handleCompleteAppointment(appointment.id)} className="complete-btn">
                        <CheckCircle className="complete-icon" />
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {showBookingModal && isPatient && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Book an Appointment</h2>
              <button onClick={() => setShowBookingModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleBookAppointment} className="modal-body">
              <div className="form-content">
                <div className="form-field">
                  <label htmlFor="clinic_select" className="form-label">
                    <MapPin className="form-label-icon" />
                    Select Clinic *
                  </label>
                  <select id="clinic_select" value={bookingForm.clinic_id} onChange={handleClinicSelect} className="form-input" required>
                    <option value="">-- Choose a clinic --</option>
                    {clinicsData.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name} - {clinic.location} ({clinic.specialty})
                      </option>
                    ))}
                  </select>
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
                      Available Today
                    </label>
                    <div className="time-slots-grid">
                      {selectedClinic.available_slots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`time-slot-btn ${bookingForm.appointment_time === slot ? "selected" : ""}`}
                          onClick={() => {
                            setBookingForm((prev) => ({
                              ...prev,
                              appointment_time: slot,
                              appointment_date: new Date().toISOString().split("T")[0]
                            }));
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
                      Date *
                    </label>
                    <input
                      id="appointment_date"
                      type="date"
                      min={getMinDate()}
                      value={bookingForm.appointment_date}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, appointment_date: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="appointment_time" className="form-label">
                      <Clock className="form-label-icon" />
                      Time *
                    </label>
                    <input
                      id="appointment_time"
                      type="time"
                      value={bookingForm.appointment_time}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, appointment_time: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reason" className="form-label">
                    <User className="form-label-icon" />
                    Reason for Visit
                  </label>
                  <input
                    id="reason"
                    type="text"
                    value={bookingForm.reason}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="form-input"
                    placeholder="e.g., Annual checkup, Follow-up"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="notes" className="form-label">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="form-input form-textarea"
                    placeholder="Any additional information..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedClinic(null);
                    setBookingForm({
                      clinic_id: "",
                      clinic_name: "",
                      appointment_date: "",
                      appointment_time: "",
                      location: "",
                      reason: "",
                      notes: "",
                      phone: "",
                      address: ""
                    });
                  }}
                  className="cancel-btn"
                  style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem" }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <Calendar className="btn-icon" style={{ width: "1rem", height: "1rem" }} />
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
