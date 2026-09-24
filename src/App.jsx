import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Claims from "./Claims";
import Authorization from "./Authorization";
import ProtectedRoute from "./ProtectedRoute";
import Payment from "./Payment";
import Attachment from "./Attachment";
import RequestCode from "./RequestCode";
import NhiaLogin from "./NhiaLogin";
import NhiaDashboard from "./nhia-dashboard";
// ✅ Step 1: Import your new NHIA protection guard
import NhiaProtectedRoute from "./NhiaProtectedRoute";
import NhiaClaimsHub from "./NhiaClaimsHub";
import NhiaPayments from "./NhiaPayments";
import NhiaAuthorizations from "./NhiaAuthorizations";
import NhiaReconciliation from "./NhiaReconciliation";






export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hcpCode, setHcpCode] = useState("");
  const [hospitalName, setHospitalName] = useState("");

  // ✅ Restore session from localStorage on app load
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const expiryTime = localStorage.getItem("expiryTime");

    if (storedAuth === "true" && expiryTime && Date.now() < parseInt(expiryTime)) {
      setIsAuthenticated(true);
      setHcpCode(localStorage.getItem("hcpCode") || "");
      setHospitalName(localStorage.getItem("hospitalName") || "");
    } else {
      // ✅ Step 2: Clear Platform 1 keys specifically instead of blanket localStorage.clear()
      // This prevents Platform 1 from wiping active NHIA sessions on app initialization.
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("expiryTime");
      localStorage.removeItem("hcpCode");
      localStorage.removeItem("hospitalName");
      setIsAuthenticated(false);
      setHcpCode("");
      setHospitalName("");
    }
  }, []);

  // ✅ Inactivity timer (1 hour)
  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // ✅ Step 3: Targeted key clearing here as well to isolate logout boundaries
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("expiryTime");
        localStorage.removeItem("hcpCode");
        localStorage.removeItem("hospitalName");
        setIsAuthenticated(false);
        setHcpCode("");
        setHospitalName("");
        alert("Session expired due to inactivity. Please log in again.");
        window.location.href = "/login"; // force redirect
      }, 60 * 60 * 1000); // 1 hour
    };

    // Listen for user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    // Start the timer initially
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* PUBLIC ACCESSIBLE PORTS */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/nhia-login" element={<NhiaLogin />} />
        <Route
          path="/login"
          element={
            <Login
              setIsAuthenticated={setIsAuthenticated}
              setHcpCode={setHcpCode}
              setHospitalName={setHospitalName}
            />
          }
        />

        {/* 🏥 SECURE PROTECTED NHIA SECTOR VIEWS */}
        {/* ✅ Step 4: Wrapped using the new specific NhiaProtectedRoute layout */}
        <Route
          path="/nhia-dashboard"
          element={
            <NhiaProtectedRoute>
              <NhiaDashboard />
            </NhiaProtectedRoute>
          }
        />
        <Route
          path="/claims-hub"
          element={
            <NhiaProtectedRoute>
              <NhiaClaimsHub />
            </NhiaProtectedRoute>
          }
        />
        <Route
          path="/authorizations"
          element={
            <NhiaProtectedRoute>
              <NhiaAuthorizations />
            </NhiaProtectedRoute>
          }
        />
        <Route
          path="/reconciliation"
          element={
            <NhiaProtectedRoute>
              <NhiaReconciliation />
            </NhiaProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <NhiaProtectedRoute>
              <NhiaPayments />
            </NhiaProtectedRoute>
          }
        />

        {/* 💻 SECURE PROTECTED APP V1 VIEWS (Prastine & Untouched) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard
                hcpCode={hcpCode}
                hospitalName={hospitalName}
                setIsAuthenticated={setIsAuthenticated}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request-code"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequestCode hcpCode={hcpCode} hospitalName={hospitalName} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/claims"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Claims hcpCode={hcpCode} hospitalName={hospitalName} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Payment hcpCode={hcpCode} hospitalName={hospitalName} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/authorization"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Authorization hcpCode={hcpCode} hospitalName={hospitalName} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attachment"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Attachment hcpCode={hcpCode} hospitalName={hospitalName} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
