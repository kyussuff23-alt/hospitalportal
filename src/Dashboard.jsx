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

  return <span>{greeting}</span>;
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

 
 // start edge 
 
useEffect(() => {
  const fetchHospitalName = async () => {
    const { data, error } = await supabase.functions.invoke("fetch-hospital-name", {
      body: { hcpCode }
    });

    if (!error && data) {
      setHospitalName(data.name);
    }
  };

  if (hcpCode) {
    fetchHospitalName();
  }
}, [hcpCode]);

 
 // stop edge 

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate("/login");
  }, [navigate, setIsAuthenticated]);

  const handleChangePassword = useCallback(async (e) => {
    e.preventDefault();
    setErrorAlert("");
    setSuccessAlert("");

    if (!currentPassword || !newPassword) {
      setErrorAlert("Please enter both current and new password.");
      return;
    }

    // edge function start here 
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
    <div className="d-flex flex-column flex-lg-row w-100 min-vh-100 position-relative bg-light" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* 📱 MOBILE TOP NAVIGATION ROW */}
      <div className="d-lg-none w-100 bg-dark text-white px-3 py-2.5 d-flex justify-content-between align-items-center flex-shrink-0" style={{ zIndex: 1040, height: "60px", backgroundColor: "#1e2229" }}>
        <button
          className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 px-2.5 py-1.5"
          type="button"
          onClick={() => setIsSidebarOpen(true)}
        >
          <i className="bi bi-list fs-5"></i> Menu
        </button>
        <span className="fw-bold tracking-wide small text-uppercase text-white-50">{selectedPage} Desk</span>
      </div>

      {/* 📱 SIDEBAR BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black opacity-50 d-lg-none" 
          style={{ zIndex: 1045 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🏛️ CENTRAL SIDEBAR ENGINE (DESKTOP + MOBILE SLIDEOUT) */}
      <div
        id="sidebarMenu"
        className={`bg-dark text-white d-flex flex-column justify-content-between p-3 border-end border-secondary border-opacity-25 transition-all duration-300 ${isSidebarOpen ? "position-fixed top-0 start-0 h-100 w-250" : "d-none d-lg-flex"}`}
        style={{
          width: "240px",
          minWidth: "240px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1050,
          backgroundColor: "#1e2229"
        }}
      >
        <div className="d-flex flex-column overflow-hidden h-100">
          {/* Sidebar Header with Close Button */}
          <div className="p-2 pb-4 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center flex-shrink-0">
            <div>
              <h5 className="m-0 text-white fw-bold tracking-wide d-flex align-items-center gap-2">
                <i className="bi bi-activity text-primary"></i> Provider Portal
              </h5>
              <small className="text-muted text-xs uppercase fw-semibold font-monospace tracking-widest">Facility Operations</small>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white d-lg-none shadow-none" 
              aria-label="Close"
              onClick={() => setIsSidebarOpen(false)}
            ></button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-grow-1 overflow-y-auto py-3 custom-sidebar-scrollbar">
            <ul className="nav flex-column gap-1">
              {[
                { key: "claims", icon: "bi-file-earmark-medical", label: "Claims Processing" },
                { key: "payment", icon: "bi-credit-card-2-back", label: "Payment Advice" },
                { key: "authorization", icon: "bi-shield-check", label: "Authorization Hub" },
                { key: "attachment", icon: "bi-paperclip", label: "Document Ledger" },
                { key: "changePassword", icon: "bi-key-fill", label: "Security & Keys" },
              ].map((item) => {
                const isActive = selectedPage === item.key;
                return (
                  <li className="nav-item" key={item.key}>
                    <button
                      className={`nav-link w-100 text-start rounded-2 px-3 py-2.5 d-flex align-items-center gap-3 border-start border-3 transition-all ${
                        isActive 
                          ? "bg-primary text-white border-primary fw-bold shadow-sm" 
                          : "text-white-50 border-transparent hover-bg-dark"
                      }`}
                      style={{ borderTop: 0, borderRight: 0, borderBottom: 0, background: isActive ? undefined : "transparent" }}
                      onClick={() => {
                        setSelectedPage(item.key);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <i className={`${item.icon} fs-5 ${isActive ? "text-white" : "text-secondary"}`}></i>
                      <span className="small">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Logout pinned at bottom */}
          <div className="p-2 border-top border-secondary border-opacity-10 bg-black bg-opacity-25 rounded-3 flex-shrink-0">
            <button 
              className="btn btn-dark w-100 sidebar-btn border-0 fw-bold bg-danger bg-opacity-10 text-danger hover-bg-danger" 
              style={{ transition: "all 0.2s" }}
              onClick={() => {
                setIsSidebarOpen(false);
                handleLogout();
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i> Log out
            </button>
          </div>
        </div>
      </div>
      {/* 🚀 2. CENTRAL ACTIVE APPLICATION CONTENT CONSOLE AREA */}
      <div 
        className="flex-grow-1 d-flex flex-column h-100 overflow-hidden ms-0 ms-lg-auto" 
        style={{ maxWidth: "100%", paddingLeft: "0px" }}
      >
        {/* Desktop Wrapper Structural Alignment Reset */}
        <div className="d-none d-lg-block" style={{ width: "240px", height: "0px" }} />
        
        {/* Header Ribbon Element */}
        <div className="p-4 bg-white border-bottom flex-shrink-0 responsive-header-padding">
          <div className="d-flex align-items-center gap-3 flex-wrap text-start">
            <div className="bg-primary-subtle p-2.5 rounded-3 text-primary d-flex align-items-center justify-content-center shadow-sm">
              <i className="bi bi-hospital fs-3"></i>
            </div>
            <div>
              <h4 className="fw-extrabold text-dark m-0 tracking-tight">{hospitalName || "Loading Facility..."}</h4>
              <p className="text-muted small mb-0 d-flex align-items-center gap-1.5 font-monospace">
                <i className="bi bi-clock-history text-secondary"></i> <Greeting />, Node Active • HCP: <span className="text-primary fw-bold">{hcpCode}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Workspace Workspace Panel Sheet */}
        <main className="flex-grow-1 overflow-y-auto p-3 p-lg-4 custom-workspace-scrollbar bg-light">
          <div className="w-100 animate-fade-in pb-4">
            
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
            
            {/* Security Passkeys Panel Form */}
            <div style={{ display: selectedPage === "changePassword" ? "block" : "none" }}>
              <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mx-auto" style={{ maxWidth: "28rem" }}>
                <div className="text-center mb-3">
                  <div className="bg-warning-subtle text-warning d-inline-flex p-3 rounded-circle mb-2"><i className="bi bi-shield-lock-fill fs-4"></i></div>
                  <h5 className="fw-bold text-dark m-0">Update Node Credentials</h5>
                  <p className="text-muted small">Modify encrypted password matrix variables safely</p>
                </div>

                {errorAlert && <div className="alert alert-danger py-2 px-3 small border-0 border-start border-4 border-danger rounded-0 bg-danger-subtle text-danger fw-medium mb-3">{errorAlert}</div>}
                {successAlert && <div className="alert alert-success py-2 px-3 small border-0 border-start border-4 border-success rounded-0 bg-success-subtle text-success fw-medium mb-3">{successAlert}</div>}
                
                <form onSubmit={handleChangePassword} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-bold text-secondary mb-1">Current Password</label>
                    <input
                      type="password"
                      className="form-control border-light-subtle shadow-none bg-light py-2"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-bold text-secondary mb-1">New Secure Password</label>
                    <input
                      type="password"
                      className="form-control border-light-subtle shadow-none bg-light py-2"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-warning fw-bold text-dark w-100 py-2 mt-2 shadow-sm border-0 bg-gradient">
                    Commit Password Changes
                  </button>
                </form>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Embedded build production utility adjustments style tags */}
      <style>{`
        .transition-all { transition: all 0.2s ease-in-out; }
        .hover-bg-dark:hover { background-color: rgba(255,255,255,0.06); color: #fff !important; }
        .hover-bg-dark:hover i { color: #fff !important; }
        .hover-bg-danger:hover { background-color: #dc3545 !important; color: #fff !important; }
        .border-transparent { border-left-color: transparent !important; }
        .text-xs { font-size: 0.72rem !important; }
        .tracking-widest { letter-spacing: 0.12em; }
        .tracking-tight { letter-spacing: -0.02em; }
        .custom-sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @media(min-width: 992px) {
          .ms-lg-auto { margin-left: 240px !important; }
        }
        @media(max-width: 991px) {
          .responsive-header-padding { margin-top: 60px !important; }
        }
      `}</style>

    </div>
  );
}


/*
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



*/