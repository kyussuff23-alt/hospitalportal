import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Papa from "papaparse";

export default function Claims({ hcpCode, hospitalName }) {
  const [claimsData, setClaimsData] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert({ message: "", type: "" });
    }, 5000);
  };

  useEffect(() => {
    const fetchClaims = async () => {
      const { data, error } = await supabase
        .from("providerclaims")
        .select("*")
        .eq("hcpcode", hcpCode)
        .order("created_at", { ascending: false });

      if (error) {
        showAlert("Could not load your claims. Please try again.", "danger");
      } else {
        setClaimsData(data);
      }
    };

    if (hcpCode) {
      fetchClaims();
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map((row) => ({
          ...row,
          ticket: ticket,
          hcpcode: hcpCode
        }));

        const { error } = await supabase.from("providerclaims").insert(rows);
        if (error) {
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
            Please contact Claims Department on <strong>08078392043</strong> for any challenge
          </span>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-outline-success"
            onClick={() => setShowModal(true)}
          >
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

      {/* Bootstrap Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document"> {/* wider modal */}
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Claims Template Instructions</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowModal(false);
                     // handleDownloadTemplate();
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <h6 className="fw-bold text-primary mb-3">
                    📋 Please follow these rules when filling the CSV template:
                  </h6>
                  <div className="px-3">
                    <p>• Date must be in <strong>YYYY-MM-DD</strong> format.</p>
                    <p>• All required fields must be completed.</p>
                    <p className="text-danger fw-bold">• Do not alter the header row.</p>
                    <p>
                      • For <strong>Frequency</strong> field fill: OD (ONCE A DAY), BD (TWICE A DAY), TDS (THRICE A DAY).
                    </p>
                    <p>
                      • <strong>PERIOD</strong> is the number of days drugs or services are to be given. Must be in numbers [1,2,3].
                    </p>
                    <p>• Every row is treated as a separate claim with its own authorization code.</p>
                    <p>
                      • i.e. if an enrollee collects 3 different drugs, each drug is a claim row with the same authorization code.
                    </p>
                    <p>
                      • After successful upload, check your dashboard for the ticket number, copy it, and send to your claims officer for follow‑up.
                    </p>
                  </div>
                  <p className="mt-3 text-secondary">
                    ✅ Click the <strong>Close</strong> button to download the template.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      handleDownloadTemplate();
                    }}
                  >
                  Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
