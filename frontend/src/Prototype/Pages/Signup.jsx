import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Mail,
  Lock,
  User,
  AlertCircle,
  Phone,
  Stethoscope,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageToggle from "../../Components/LanguageToggle";
import OnboardingPrompt from "../../Components/OnboardingPrompt";
import Tooltip from "../../Components/Tooltip";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userType, setUserType] = useState("patient");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { signup } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  function normalizePhone(input) {
    const value = String(input || "").trim();
    if (!value) return "";
    return value.replace(/[^\d+]/g, "");
  }

  function validate(overrides = {}) {
    const values = {
      email,
      password,
      confirmPassword,
      fullName,
      phoneNumber,
      selectedDoctor,
      ...overrides,
    };

    const errors = {};
    const trimmedEmail = values.email.trim();
    const trimmedName = values.fullName.trim();
    const cleanPhone = normalizePhone(values.phoneNumber);

    if (!trimmedName) errors.fullName = t("signup.validationNameRequired");
    if (!trimmedEmail) errors.email = t("signup.validationEmailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = t("signup.validationEmailInvalid");
    }

    if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 8) {
      errors.phoneNumber = t("signup.validationPhoneInvalid");
    }

    if (!values.password) errors.password = t("signup.validationPasswordRequired");
    else if (values.password.length < 6) errors.password = t("signup.validationPasswordLength");

    if (!values.confirmPassword) errors.confirmPassword = t("signup.validationConfirmRequired");
    else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = t("signup.validationPasswordMismatch");
    }

    if (userType === "patient" && doctors.length > 0 && !values.selectedDoctor) {
      errors.selectedDoctor = t("signup.validationDoctorRequired");
    }

    return errors;
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchDoctors() {
      if (userType !== "patient") {
        setDoctors([]);
        setSelectedDoctor("");
        return;
      }

      try {
        setLoadingDoctors(true);
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "doctor")
          .order("full_name", { ascending: true });

        if (fetchError) throw fetchError;
        if (!cancelled) setDoctors(data || []);
      } catch (fetchErr) {
        console.error("Error fetching doctors:", fetchErr);
        if (!cancelled) setDoctors([]);
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    fetchDoctors();
    return () => {
      cancelled = true;
    };
  }, [userType]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0]);
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const cleanPhone = normalizePhone(phoneNumber);

    try {
      setLoading(true);

      const { session } = await signup({
        email: trimmedEmail,
        password,
        fullName: trimmedName,
        phoneNumber: cleanPhone,
        role: userType,
        selected_doctor_id: userType === "patient" ? selectedDoctor || null : null,
      });

      if (!session) {
        setInfo(t("signup.infoCreated"));
        navigate("/login");
        return;
      }

      navigate("/dashboard");
    } catch (signupError) {
      const msg = signupError?.message || t("signup.errorGeneric");
      if (String(msg).toLowerCase().includes("already registered")) {
        setError(t("signup.errorRegistered"));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const mustChooseDoctor = userType === "patient" && doctors.length > 0;

  return (
    <div className="auth-page">
      <div className="auth-container auth-container--signup">
        <div className="auth-card">
          <div className="auth-toolbar">
            <LanguageToggle />
          </div>

          <div className="auth-header">
            <div className="brand-icon-large">
              <Heart className="brand-heart-large" />
            </div>
            <h1 className="auth-title">{t("signup.title")}</h1>
            <p className="auth-subtitle">{t("signup.subtitle")}</p>
          </div>

          <OnboardingPrompt
            storageKey="sillah-signup-onboarding"
            title={t("signup.onboardingTitle")}
            body={t("signup.onboardingBody")}
            actionLabel={t("signup.onboardingAction")}
            onAction={() => navigate("/login")}
          />

          {error && (
            <div className="auth-error">
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="auth-info" style={{ marginBottom: 12 }}>
              <AlertCircle className="error-icon" />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label className="form-label">
                <Users className="form-label-icon" />
                {t("signup.role")}
              </label>
              <div className="user-type-selector">
                <button
                  type="button"
                  className={`user-type-btn ${userType === "patient" ? "active" : ""}`}
                  onClick={() => setUserType("patient")}
                  disabled={loading}
                >
                  <Users className="user-type-icon" />
                  <span>{t("signup.patient")}</span>
                </button>
                <button
                  type="button"
                  className={`user-type-btn ${userType === "doctor" ? "active" : ""}`}
                  onClick={() => setUserType("doctor")}
                  disabled={loading}
                >
                  <Stethoscope className="user-type-icon" />
                  <span>{t("signup.doctor")}</span>
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="fullName" className="form-label">
                <User className="form-label-icon" />
                {t("signup.fullName")}
                <Tooltip content={t("signup.fullNameHelp")} iconOnly>
                  <span className="label-help">?</span>
                </Tooltip>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setFullName(nextValue);
                  setFieldErrors(validate({ fullName: nextValue }));
                }}
                className={`form-input ${fieldErrors.fullName ? "form-input--error" : ""}`}
                placeholder={t("signup.fullNamePlaceholder")}
                required
                disabled={loading}
                autoComplete="name"
              />
              {fieldErrors.fullName && <p className="inline-field-error">{fieldErrors.fullName}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="email" className="form-label">
                <Mail className="form-label-icon" />
                {t("signup.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setEmail(nextValue);
                  setFieldErrors(validate({ email: nextValue }));
                }}
                className={`form-input ${fieldErrors.email ? "form-input--error" : ""}`}
                placeholder={t("signup.emailPlaceholder")}
                required
                disabled={loading}
                autoComplete="email"
              />
              {fieldErrors.email && <p className="inline-field-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="phoneNumber" className="form-label">
                <Phone className="form-label-icon" />
                {t("signup.phone")}
                <Tooltip content={t("signup.phoneHelp")} iconOnly>
                  <span className="label-help">?</span>
                </Tooltip>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setPhoneNumber(nextValue);
                  setFieldErrors(validate({ phoneNumber: nextValue }));
                }}
                className={`form-input ${fieldErrors.phoneNumber ? "form-input--error" : ""}`}
                placeholder={t("signup.phonePlaceholder")}
                disabled={loading}
                autoComplete="tel"
              />
              {fieldErrors.phoneNumber && <p className="inline-field-error">{fieldErrors.phoneNumber}</p>}
            </div>

            {userType === "patient" && (
              <div className="form-field">
                <label htmlFor="doctor" className="form-label">
                  <Stethoscope className="form-label-icon" />
                  {t("signup.doctorSelect")}
                  <Tooltip content={t("signup.doctorHelp")} iconOnly>
                    <span className="label-help">?</span>
                  </Tooltip>
                </label>

                {loadingDoctors ? (
                  <p className="form-input" style={{ color: "#6b7280" }}>
                    {t("signup.loadingDoctors")}
                  </p>
                ) : doctors.length === 0 ? (
                  <div className="doctor-notice">
                    <AlertCircle className="form-label-icon" style={{ color: "#f59e0b" }} />
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                      {t("signup.noDoctors")}
                    </p>
                  </div>
                ) : (
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSelectedDoctor(nextValue);
                      setFieldErrors(validate({ selectedDoctor: nextValue }));
                    }}
                    className={`form-input ${fieldErrors.selectedDoctor ? "form-input--error" : ""}`}
                    disabled={loading}
                    required={mustChooseDoctor}
                  >
                    <option value="">{t("signup.doctorSelectPlaceholder")}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {(doctor.full_name && doctor.full_name.trim()) || "Doctor"} - {doctor.email}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.selectedDoctor && (
                  <p className="inline-field-error">{fieldErrors.selectedDoctor}</p>
                )}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                <Lock className="form-label-icon" />
                {t("signup.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setPassword(nextValue);
                  setFieldErrors(validate({ password: nextValue }));
                }}
                className={`form-input ${fieldErrors.password ? "form-input--error" : ""}`}
                placeholder={t("signup.passwordPlaceholder")}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {fieldErrors.password && <p className="inline-field-error">{fieldErrors.password}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-label">
                <Lock className="form-label-icon" />
                {t("signup.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setConfirmPassword(nextValue);
                  setFieldErrors(validate({ confirmPassword: nextValue }));
                }}
                className={`form-input ${fieldErrors.confirmPassword ? "form-input--error" : ""}`}
                placeholder={t("signup.confirmPasswordPlaceholder")}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && (
                <p className="inline-field-error">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (mustChooseDoctor && !selectedDoctor)}
              className="auth-submit-btn"
            >
              {loading ? t("signup.submitting") : t("signup.submit")}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t("signup.haveAccount")}{" "}
              <Link to="/login" className="auth-link">
                {t("signup.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
