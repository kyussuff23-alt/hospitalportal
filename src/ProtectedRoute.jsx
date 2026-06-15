import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ isAuthenticated, children }) {
  // Check localStorage as a fallback
  const storedAuth = localStorage.getItem("isAuthenticated");
  const expiryTime = localStorage.getItem("expiryTime");

  const stillValid =
    storedAuth === "true" &&
    expiryTime &&
    Date.now() < parseInt(expiryTime);

  if (!isAuthenticated && !stillValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
