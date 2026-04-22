import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import Payment from "./Payment";
import Reconciliation from "./Reconciliation";
import Claims from "./Claims";
import Attachment from "./Attachment";

import "./Dashboard.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Offcanvas } from 'bootstrap';
import bcrypt from "bcryptjs";

function Dashboard({ hcpCode, setIsAuthenticated }) {
  const [hospitalName, setHospitalName] = useState("");
  const [selectedPage, setSelectedPage] = useState("claims");
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

  useEffect(() => {
    const offcanvasEl = document.getElementById("sidebarMenu");
    if (!offcanvasEl) return;

    const offcanvasLinks = offcanvasEl.querySelectorAll("button[data-bs-dismiss='offcanvas']");
    offcanvasLinks.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (offcanvasEl.classList.contains("show")) {
          const bsOffcanvas = Offcanvas.getInstance(offcanvasEl);
          if (bsOffcanvas) bsOffcanvas.hide();
        }
      });
    });

    return () => {
      offcanvasLinks.forEach((btn) => {
        btn.removeEventListener("click", () => {});
      });
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
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
  };

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
        className="offcanvas-lg offcanvas-start bg-light border-end p-3 d-flex flex-column justify-content-between"
        style={{ width: "250px" }}
        data-bs-backdrop="false"
        data-bs-scroll="true"
      >
        <div>
          <h4 className="mb-4 text-primary">Dashboard</h4>
          <ul className="nav flex-column gap-3">
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "claims" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("claims")}
                data-bs-dismiss="offcanvas"
              >
                <i className={`bi bi-file-earmark-text me-2 sidebar-icon ${
                  selectedPage === "claims" ? "text-white" : "text-primary"
                }`}></i>
                Claims
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "payment" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("payment")}
                data-bs-dismiss="offcanvas"
              >
                <i className={`bi bi-credit-card me-2 sidebar-icon ${
                  selectedPage === "payment" ? "text-white" : "text-primary"
                }`}></i>
                Payment
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "reconciliation" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("reconciliation")}
                data-bs-dismiss="offcanvas"
              >
                <i className={`bi bi-bar-chart me-2 sidebar-icon ${
                  selectedPage === "reconciliation" ? "text-white" : "text-primary"
                }`}></i>
                Reconciliation
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "attachment" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("attachment")}
                data-bs-dismiss="offcanvas"
              >
                <i className={`bi bi-paperclip me-2 sidebar-icon ${
                  selectedPage === "attachment" ? "text-white" : "text-primary"
                }`}></i>
                Attachment
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "changePassword" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("changePassword")}
                data-bs-dismiss="offcanvas"
              >
                <i className={`bi bi-key me-2 sidebar-icon ${
                  selectedPage === "changePassword" ? "text-white" : "text-primary"
                }`}></i>
                Change Password
              </button>
            </li>
          </ul>
        </div>

        {/* Logout pinned at bottom */}
        <div>
          <button
            className="btn btn-dark w-100 sidebar-btn"
            onClick={handleLogout}
            data-bs-dismiss="offcanvas"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4 d-flex flex-column align-items-center ms-lg-250">
        <div className="mb-4 text-center d-flex align-items-center justify-content-center gap-2 flex-wrap">
          <i className="bi bi-hospital text-primary" style={{ fontSize: "2rem" }}></i>
          <h2 className="m-0">{getGreeting()}, {hospitalName}</h2>
        </div>

        <div className="w-100 glass-card flex-grow-1">
          {selectedPage === "claims" && <Claims hcpCode={hcpCode} hospitalName={hospitalName} />}
          {selectedPage === "payment" && <Payment hcpCode={hcpCode} />}
          {selectedPage === "reconciliation" && <Reconciliation hcpCode={hcpCode} />}
          {selectedPage === "attachment" && <Attachment hcpCode={hcpCode} />}
          {selectedPage === "changePassword" && (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
