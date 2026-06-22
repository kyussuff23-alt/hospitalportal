import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import React from "react";
import Payment from "./Payment";
import Authorization from "./Authorization";
import Claims from "./Claims";
import Attachment from "./Attachment";

import "./Dashboard.css";
import bcrypt from "bcryptjs";

// Memoize child components to avoid unnecessary re-renders
const MemoClaims = React.memo(Claims);
const MemoPayment = React.memo(Payment);
const MemoAuthorization = React.memo(Authorization);
const MemoAttachment = React.memo(Attachment);

function Greeting() {
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => {
      setHour(new Date().getHours());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const greeting = useMemo(() => {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, [hour]);

  return <h2>{greeting}</h2>;
}

export default function Dashboard({ hcpCode, setIsAuthenticated }) {
  const [hospitalName, setHospitalName] = useState("");
  const [selectedPage, setSelectedPage] = useState("claims");
  
  // Custom manual state to force bootstrap styles to hide/show
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errorAlert, setErrorAlert] = useState("");
  const [successAlert, setSuccessAlert] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHospitalName = async () => {
      const { data, error } = await supabase
        .from("myhospitals")
        .select("name")
        .eq("hcpcode", hcpCode)
        .single();
      if (!error && data) setHospitalName(data.name);
    };
    if (hcpCode) fetchHospitalName();
  }, [hcpCode]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate("/login");
  }, [navigate, setIsAuthenticated]);

  const handleChangePassword = useCallback(async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      setErrorAlert("Please enter both current and new password.");
      return;
    }

    const { data: user } = await supabase
      .from("hospitalprofile")
      .select("password")
      .eq("hcpcode", hcpCode)
      .single();

    if (!user) {
      setErrorAlert("User profile not found.");
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      setErrorAlert("Current password is incorrect.");
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from("hospitalprofile")
      .update({ password: hashedPassword })
      .eq("hcpcode", hcpCode);

    if (error) {
      setErrorAlert("Failed to update password.");
    } else {
      setSuccessAlert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    }
  }, [currentPassword, newPassword, hcpCode]);

  return (
    <div className="d-flex flex-column flex-lg-row w-100 min-vh-100 position-relative">
      
      {/* Mobile Hamburger */}
      <div className="d-lg-none p-2 border-bottom bg-light w-100 d-flex justify-content-between align-items-center">
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={() => setIsSidebarOpen(true)}
        >
          <i className="bi bi-list me-2"></i> Menu
        </button>
        <span className="fw-bold text-primary">Dashboard</span>
      </div>

      {/* Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 d-lg-none" 
          style={{ zIndex: 1040 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Layout */}
      <div
        id="sidebarMenu"
        className={`offcanvas-lg offcanvas-start bg-light border-end p-3 d-flex flex-column h-100 min-vh-100`}
        style={{
          zIndex: 1050,
          transform: isSidebarOpen ? "none" : undefined,
          visibility: isSidebarOpen ? "visible" : undefined,
          transition: "transform 0.3s ease-in-out"
        }}
      >
        {/* Sidebar Header with Close Button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0 text-primary">Dashboard</h4>
          <button 
            type="button" 
            className="btn-close d-lg-none" 
            aria-label="Close"
            onClick={() => setIsSidebarOpen(false)}
          ></button>
        </div>

        <div>
          <ul className="nav flex-column gap-3">
            {["claims", "payment", "authorization", "attachment", "changePassword"].map((page) => (
              <li className="nav-item" key={page}>
                <button
                  className={`btn w-100 text-start sidebar-btn ${
                    selectedPage === page ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => {
                    setSelectedPage(page);
                    setIsSidebarOpen(false); // Closes menu when user selects an option
                  }}
                >
                  <i
                    className={`bi ${
                      page === "claims"
                        ? "bi-file-earmark-text"
                        : page === "payment"
                        ? "bi-credit-card"
                        : page === "authorization"
                        ? "bi-bar-chart"
                        : page === "attachment"
                        ? "bi-paperclip"
                        : "bi-key"
                    } me-2 sidebar-icon ${
                      selectedPage === page ? "text-white" : "text-primary"
                    }`}
                  ></i>
                  {page === "claims"
                    ? "Claims"
                    : page === "payment"
                    ? "Payment"
                    : page === "authorization"
                    ? "Authorization"
                    : page === "attachment"
                    ? "Attachment"
                    : "Change Password"}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Logout pinned at bottom */}
        <div className="mt-auto pt-4">
          <button 
            className="btn btn-dark w-100 sidebar-btn" 
            onClick={() => {
              setIsSidebarOpen(false);
              handleLogout();
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-grow-1 p-4 d-flex flex-column main-content">
        <div className="mb-4 d-flex align-items-center gap-2 flex-wrap text-start">
          <i className="bi bi-hospital text-primary" style={{ fontSize: "2rem" }}></i>
          <h2 className="m-0 d-flex align-items-center gap-2">
            <Greeting /> | {hospitalName}
          </h2>
        </div>

        <div className="w-100 glass-card flex-grow-1">
          <div style={{ display: selectedPage === "claims" ? "block" : "none" }}>
            <MemoClaims hcpCode={hcpCode} hospitalName={hospitalName} />
          </div>
          <div style={{ display: selectedPage === "payment" ? "block" : "none" }}>
            <MemoPayment hcpCode={hcpCode} />
          </div>
          <div style={{ display: selectedPage === "authorization" ? "block" : "none" }}>
            <MemoAuthorization hcpCode={hcpCode} hospitalName={hospitalName} />
          </div>
          <div style={{ display: selectedPage === "attachment" ? "block" : "none" }}>
            <MemoAttachment hcpCode={hcpCode} />
          </div>
          <div style={{ display: selectedPage === "changePassword" ? "block" : "none" }}>
            <div className="p-4">
              {errorAlert && <div className="alert alert-danger">{errorAlert}</div>}
              {successAlert && <div className="alert alert-success">{successAlert}</div>}
              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-warning w-100">
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
