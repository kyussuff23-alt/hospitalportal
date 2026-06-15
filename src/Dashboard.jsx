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

// ✅ FIX 1: Greeting declared out here so React tracks its hook states properly
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
  
  // ✅ FIX 2: Moved currentPassword inside the actual Dashboard component
  const [currentPassword, setCurrentPassword] = useState("");
  // ✅ FIX 3: Added missing state declaration for newPassword to prevent crash
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
   <div className="d-flex flex-column flex-lg-row">
  {/* Mobile Hamburger */}
  <div className="d-lg-none p-2 border-bottom bg-light">
    <button
      className="btn btn-outline-primary"
      type="button"
      data-bs-toggle="offcanvas"
      data-bs-target="#sidebarMenu"
    >
      <i className="bi bi-list"></i> Menu
    </button>
  </div>

  {/* Sidebar */}
  <div
    id="sidebarMenu"
    className="offcanvas-lg offcanvas-start bg-light border-end p-3 d-flex flex-column"
    data-bs-backdrop="false"
    data-bs-scroll="true"
  >
    <div>
      <h4 className="mb-4 text-primary">Dashboard</h4>
      <ul className="nav flex-column gap-3">
        {["claims", "payment", "authorization", "attachment", "changePassword"].map((page) => (
          <li className="nav-item" key={page}>
            <button
              className={`btn w-100 text-start sidebar-btn ${
                selectedPage === page ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setSelectedPage(page)}
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
    <div className="mt-auto">
      <button className="btn btn-dark w-100 sidebar-btn" onClick={handleLogout}>
        Log Out
      </button>
    </div>
  </div>

  {/* Main Content */}
  <div className="flex-grow-1 p-4 d-flex flex-column main-content"> {/* FIXED: Removed align-items-center */}
  <div className="mb-4 d-flex align-items-center gap-2 flex-wrap text-start"> {/* FIXED: Removed center utilities, added text-start */}
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


