import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Papa from "papaparse";

export default function Claims({ hcpCode, hospitalName }) {
  const [claimsData, setClaimsData] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert({ message: "", type: "" });
    }, 5000);
  };

  // Fetch claims for logged-in user
  useEffect(() => {
    console.log("Claims.jsx mounted with hcpCode:", hcpCode);

    const fetchClaims = async () => {
      console.log("Fetching claims for hcpCode:", hcpCode);
      const { data, error } = await supabase
        .from("providerclaims")
        .select("*")
        .eq("hcpcode", hcpCode)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching claims:", error.message);
        showAlert("Could not load your claims. Please try again.", "danger");
      } else {
        console.log("Fetched claims:", data);
        setClaimsData(data);
      }
    };

    if (hcpCode) {
      fetchClaims();
    } else {
      console.warn("hcpCode is missing or null!");
    }
  }, [hcpCode]);

  const handleDownloadTemplate = () => {
    try {
      const headers = [
        "authcode",
         "provider",
        "hcpcode",
        "services",
        "enrolleename",
        "policyid",
        "plan",
        "client",
        "gender",
        "diagnosis",
        "frequency",
        "period",
        "bill",
        "date"
      ];
      const csvContent = headers.join(",") + "\n";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "claims_template.csv";
      link.click();
    } catch (err) {
      console.error("Error generating template:", err.message);
    }
  };

  const handleUploadCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const ticket = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Uploading file:", file.name, "with ticket:", ticket);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("Parsed CSV rows:", results.data);

        const rows = results.data.map((row) => ({
          ...row,
          ticket: ticket,
          hcpcode: hcpCode
        }));

        console.log("Rows to insert:", rows);

        const { error } = await supabase.from("providerclaims").insert(rows);
        if (error) {
          console.error("Database error:", error.message);
          if (error.message.includes("claim_date_check")) {
            showAlert(
              "One or more dates are invalid or missing. Please use YYYY-MM-DD format.",
              "danger"
            );
          } else {
            showAlert("Upload failed. Please check your file and try again.", "danger");
          }
        } else {
          showAlert("Claims uploaded successfully!", "success");

          const { data } = await supabase
            .from("providerclaims")
            .select("*")
            .eq("hcpcode", hcpCode)
            .order("created_at", { ascending: false });

          console.log("Refetched claims after insert:", data);
          setClaimsData(data);
        }
      }
    });

    event.target.value = null;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().split("T")[0];
  };

  // ✅ Group claims by ticket so only one row per batch is shown
  const uniqueTickets = [];
  const groupedClaims = claimsData.filter((claim) => {
    if (!uniqueTickets.includes(claim.ticket)) {
      uniqueTickets.push(claim.ticket);
      return true;
    }
    return false;
  });

 return (
  <div className="p-4">
    {/* Upload + Template */}
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <i className="bi bi-info-circle text-warning" style={{ fontSize: "1.5rem" }}></i>
        <span className="text-muted small">
          Ensure you fill in the CSV template correctly (date must be YYYY-MM-DD).
        </span>
      </div>
      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-outline-success" onClick={handleDownloadTemplate}>
          <i className="bi bi-filetype-csv me-2"></i> Download Template
        </button>
        <label className="btn btn-primary mb-0">
          <i className="bi bi-upload me-2"></i> Upload CSV
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={(event) => {
              handleUploadCSV(event);
              event.target.value = null;
            }}
          />
        </label>
      </div>
    </div>

    {/* Alerts */}
    {alert.message && (
      <div className={`alert alert-${alert.type} mb-3`} role="alert">
        {alert.message}
      </div>
    )}

    {/* Table */}
    <div className="glass-card table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
      <table className="table table-striped table-hover align-middle">
        <thead className="table-primary sticky-top">
          <tr>
            <th>Date</th>
            <th>Provider</th>
            <th>hcpcode</th>
            <th>Ticket Number</th>
          </tr>
        </thead>
        <tbody>
          {groupedClaims.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No claims uploaded yet.
              </td>
            </tr>
          ) : (
            groupedClaims.map((claim, index) => (
              <tr key={index}>
                <td className="text-truncate">{formatDate(claim.created_at)}</td>
                <td className="text-truncate">{hospitalName}</td>
                <td className="text-truncate">{claim.hcpcode}</td>
                <td className="text-truncate">{claim.ticket}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

}
