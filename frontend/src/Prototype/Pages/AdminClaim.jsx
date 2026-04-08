import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Shield } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageToggle from "../../Components/LanguageToggle";
import sillahLogo from "../../assets/sillah-logo.png";

export default function AdminClaim() {
  const { t } = useLanguage();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error(t("admin.sessionExpired"));

      const response = await fetch("/api/admin/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inviteCode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || t("admin.requestFailed"));

      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (claimError) {
      setError(claimError?.message || t("admin.requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-toolbar">
            <LanguageToggle />
          </div>

          <div className="auth-header">
            <div className="brand-icon-large">
              <img className="brand-logo-large" src={sillahLogo} alt="Sillah logo" />
            </div>
            <h1 className="auth-title">{t("admin.claimTitle")}</h1>
            <p className="auth-subtitle">{t("admin.claimSubtitle")}</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="admin-signup-panel">
              <div className="admin-signup-note">
                <Shield className="form-label-icon" />
                <p>
                  {t("admin.claimBody")}
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="admin-claim-code" className="form-label">
                  <Shield className="form-label-icon" />
                  {t("signup.adminInviteCode")}
                </label>
                <input
                  id="admin-claim-code"
                  className="form-input"
                  type="password"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder={t("signup.adminInvitePlaceholder")}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? t("admin.activating") : t("admin.activate")}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t("admin.loginFirst")}{" "}
              <Link to="/login" className="auth-link">
                {t("admin.goToLogin")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
