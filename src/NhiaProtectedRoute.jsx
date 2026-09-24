import React from 'react';
import { Navigate } from 'react-router-dom';

export default function NhiaProtectedRoute({ children }) {
  // Read unique, explicitly prefixed NHIA namespace variables
  const nhiaAuth = localStorage.getItem("nhia_isAuthenticated") === "true";
  const nhiaName = localStorage.getItem("nhia_hospname");
  const nhiaCode = localStorage.getItem("nhia_hcpCode");

  // If any core credential validation fails, wipe the NHIA token slot and drop back to login
  if (!nhiaAuth || !nhiaName || !nhiaCode) {
    localStorage.removeItem("nhia_isAuthenticated");
    localStorage.removeItem("nhia_hospname");
    localStorage.removeItem("nhia_hcpCode");
    return <Navigate to="/nhia-login" replace />;
  }

  // Otherwise, safely grant entrance to the child component view context
  return children;
}
