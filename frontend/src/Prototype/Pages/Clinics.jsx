// frontend/src/Prototype/Pages/Clinics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Star, Phone, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { clinicsData } from "../../data/clinics";
import AppLoadingScreen from "../../Components/AppLoadingScreen";

export default function Clinics() {
  const navigate = useNavigate();
  const { isDoctor, isPatient, loading: authLoading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [managedClinics, setManagedClinics] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchManagedClinics() {
      try {
        const { data, error } = await supabase
          .from("clinics")
          .select("id, name, location, contact_number, created_at")
          .order("created_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        if (!cancelled) {
          setManagedClinics(
            (data || []).map((clinic) => ({
              ...clinic,
              specialty: "General Practice",
              address: clinic.location,
              phone: clinic.contact_number,
              certified: true,
              rating: 4.8,
              reviews: 0,
              hours: "Contact clinic",
              available_slots: [],
            }))
          );
        }
      } catch (error) {
        console.warn("Using fallback clinic content:", error?.message);
        if (!cancelled) setManagedClinics([]);
      }
    }

    fetchManagedClinics();
    return () => {
      cancelled = true;
    };
  }, []);

  const clinics = managedClinics.length > 0 ? managedClinics : Array.isArray(clinicsData) ? clinicsData : [];

  const specialties = useMemo(() => {
    const set = new Set();
    for (const c of clinics) {
      if (c?.specialty) set.add(String(c.specialty));
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [clinics]);

  const locations = useMemo(() => {
    const set = new Set();
    for (const c of clinics) {
      if (c?.location) set.add(String(c.location));
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return clinics.filter((clinic) => {
      const name = String(clinic?.name || "").toLowerCase();
      const address = String(clinic?.address || "").toLowerCase();
      const location = String(clinic?.location || "");
      const specialty = String(clinic?.specialty || "");

      const matchesSearch =
        term === "" || name.includes(term) || address.includes(term);

      const matchesSpecialty =
        specialtyFilter === "all" || specialty === specialtyFilter;

      const matchesLocation =
        locationFilter === "all" || location === locationFilter;

      return matchesSearch && matchesSpecialty && matchesLocation;
    });
  }, [clinics, searchTerm, specialtyFilter, locationFilter]);

  const handleBookAppointment = (clinic) => {
    if (isDoctor) {
      alert("Doctors cannot book appointments. This feature is for patients only.");
      return;
    }
    navigate("/appointments", {
      state: {
        clinic,
        isBooking: true,
      },
    });
  };

  if (authLoading) {
    return <AppLoadingScreen title="Clinics" message="Preparing clinic list..." />;
  }

  return (
    <div className="clinics-page">
      <div className="clinics-container">
        <header className="clinics-header">
          <h1 className="clinics-title">
            <MapPin className="title-icon" />
            Nearby Certified Clinics
          </h1>
          <p className="clinics-subtitle">
            {isDoctor ? "View clinic information and details" : "Book preventive screening appointments"}
          </p>
        </header>

        {isDoctor && (
          <div className="privacy-notice" style={{ marginBottom: "1rem" }}>
            <MapPin className="privacy-icon" style={{ color: "#14b8a6" }} />
            <div className="privacy-content">
              <p className="privacy-title">Information Only</p>
              <p className="privacy-text">
                As a healthcare provider, you can view clinic information but cannot book appointments through this system.
              </p>
            </div>
          </div>
        )}

        <div className="search-filter-card">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search clinics by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Specialties</option>
                {specialties.slice(1).map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Locations</option>
                {locations.slice(1).map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredClinics.length === 0 ? (
          <div className="empty-state">
            <MapPin className="empty-icon" />
            <p className="empty-title">No clinics found</p>
            <p className="empty-text">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="clinics-grid">
            {filteredClinics.map((clinic) => (
              <div key={clinic.id || `${clinic.name}-${clinic.address}`} className="clinic-card-component">
                <div className="clinic-card-header-component">
                  <div className="clinic-header-content">
                    <div>
                      <h3 className="clinic-name-component">{clinic.name}</h3>
                      <span className="clinic-specialty-badge-component">
                        {clinic.specialty}
                      </span>
                    </div>
                    {clinic.certified && (
                      <div className="clinic-certified-icon">
                        <CheckCircle className="certified-check" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="clinic-card-body-component">
                  <div className="clinic-info-row">
                    <MapPin className="clinic-info-icon" />
                    <div>
                      <p className="clinic-location-name">{clinic.location}</p>
                      <p className="clinic-address">{clinic.address}</p>
                    </div>
                  </div>

                  <div className="clinic-info-row">
                    <Phone className="clinic-info-icon" />
                    <p className="clinic-phone-text">{clinic.phone}</p>
                  </div>

                  <div className="clinic-info-row">
                    <Clock className="clinic-info-icon" />
                    <p className="clinic-phone-text">{clinic.hours}</p>
                  </div>

                  <div className="clinic-rating-row">
                    <Star className="clinic-star-icon" />
                    <span className="clinic-rating-value">{clinic.rating}</span>
                    <span className="clinic-rating-max">
                      / 5 ({clinic.reviews} reviews)
                    </span>
                  </div>

                  {Array.isArray(clinic.available_slots) && clinic.available_slots.length > 0 && (
                    <div className="clinic-slots-section">
                      <p className="slots-label">Available Today:</p>
                      <div className="slots-badges">
                        {clinic.available_slots.map((slot, index) => (
                          <span key={`${clinic.id || clinic.name}-slot-${index}`} className="slot-badge">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="clinic-card-footer-component">
                  {isPatient ? (
                    <button className="clinic-book-btn" onClick={() => handleBookAppointment(clinic)}>
                      Book Appointment
                    </button>
                  ) : (
                    <button
                      className="clinic-book-btn"
                      style={{ background: "#d1d5db", cursor: "not-allowed", opacity: 0.6 }}
                      disabled
                    >
                      View Only
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
