import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

import Payment from "./Payment";
import Reconciliation from "./Reconciliation";
import Claims from "./Claims";
import "./Dashboard.css";

function Dashboard({ hcpCode, setIsAuthenticated }) {
  const [hospitalName, setHospitalName] = useState("");
  const [selectedPage, setSelectedPage] = useState("claims"); // ✅ default MyClaims
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHospitalName = async () => {
      const { data, error } = await supabase
        .from("myhospitals")
        .select("name")
        .eq("hcpcode", hcpCode)
        .single();

      if (!error && data) {
        setHospitalName(data.name);
      }
    };

    if (hcpCode) fetchHospitalName();
  }, [hcpCode]);

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

  return (
    <div className="d-flex flex-row">
      {/* Sidebar */}
      <div
        className="bg-light border-end p-3 d-flex flex-column justify-content-between"
        style={{
          width: "250px",
          height: "100vh",
          position: "fixed",   // ✅ fixed sidebar
          top: 0,
          left: 0
        }}
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
              >
                <i
                  className={`bi bi-file-earmark-text me-2 sidebar-icon ${
                    selectedPage === "claims" ? "text-white" : "text-primary"
                  }`}
                ></i>
                Claims
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "payment" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("payment")}
              >
                <i
                  className={`bi bi-credit-card me-2 sidebar-icon ${
                    selectedPage === "payment" ? "text-white" : "text-primary"
                  }`}
                ></i>
                Payment
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start sidebar-btn ${
                  selectedPage === "reconciliation" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedPage("reconciliation")}
              >
                <i
                  className={`bi bi-bar-chart me-2 sidebar-icon ${
                    selectedPage === "reconciliation" ? "text-white" : "text-primary"
                  }`}
                ></i>
                Reconciliation
              </button>
            </li>
          </ul>
        </div>

        {/* Logout pinned at bottom */}
        <div>
          <button className="btn btn-dark w-100 sidebar-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow-1 p-4 d-flex flex-column align-items-center"
        style={{ marginLeft: "250px", overflowY: "auto", height: "100vh" }}
      >
        {/* Greeting header centered with hospital icon */}
        <div className="mb-4 text-center d-flex align-items-center justify-content-center gap-2">
          <i className="bi bi-hospital text-primary" style={{ fontSize: "2rem" }}></i>
          <h2 className="m-0">{getGreeting()}, {hospitalName}</h2>
        </div>

        {/* Page content with glass effect */}
<div className="w-100 glass-card flex-grow-1">
  {selectedPage === "claims" && <Claims hcpCode={hcpCode} hospitalName={hospitalName} />}
  {selectedPage === "payment" && <Payment hcpCode={hcpCode} />}
  {selectedPage === "reconciliation" && <Reconciliation hcpCode={hcpCode} />}
</div>


      </div>
    </div>
  );
}

export default Dashboard;
