import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppLoadingScreen from "./AppLoadingScreen";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading, authError } = useAuth();

  // Wait for session restore on hard refresh before deciding redirects.
  if (loading) {
    return <AppLoadingScreen />;
  }

  if (authError) {
    return (
      <AppLoadingScreen
        title="Session Check"
        message={`${authError} Refresh the page once, or log in again if it continues.`}
      />
    );
  }

  // If the user is not logged in, send them to /login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected page
  return children;
}
