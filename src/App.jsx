import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Claims from "./Claims";


import Reconciliation from "./Reconciliation";
import ProtectedRoute from "./ProtectedRoute";
import Payment from "./Payment";
import Attachment from "./Attachment"


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hcpCode, setHcpCode] = useState("");
  const [hospitalName, setHospitalName] = useState(""); // ✅ new state

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              setIsAuthenticated={setIsAuthenticated}
              setHcpCode={setHcpCode}
              setHospitalName={setHospitalName} // ✅ pass setter into Login
            />
          }
        />

        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard
                hcpCode={hcpCode}
                hospitalName={hospitalName} // ✅ pass hospitalName down
                setIsAuthenticated={setIsAuthenticated}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/claims"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Claims hcpCode={hcpCode} hospitalName={hospitalName} /> {/* ✅ pass hospitalName */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Payment hcpCode={hcpCode} hospitalName={hospitalName} /> {/* ✅ pass hospitalName */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/reconciliation"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Reconciliation hcpCode={hcpCode} hospitalName={hospitalName} /> {/* ✅ pass hospitalName */}
            </ProtectedRoute>
          }
        />


         <Route
          path="/attachment"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Attachment hcpCode={hcpCode} hospitalName={hospitalName} /> {/* ✅ pass hospitalName */}
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
