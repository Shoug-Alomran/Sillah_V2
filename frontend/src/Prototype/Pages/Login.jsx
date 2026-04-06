import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageToggle from "../../Components/LanguageToggle";
import OnboardingPrompt from "../../Components/OnboardingPrompt";
import Tooltip from "../../Components/Tooltip";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  function validate(nextEmail = email, nextPassword = password) {
    const errors = {};
    const trimmedEmail = nextEmail.trim();

    if (!trimmedEmail) errors.email = t("login.validationEmailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = t("login.validationEmailInvalid");
    }

    if (!nextPassword) errors.password = t("login.validationPasswordRequired");
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const nextErrors = validate(cleanEmail, password);

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(t("login.errorMissing"));
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(cleanEmail, password);
      navigate("/dashboard");
    } catch (err) {
      const msg = String(err?.message || "");

      if (msg.toLowerCase().includes("email not confirmed")) {
        setError(t("login.errorEmailNotConfirmed"));
      } else if (msg.toLowerCase().includes("invalid login credentials")) {
        setError(t("login.errorInvalidCredentials"));
      } else {
        setError(msg || t("login.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container auth-container--login">
        <div className="auth-card">
          <div className="auth-toolbar">
            <LanguageToggle />
          </div>

          <div className="auth-header">
            <div className="brand-icon-large">
              <Heart className="brand-heart-large" />
            </div>
            <h1 className="auth-title">{t("login.title")}</h1>
            <p className="auth-subtitle">{t("login.subtitle")}</p>
          </div>

          <OnboardingPrompt
            storageKey="sillah-login-onboarding"
            title={t("login.onboardingTitle")}
            body={t("login.onboardingBody")}
            actionLabel={t("login.onboardingAction")}
            onAction={() => navigate("/signup")}
          />

          {error && (
            <div className="auth-error" role="alert" aria-live="polite">
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                <Mail className="form-label-icon" />
                {t("login.email")}
                <Tooltip content={t("login.emailHelp")} iconOnly>
                  <span className="label-help">?</span>
                </Tooltip>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setEmail(nextValue);
                  setFieldErrors(validate(nextValue, password));
                }}
                className={`form-input ${fieldErrors.email ? "form-input--error" : ""}`}
                placeholder={t("login.emailPlaceholder")}
                required
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />
              {fieldErrors.email && <p className="inline-field-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                <Lock className="form-label-icon" />
                {t("login.password")}
                <Tooltip content={t("login.passwordHelp")} iconOnly>
                  <span className="label-help">?</span>
                </Tooltip>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setPassword(nextValue);
                  setFieldErrors(validate(email, nextValue));
                }}
                className={`form-input ${fieldErrors.password ? "form-input--error" : ""}`}
                placeholder={t("login.passwordPlaceholder")}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              {fieldErrors.password && <p className="inline-field-error">{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t("login.noAccount")}{" "}
              <Link to="/signup" className="auth-link">
                {t("login.signup")}
              </Link>
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              {t("login.phase5Label")}{" "}
              <Link to="/phase5-demo" className="auth-link">
                {t("login.phase5")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
