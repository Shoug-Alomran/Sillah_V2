import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import Layout from "./Components/Layout.jsx";

import Login from "./Prototype/Pages/Login.jsx";
import Signup from "./Prototype/Pages/Signup.jsx";
import Dashboard from "./Prototype/Pages/Dashboard.jsx";
import MyHealth from "./Prototype/Pages/MyHealth.jsx";
import Alerts from "./Prototype/Pages/Alerts.jsx";
import Medications from "./Prototype/Pages/Medications.jsx";
import Appointments from "./Prototype/Pages/Appointments.jsx";
import Clinics from "./Prototype/Pages/Clinics.jsx";
import AwarenessHub from "./Prototype/Pages/AwarenessHub.jsx";
import FamilyTree from "./Prototype/Pages/FamilyTree.jsx";
import RiskAssessment from "./Prototype/Pages/RiskAssessment.jsx";
import Patients from "./Prototype/Pages/Patients.jsx";
import PatientDetail from "./Prototype/Pages/PatientDetail.jsx";

import Phase5Demo from "./Prototype/Pages/Phase5Demo.jsx";

function Shell({ pageName, children }) {
  return <Layout currentPageName={pageName}>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

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
      <Route path="/my-health" element={<ProtectedRoute><Shell pageName="MyHealth"><MyHealth /></Shell></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Shell pageName="Alerts"><Alerts /></Shell></ProtectedRoute>} />
      <Route path="/medications" element={<ProtectedRoute><Shell pageName="Medications"><Medications /></Shell></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><Shell pageName="Appointments"><Appointments /></Shell></ProtectedRoute>} />
      <Route path="/clinics" element={<ProtectedRoute><Shell pageName="Clinics"><Clinics /></Shell></ProtectedRoute>} />
      <Route path="/awareness-hub" element={<ProtectedRoute><Shell pageName="AwarenessHub"><AwarenessHub /></Shell></ProtectedRoute>} />
      <Route path="/family-tree" element={<ProtectedRoute><Shell pageName="FamilyTree"><FamilyTree /></Shell></ProtectedRoute>} />
      <Route path="/risk-assessment" element={<ProtectedRoute><Shell pageName="RiskAssessment"><RiskAssessment /></Shell></ProtectedRoute>} />

      {/* Doctor */}
      <Route path="/patients" element={<ProtectedRoute><Shell pageName="Patients"><Patients /></Shell></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute><Shell pageName="PatientDetail"><PatientDetail /></Shell></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}