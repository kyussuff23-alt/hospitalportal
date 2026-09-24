import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";

export default function Authorization({ hcpCode, hospitalName }) {
  const [requests, setRequests] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModall, setShowModall] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  };

  // Fetch requests for this hospital with nested drugsrequest
  // Fetch finalized authorization requests (approved or denied) straight from Supabase server
  
  // from here 
useEffect(() => {
  const fetchRequests = async () => {
    const { data, error } = await supabase.functions.invoke("auth-requests", {
      body: { hcpCode }
    });

    if (error) {
      showAlert("Could not load your authorization requests.", "danger");
    } else {
      setRequests(data || []);
    }
  };

  if (hcpCode) {
    fetchRequests();
   // stop here 
   
      // Realtime operational sync stream channel subscription hooks
      const channel = supabase
        .channel("authrequest-changes")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "authrequest", 
            filter: `hcpcode=eq.${hcpCode}` 
          },
          () => {
            // Re-fetch automatically filters incoming packet changes through the server logic
            fetchRequests();
          }
        )
        .subscribe();

      // Cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [hcpCode]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const parsed = new Date(isoString);
    return isNaN(parsed.getTime()) ? "N/A" : parsed.toISOString().split("T")[0];
  };

  // Pagination logic
  const currentRows = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return requests.slice(indexOfFirstRow, indexOfLastRow);
  }, [requests, currentPage]);
  
  return (
    <div className="p-1" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* Dynamic System Alert Banner */}
      {alert.message && (
        <div className={`alert alert-${alert.type} py-2 px-3 border-0 border-start border-4 border-${alert.type} small bg-${alert.type}-subtle mb-3 text-start fw-medium`}>
          {alert.message}
        </div>
      )}

      {/* Heading + Button Banner Section */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div className="text-start">
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary"></i> Authorization Clearance Hub
          </h4>
          <p className="text-muted small mb-0">Track code request pipelines, verdicts, and payer settlement notes</p>
        </div>

        <Link 
          to="/request-code" 
          className="btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-sm"
        >
          <i className="bi bi-plus-circle"></i> Create Code Request
        </Link>
      </div>

      {/* High-Density Claims Matrix Grid Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white mb-4">
        <div className="table-responsive" style={{ maxHeight: "440px", overflowY: "auto" }}>
          <table className="table table-hover align-middle mb-0 text-nowrap">
            <thead className="table-dark small text-uppercase sticky-top">
              <tr>
                <th className="py-3 px-3 text-center" style={{ width: "60px" }}>SN</th>
                <th className="py-3" style={{ width: "120px" }}>Date Logged</th>
                <th className="py-3" style={{ width: "140px" }}>Encounter ID</th>
                <th className="py-3" style={{ width: "220px" }}>Patient Enrollee</th>
                <th className="py-3 font-monospace" style={{ width: "140px" }}>Policy Number</th>
                <th className="py-3" style={{ width: "180px" }}>Corporate Client</th>
                <th className="py-3 text-end" style={{ width: "130px" }}>Claim Value</th>
                <th className="py-3 text-center" style={{ width: "120px" }}>Adjudication Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted fw-medium">
                    <i className="bi bi-folder-x fs-3 d-block mb-2 text-secondary"></i>
                    No active authorization requests recorded for this facility provider.
                  </td>
                </tr>
              ) : (
                currentRows.map((req, index) => {
                  const calculatedClaimSum = req.drugsrequest?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0;
                  const itemIndex = (currentPage - 1) * rowsPerPage + index + 1;
                  
                  return (
                    <tr key={req.id} className="border-bottom border-light-subtle">
                      <td className="text-center font-monospace text-secondary px-3">{itemIndex}</td>
                      <td className="fw-medium text-dark-emphasis">{formatDate(req.created_at)}</td>
                      <td className="font-monospace text-primary fw-bold">#ENC-{req.id}</td>
                      <td className="fw-semibold text-dark text-wrap" style={{ maxWidth: "220px" }}>{req.enrolleename}</td>
                      <td className="font-monospace text-secondary small">{req.policyid || "-"}</td>
                      <td className="text-muted small text-wrap" style={{ maxWidth: "180px" }}>{req.client || "-"}</td>
                      <td className="text-end font-monospace fw-bold text-dark">
                        ₦{calculatedClaimSum.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-link p-0 border-0 text-decoration-none shadow-none"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowModall(true);
                          }}
                        >
                          <span
                            className={`badge px-2.5 py-1.5 fw-bold text-capitalize rounded-pill ${
                              req.status === "approved"
                                ? "bg-success text-white shadow-sm"
                                : req.status === "denied"
                                ? "bg-danger text-white shadow-sm"
                                : req.status === "recalled"
                                ? "bg-primary text-white shadow-sm"
                                : "bg-warning text-dark shadow-sm"
                            }`}
                            style={{ minWidth: "85px", display: "inline-block" }}
                          >
                            {req.status === "pending" ? "Awaiting Review" : req.status}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination Segment Control */}
        {requests.length > rowsPerPage && (
          <div className="d-flex justify-content-center p-3 bg-light border-top">
            <ul className="pagination pagination-sm mb-0 shadow-sm rounded">
              {[...Array(Math.ceil(requests.length / rowsPerPage))].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                  <button className="page-link font-monospace px-3" onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* 🛠️ MODAL CONTROL PANEL DRAWER OVERLAY */}
      {showModall && selectedRequest && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1070, backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg rounded-3">
                <div className="modal-header bg-dark text-white py-3 px-4">
                  <h6 className="modal-title font-monospace m-0 fw-bold">
                    <i className="bi bi-folder2-open text-warning me-2 fs-5"></i> Authorization Request File Profile — #ENC-{selectedRequest.id}
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white shadow-none"
                    onClick={() => setShowModall(false)}
                  ></button>
                </div>
                
                <div className="modal-body p-4 bg-light text-start">
                  {/* METRIC BIODATA ACCORDION BLOCK */}
                  <div className="card border-0 shadow-sm p-3 bg-white rounded-3 mb-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Enrollee Patient Name</label>
                        <input type="text" className="form-control bg-light small border-0 fw-semibold" value={selectedRequest.enrolleename || ""} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Policy ID Number</label>
                        <input type="text" className="form-control bg-light small border-0 font-monospace" value={selectedRequest.policyid || "-"} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Client Name</label>
                        <input type="text" className="form-control bg-light small border-0" value={selectedRequest.client || "-"} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Auth Code</label>
                        <input type="text" className="form-control border-2 border-primary text-center font-monospace fw-bold text-primary" value={selectedRequest.authcode || "-"} readOnly />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary mb-1">Diagnosis</label>
                        <textarea className="form-control bg-light small border-0 text-dark-emphasis" rows="2" style={{ resize: "none" }} value={selectedRequest.diagnosis || ""} readOnly />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary mb-1">Denial Reason</label>
                        <textarea className="form-control bg-light small border-0 text-dark-emphasis" rows="2" style={{ resize: "none" }} value={selectedRequest.reason || "-"} readOnly />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary mb-1">Status</label>
                        <input type="text" className="form-control bg-light small border-0 text-capitalize fw-bold" value={selectedRequest.status || ""} readOnly />
                      </div>
                    </div>
                  </div>
                  {/* Services & Drugs Grid Table */}
                  <div className="mb-2 px-1">
                    <label className="form-label small fw-bold text-primary mb-2">
                      <i className="bi bi-capsule me-1"></i> Services & Prescription Drugs Breakdown
                    </label>
                    {selectedRequest.drugsrequest && selectedRequest.drugsrequest.length > 0 ? (
                      <div className="card border-0 shadow-sm overflow-hidden rounded-3 bg-white">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0 text-nowrap small">
                            <thead className="table-dark small text-uppercase">
                              <tr>
                                <th className="py-2.5 px-3">Item Description</th>
                                <th className="py-2.5 text-end" style={{ width: "100px" }}>Price</th>
                                <th className="py-2.5 text-center" style={{ width: "70px" }}>Qty</th>
                                <th className="py-2.5 text-center" style={{ width: "70px" }}>Period</th>
                                <th className="py-2.5 text-end" style={{ width: "120px" }}>Extended Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRequest.drugsrequest.map((drug) => (
                                <tr key={drug.id} className="border-bottom border-light-subtle">
                                  <td className="px-3 fw-semibold text-dark text-wrap" style={{ maxWidth: "240px" }}>
                                    {drug.itemname}
                                    {drug.denialreason && <small className="d-block text-danger font-monospace mt-0.5">⚠️ Reason: {drug.denialreason}</small>}
                                  </td>
                                  <td className="text-end font-monospace text-muted">
                                    ₦{Number(drug.price).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-center font-monospace text-dark">{drug.qty}</td>
                                  <td className="text-center font-monospace text-secondary">{drug.period || "-"}</td>
                                  <td className="text-end font-monospace fw-bold text-primary">
                                    ₦{Number(drug.total).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}

                              {/* Grand Total Row */}
                              <tr className="table-secondary fw-bold">
                                <td colSpan="4" className="text-end py-3 px-3 text-secondary small uppercase tracking-wider">Grand Total Net Sum:</td>
                                <td className="text-end pe-3 text-danger font-monospace fs-6">
                                  ₦{selectedRequest.drugsrequest
                                    .reduce((sum, drug) => sum + Number(drug.total), 0)
                                    .toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted fst-italic my-2 small bg-white p-3 rounded border text-center">No service item rows found in this request folder portfolio.</p>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0 bg-white py-2.5 px-4 shadow-inner">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary fw-semibold px-4 py-1.5"
                    onClick={() => setShowModall(false)}
                  >
                    Close
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

/*
useEffect(() => {
  const fetchRequests = async () => {
    const { data, error } = await supabase.functions.invoke("auth-requests", {
      body: { hcpCode }
    });

    if (error) {
      showAlert("Could not load your authorization requests.", "danger");
    } else {
      setRequests(data || []);
    }
  };

  if (hcpCode) {
    fetchRequests();

    // Keep realtime channel in frontend
    const channel = supabase
      .channel("authrequest-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "authrequest", filter: `hcpcode=eq.${hcpCode}` },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [hcpCode]);  */
