import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Wait for session restore on hard refresh before deciding redirects.
  if (loading) {
    return null;
  }

  // If the user is not logged in, send them to /login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected page
  return children;
}
