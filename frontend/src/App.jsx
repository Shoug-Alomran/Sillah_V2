import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import Layout from "./Components/Layout.jsx";
import AppLoadingScreen from "./Components/AppLoadingScreen.jsx";
import { useAuth } from "./contexts/AuthContext";

import Login from "./Prototype/Pages/Login.jsx";
import Signup from "./Prototype/Pages/Signup.jsx";
import AdminClaim from "./Prototype/Pages/AdminClaim.jsx";
const Dashboard = lazy(() => import("./Prototype/Pages/Dashboard.jsx"));
const MyHealth = lazy(() => import("./Prototype/Pages/MyHealth.jsx"));
const Alerts = lazy(() => import("./Prototype/Pages/Alerts.jsx"));
const Medications = lazy(() => import("./Prototype/Pages/Medications.jsx"));
const Appointments = lazy(() => import("./Prototype/Pages/Appointments.jsx"));
const Clinics = lazy(() => import("./Prototype/Pages/Clinics.jsx"));
const AwarenessHub = lazy(() => import("./Prototype/Pages/AwarenessHub.jsx"));
const FamilyTree = lazy(() => import("./Prototype/Pages/FamilyTree.jsx"));
const RiskAssessment = lazy(() => import("./Prototype/Pages/RiskAssessment.jsx"));
const Patients = lazy(() => import("./Prototype/Pages/Patients.jsx"));
const PatientDetail = lazy(() => import("./Prototype/Pages/PatientDetail.jsx"));
const DoctorProfile = lazy(() => import("./Prototype/Pages/DoctorProfile.jsx"));
const AdminDoctorVerification = lazy(() => import("./Prototype/Pages/AdminDoctorVerification.jsx"));
const AdminOperations = lazy(() => import("./Prototype/Pages/AdminOperations.jsx"));
const Phase5Demo = lazy(() => import("./Prototype/Pages/Phase5Demo.jsx"));
const HelpCenterPage = lazy(() =>
  import("./Prototype/Pages/SupportPages.jsx").then((module) => ({ default: module.HelpCenterPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import("./Prototype/Pages/SupportPages.jsx").then((module) => ({ default: module.PrivacyPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import("./Prototype/Pages/SupportPages.jsx").then((module) => ({ default: module.TermsOfServicePage }))
);
const ContactUsPage = lazy(() =>
  import("./Prototype/Pages/SupportPages.jsx").then((module) => ({ default: module.ContactUsPage }))
);

function Shell({ pageName, children }) {
  return <Layout currentPageName={pageName}>{children}</Layout>;
}

function RouteFallback() {
  return <AppLoadingScreen message="Loading this page..." />;
}

function RoleRoute({ allow, children }) {
  const { loading, profile, profileError, isAdmin, isDoctor, isPatient } = useAuth();

  if (loading) return <AppLoadingScreen />;

  if (!profile?.role) {
    return (
      <AppLoadingScreen
        title="Profile Check"
        message={profileError || "Your account profile is still loading. Please refresh once if this continues."}
      />
    );
  }

  if (Array.isArray(allow) && !allow.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allow === "doctor" && !isDoctor) return <Navigate to="/dashboard" replace />;
  if (allow === "patient" && !isPatient) return <Navigate to="/dashboard" replace />;
  if (allow === "admin" && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/claim-admin"
            element={
              <ProtectedRoute>
                <AdminClaim />
              </ProtectedRoute>
            }
          />

          {/* Phase 5 demo (your choice: public or protected) */}
          <Route path="/phase5-demo" element={<Phase5Demo />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Shell pageName="Dashboard"><Dashboard /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-health"
            element={
              <ProtectedRoute>
                <RoleRoute allow="patient">
                  <Shell pageName="MyHealth"><MyHealth /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <RoleRoute allow="patient">
                  <Shell pageName="Alerts"><Alerts /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications"
            element={
              <ProtectedRoute>
                <RoleRoute allow={["patient", "doctor"]}>
                  <Shell pageName="Medications"><Medications /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <RoleRoute allow={["patient", "doctor"]}>
                  <Shell pageName="Appointments"><Appointments /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/clinics" element={<ProtectedRoute><Shell pageName="Clinics"><Clinics /></Shell></ProtectedRoute>} />
          <Route path="/awareness-hub" element={<ProtectedRoute><Shell pageName="AwarenessHub"><AwarenessHub /></Shell></ProtectedRoute>} />
          <Route
            path="/help-center"
            element={
              <ProtectedRoute>
                <Shell pageName="HelpCenter"><HelpCenterPage /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <ProtectedRoute>
                <Shell pageName="PrivacyPolicy"><PrivacyPolicyPage /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <ProtectedRoute>
                <Shell pageName="TermsOfService"><TermsOfServicePage /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact-us"
            element={
              <ProtectedRoute>
                <Shell pageName="ContactUs"><ContactUsPage /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/family-tree"
            element={
              <ProtectedRoute>
                <RoleRoute allow="patient">
                  <Shell pageName="FamilyTree"><FamilyTree /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk-assessment"
            element={
              <ProtectedRoute>
                <RoleRoute allow="patient">
                  <Shell pageName="RiskAssessment"><RiskAssessment /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Doctor */}
          <Route
            path="/doctor-profile"
            element={
              <ProtectedRoute>
                <RoleRoute allow="doctor">
                  <Shell pageName="DoctorProfile"><DoctorProfile /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <RoleRoute allow="doctor">
                  <Shell pageName="Patients"><Patients /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/operations"
            element={
              <ProtectedRoute>
                <RoleRoute allow="admin">
                  <Shell pageName="AdminOperations"><AdminOperations /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctor-verification"
            element={
              <ProtectedRoute>
                <RoleRoute allow="admin">
                  <Shell pageName="AdminDoctorVerification"><AdminDoctorVerification /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allow="doctor">
                  <Shell pageName="PatientDetail"><PatientDetail /></Shell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
