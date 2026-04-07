import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  LayoutDashboard,
  Calendar,
  Bell,
  MapPin,
  BookOpen,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
  Pill,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import Tooltip from "./Tooltip";
import sillahLogo from "../assets/sillah-logo.png";

export default function Layout({ children, currentPageName }) {
  const { logout, isDoctor, isPatient } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navLinks = useMemo(() => {
    const base = [
      { to: "/dashboard", key: "Dashboard", icon: LayoutDashboard, label: t("layout.dashboard") },
    ];

    if (isPatient) {
      return [
        ...base,
        { to: "/my-health", key: "MyHealth", icon: Heart, label: t("layout.myHealth") },
        { to: "/alerts", key: "Alerts", icon: Bell, label: t("layout.alerts") },
        { to: "/medications", key: "Medications", icon: Pill, label: t("layout.medications") },
        { to: "/appointments", key: "Appointments", icon: Calendar, label: t("layout.appointments") },
        { to: "/clinics", key: "Clinics", icon: MapPin, label: t("layout.clinics") },
        { to: "/awareness-hub", key: "AwarenessHub", icon: BookOpen, label: t("layout.awarenessHub") },
        { to: "/family-tree", key: "FamilyTree", icon: Users, label: t("layout.familyTree") },
        { to: "/risk-assessment", key: "RiskAssessment", icon: Activity, label: t("layout.riskAssessment") },
      ];
    }

    if (isDoctor) {
      return [
        ...base,
        { to: "/patients", key: "Patients", icon: Users, label: t("layout.patients") },
        { to: "/medications", key: "Medications", icon: Pill, label: t("layout.medications") },
        { to: "/appointments", key: "Appointments", icon: Calendar, label: t("layout.appointments") },
        { to: "/clinics", key: "Clinics", icon: MapPin, label: t("layout.clinics") },
        { to: "/awareness-hub", key: "AwarenessHub", icon: BookOpen, label: t("layout.awarenessHub") },
      ];
    }

    return base;
  }, [isDoctor, isPatient, t]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      setLoggingOut(false);
      alert(error?.message || "Failed to logout");
    }
  };

  const renderLink = (item, mobile = false) => {
    const Icon = item.icon;

    return (
      <Tooltip key={`${mobile ? "mobile" : "desktop"}-${item.key}`} content={item.label}>
        <Link
          to={item.to}
          className={`nav-link ${mobile ? "nav-link--mobile" : ""} ${
            currentPageName === item.key ? "nav-link--active" : ""
          }`}
          onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
        >
          <Icon className="nav-link-icon" />
          {item.label}
        </Link>
      </Tooltip>
    );
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link to="/dashboard" className="brand">
            <div className="brand-icon">
              <img className="brand-logo" src={sillahLogo} alt="Sillah logo" />
            </div>
            <div className="brand-text">
              <div className="brand-title">{t("common.appName")}</div>
              <div className="brand-subtitle">{t("common.appSubtitle")}</div>
            </div>
          </Link>

          <div className="nav-links nav-links--desktop">
            {navLinks.map((item) => renderLink(item))}
            <LanguageToggle />
            <button
              className="nav-link nav-link--logout"
              onClick={handleLogout}
              disabled={loggingOut}
              type="button"
            >
              <LogOut className="nav-link-icon" />
              {loggingOut ? "Logging out..." : t("layout.logout")}
            </button>
          </div>

          <div className="top-nav-actions">
            <LanguageToggle />
            <Tooltip content={t("layout.menu")}>
              <button
                className="menu-toggle"
                onClick={() => setMobileMenuOpen((value) => !value)}
                aria-label={t("layout.menu")}
              >
                {mobileMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
              </button>
            </Tooltip>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="nav-links nav-links--mobile">
            {navLinks.map((item) => renderLink(item, true))}
            <button
              className="nav-link nav-link--mobile nav-link--logout"
              onClick={handleLogout}
              disabled={loggingOut}
              type="button"
            >
              <LogOut className="nav-link-icon" />
              {loggingOut ? "Logging out..." : t("layout.logout")}
            </button>
          </div>
        )}
      </nav>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="footer-col">
            <h3 className="footer-title">
              <img className="footer-logo" src={sillahLogo} alt="Sillah logo" />
              {t("common.appName")}
            </h3>
            <p className="footer-text">
              Empowering families with hereditary health insights and preventive
              care solutions.
            </p>
            <p className="footer-note">
              {isDoctor ? "Healthcare Provider Portal" : "Patient Portal"}
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-subtitle">Quick Links</h4>
            <div className="footer-links">
              {navLinks.slice(0, 4).map((item) => (
                <Link key={item.key} to={item.to} className="footer-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-subtitle">Support</h4>
            <div className="footer-links">
              <Link to="/help-center" className="footer-link">{t("layout.helpCenter")}</Link>
              <Link to="/privacy-policy" className="footer-link">{t("layout.privacyPolicy")}</Link>
              <Link to="/terms-of-service" className="footer-link">{t("layout.termsOfService")}</Link>
              <Link to="/contact-us" className="footer-link">{t("layout.contactUs")}</Link>
            </div>
          </div>
        </div>

        <div className="app-footer-bottom">
          <p>&copy; 2026 Sillah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
