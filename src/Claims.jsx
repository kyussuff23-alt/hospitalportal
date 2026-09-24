import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

export default function Claims({ hcpCode, hospitalName }) {
  const [claimsData, setClaimsData] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // ✅ New reactive date filtering tracking state controls
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
    // ✅ Pagination state tracking hooks
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Automatically reset back to page 1 whenever the monthly cycle filters are altered
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);


  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  };

// edge  functions begins here 
 useEffect(() => {
  const fetchClaims = async () => {
    const { data, error } = await supabase.functions.invoke("claims-requests", { 
      body: { hcpCode } 
    });
    
    if (error) {
      showAlert("Could not load your active payment advice ledger.", "danger");
    } else {
      setClaimsData(data || []);
    }
  };

  if (hcpCode) {
    // initial fetch
    fetchClaims();

    // realtime subscription
    const channel = supabase
      .channel("provider-settlements-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "authrequest", filter: `hcpcode=eq.${hcpCode}` },
        () => { fetchClaims(); }
      )
      .subscribe();

    // cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [hcpCode]);

 // edge functions stop here 


// ✅ 2. High-Performance Front-End Filtering Engine (Computes Date Filters dynamically)
  const filteredClaimsData = useMemo(() => {
    return claimsData.filter((folder) => {
      if (!folder.created_at) return false;
      
      // Isolate only the pure YYYY-MM-DD string value from the timestamp
      const fileDateStr = folder.created_at.split("T")[0];

      // Conditional evaluations checking manual input boundaries
      if (startDate && fileDateStr < startDate) return false;
      if (endDate && fileDateStr > endDate) return false;

      return true;
    });
  }, [claimsData, startDate, endDate]);

  // ✅ 1. Compute the paginated subset from your date-filtered claims data array dynamically
  const paginatedClaimsRows = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filteredClaimsData.slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredClaimsData, currentPage]);

  // ✅ 2. Live Itemized Payment Advice Spreadsheet Exporter (Looks strictly at filtered subset)
  const handleExportPaymentAdvice = () => {
    // 🔒 Intercept accidental triggers before firing heavy array processing loops
    const confirmDownload = window.confirm("Are you sure you want to compile and export the Payment Advice statement for the selected date range?");
    if (!confirmDownload) return;

    try {
      const csvHeaders = [
        "Encounter ID", "Date", "Enrollee Name", "Policy ID", "Company", "Plan",
        "Diagnosis", "Hospital Name", "Auth Code", "Item Name", "Price", "Qty",
        "Period", "Total", "Status", "Batch Reason", "Line Denial Reason"
      ];

      const csvRows = [];

      // Flatten out ONLY the rows currently matching the selected month filter bounds
      filteredClaimsData.forEach((folder) => {
        const isRecalled = folder.status === "recalled";
        const dateStr = folder.created_at ? folder.created_at.split("T")[0] : "N/A";

        if (!folder.drugsrequest || folder.drugsrequest.length === 0) {
          csvRows.push([
            `"ENC-${folder.id}"`, `"${dateStr}"`, `"${folder.enrolleename || "N/A"}"`,
            `"${folder.policyid || "N/A"}"`, `"${folder.client || "N/A"}"`, `"${folder.plan || "N/A"}"`,
            `"${folder.diagnosis?.replace(/"/g, '""') || "None"}"`, `"${folder.hospname || hospitalName}"`,
            `"${folder.authcode || "N/A"}"`, `"No items recorded"`, "0.00", "0", "0", "0.00",
            `"${folder.status.toUpperCase()}"`, `"${folder.reason?.replace(/"/g, '""') || "None"}"`, `"None"`
          ].join(","));
          return;
        }

        folder.drugsrequest.forEach((drug) => {
          const finalPrice = isRecalled ? 0 : (Number(drug.price) || 0);
          const finalQty = isRecalled ? 0 : (Number(drug.qty) || 0);
          const finalPeriod = isRecalled ? 0 : (Number(drug.period) || 0);
          const finalTotal = isRecalled ? 0 : (Number(drug.total) || 0);
          const finalLineDenial = isRecalled ? "recalled" : (drug.denialreason || "None");

          csvRows.push([
            `"ENC-${folder.id}"`, `"${dateStr}"`, `"${folder.enrolleename || "N/A"}"`,
            `"${folder.policyid || "N/A"}"`, `"${folder.client || "N/A"}"`, `"${folder.plan || "N/A"}"`,
            `"${folder.diagnosis?.replace(/"/g, '""') || "None"}"`, `"${folder.hospname || hospitalName}"`,
            `"${folder.authcode || "N/A"}"`, `"${drug.itemname?.replace(/"/g, '""') || "N/A"}"`,
            finalPrice.toFixed(2), finalQty, finalPeriod, finalTotal.toFixed(2),
            `"${folder.status.toUpperCase()}"`, `"${folder.reason?.replace(/"/g, '""') || "None"}"`,
            `"${finalLineDenial?.replace(/"/g, '""')}"`
          ].join(","));
        });
      });

      const csvContent = "data:text/csv;charset=utf-8," + [csvHeaders.join(","), ...csvRows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const downloadLink = document.createElement("a");
      downloadLink.setAttribute("href", encodedUri);
      
      const fileSuffix = startDate && endDate ? `${startDate}_to_${endDate}` : "Full_Ledger";
      downloadLink.setAttribute("download", `HMO_Itemized_Payment_Advice_${hcpCode}_${fileSuffix}.csv`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showAlert("Filtered itemized monthly statement exported successfully!", "success");
    } catch (err) {
      console.error("Export failure:", err.message);
      showAlert("Failed compiling monthly spreadsheet extract.", "danger");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const parsed = new Date(isoString);
    return isNaN(parsed.getTime()) ? "N/A" : parsed.toISOString().split("T")[0];
  };

  const formatNaira = (value) => {
    if (!value || isNaN(value)) return "₦0";
    return "₦" + new Intl.NumberFormat("en-NG", { minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-1" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* Dynamic Action Alerts Messaging Banner */}
      {alert.message && (
        <div className={`alert alert-${alert.type} py-2 px-3 border-0 border-start border-4 border-${alert.type} small bg-${alert.type}-subtle mb-3 text-start fw-medium`}>
          {alert.message}
        </div>
      )}

      {/* Top Header Controls Ribbon Row */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4 text-start">
        <div>
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-check text-success"></i> Claims Settlement & Payment Advice
          </h4>
          <p className="text-muted small mb-0">Reconcile cleared encounter profiles and track legally entitled HMO balance summaries</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-sm"
            onClick={handleExportPaymentAdvice}
          >
            <i className="bi bi-file-earmark-spreadsheet-fill fs-5"></i> Export Payment Advice
          </button>
        </div>
      </div>

      {/* ✅ Premium On-Screen Monthly Date Range Filter Card */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-3 mb-4 text-start border border-light-subtle">
        <h6 className="fw-bold text-secondary small uppercase tracking-wider mb-2">
          <i className="bi bi-calendar-range me-1"></i> Statement Monthly Date Range Filter
        </h6>
        <div className="row g-3">
          <div className="col-6 col-sm-4">
            <label className="form-label small fw-semibold text-muted mb-1">Cycle Start Date</label>
            <input type="date" className="form-control form-control-sm shadow-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="col-6 col-sm-4">
            <label className="form-label small fw-semibold text-muted mb-1">Cycle End Date</label>
            <input type="date" className="form-control form-control-sm shadow-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="col-12 col-sm-4 d-flex align-items-end gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary w-100 py-1.5 font-monospace fw-bold" onClick={() => { setStartDate(""); setEndDate(""); }} disabled={!startDate && !endDate}>
              Reset Cycle Filter
            </button>
          </div>
        </div>
      </div>

      {/* Support Communications Subheader Alert */}
      <div className="alert alert-light border border-light-subtle d-flex align-items-center gap-2.5 p-3 rounded-3 mb-4 text-start shadow-sm">
        <i className="bi bi-telephone-outbound-fill text-warning fs-5"></i>
        <span className="text-secondary small">
          Need variance clarification or ledger resolution? Contact the central HMO Adjudication Desk line directly at <strong className="text-dark">08078392043</strong> with the relevant Encounter ID.
        </span>
      </div>

      {/* 🏛️ FINANCIAL CLEARANCE MATRIX HIGH-DENSITY GRID TABLE */}
      <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
        <div className="table-responsive" style={{ maxHeight: "440px", overflowY: "auto" }}>
          <table className="table table-hover align-middle mb-0 text-nowrap">
            <thead className="table-dark small text-uppercase sticky-top">
              <tr>
                <th className="py-3 px-3 text-center" style={{ width: "60px" }}>SN</th>
                <th className="py-3" style={{ width: "120px" }}>Cleared Date</th>
                <th className="py-3" style={{ width: "140px" }}>Encounter ID</th>
                <th className="py-3" style={{ width: "220px" }}>Patient Beneficiary</th>
                <th className="py-3 font-monospace" style={{ width: "140px" }}>Policy ID</th>
                <th className="py-3" style={{ width: "160px" }}>Insurance Plan</th>
                <th className="py-3 text-end" style={{ width: "140px" }}>Entitled Settlement</th>
                <th className="py-3 text-center" style={{ width: "130px" }}>Payer State Verdict</th>
              </tr>
            </thead>
                       <tbody>
              {filteredClaimsData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted fw-medium">
                    <i className="bi bi-inbox-fill fs-3 d-block mb-2 text-secondary"></i>
                    No settled or recalled claim advices registered for these filter parameters.
                  </td>
                </tr>
              ) : (
                paginatedClaimsRows.map((claim, idx) => {
                  const isRecalled = claim.status === "recalled";
                  const entitledAmount = isRecalled ? 0 : (claim.drugsrequest?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0);
                  
                  // Computes the continuous row number sequentially across multiple pages
                  const serialNumber = (currentPage - 1) * rowsPerPage + idx + 1;

                  return (
                    <tr key={claim.id} className="border-bottom border-light-subtle">
                      <td className="text-center font-monospace text-secondary px-3">{serialNumber}</td>
                      <td className="fw-medium text-dark-emphasis">{formatDate(claim.created_at)}</td>
                      <td className="font-monospace text-success fw-bold">#ENC-{claim.id}</td>
                      <td className="fw-semibold text-dark text-wrap" style={{ maxWidth: "220px" }}>{claim.enrolleename}</td>
                      <td className="font-monospace text-secondary small">{claim.policyid || "-"}</td>
                      <td className="small fw-medium text-primary-emphasis">{claim.plan || "-"}</td>
                      <td className={`text-end font-monospace fw-extrabold ${isRecalled ? "text-muted text-decoration-line-through" : "text-dark"}`}>
                        {formatNaira(entitledAmount)}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-decoration-none shadow-none"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowModal(true);
                          }}
                        >
                          <span
                            className={`badge px-2.5 py-1.5 fw-bold text-uppercase rounded-pill ${
                              isRecalled 
                                ? "bg-primary text-white shadow-sm" 
                                : "bg-info text-dark shadow-sm fw-extrabold"
                            }`}
                            style={{ minWidth: "95px", display: "inline-block", fontSize: "0.72rem" }}
                          >
                            {isRecalled ? "Recalled" : "Processed"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
       
       
               {/* Unified Pagination Segment Control */}
        {filteredClaimsData.length > rowsPerPage && (
          <div className="d-flex justify-content-center p-3 bg-light border-top">
            <ul className="pagination pagination-sm mb-0 shadow-sm rounded">
              {[...Array(Math.ceil(filteredClaimsData.length / rowsPerPage))].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                  <button 
                    type="button" 
                    className="page-link font-monospace px-3" 
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

       
        </div>
      </div>
      {/* 🛠️ INDIVIDUAL FILE AUDIT ANALYSIS INTERFACE MODAL */}
      {showModal && selectedClaim && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1070, backgroundColor: "rgba(0,0,0,0.25)" }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg rounded-3">
                <div className="modal-header bg-dark text-white py-3 px-4 border-0">
                  <h6 className="modal-title font-monospace m-0 fw-bold">
                    <i className="bi bi-receipt-cutoff text-warning me-2 fs-5"></i> Claims Reconciliation Itemized Statement — #ENC-{selectedClaim.id}
                  </h6>
                  <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setShowModal(false)}></button>
                </div>
                
                <div className="modal-body p-4 bg-light text-start">
                  {/* MASTER FILE BENEFIT PROFILE METRICS CARD */}
                  <div className="card border-0 shadow-sm p-3 bg-white rounded-3 mb-4 border border-light-subtle">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-0.5">Enrollee Name</label>
                        <input type="text" className="form-control bg-light small border-0 fw-semibold" value={selectedClaim.enrolleename || ""} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-0.5">Policy Number ID</label>
                        <input type="text" className="form-control bg-light small border-0 font-monospace" value={selectedClaim.policyid || "-"} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-0.5">Corporate Sponsor</label>
                        <input type="text" className="form-control bg-light small border-0" value={selectedClaim.client || "-"} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-0.5">Payer Released Auth Code</label>
                        <input type="text" className="form-control border-2 border-success text-center font-monospace fw-bold text-success bg-white" value={selectedClaim.authcode || "N/A"} readOnly />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary mb-0.5">Diagnosis Narrative Summary</label>
                        <textarea className="form-control bg-light small border-0 text-dark-emphasis" rows="1" style={{ resize: "none" }} value={selectedClaim.diagnosis || ""} readOnly />
                      </div>
                      {selectedClaim.reason && (
                        <div className="col-12">
                          <label className="form-label small fw-bold text-danger mb-0.5">HMO Adjustment Exception Rationale Statement</label>
                          <textarea className="form-control border-danger border-opacity-10 bg-danger bg-opacity-10 small text-danger font-medium" rows="2" style={{ resize: "none" }} value={selectedClaim.reason} readOnly />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ITEMIZED ADJUDICATED PRICING Matrix CONTAINER */}
                  <div className="px-1">
                    <label className="form-label small fw-bold text-primary mb-2">
                      <i className="bi bi-capsule me-1"></i> Disbursed Formulation Itemization & Pricing Variances
                    </label>
                    
                    <div className="card border-0 shadow-sm overflow-hidden rounded-3 bg-white border border-light-subtle">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 text-nowrap small">
                          <thead className="table-dark text-uppercase text-xs fw-bold">
                            <tr>
                              <th className="py-2.5 px-3">Formulation Name Details</th>
                              <th className="py-2.5 text-end" style={{ width: "110px" }}>Unit Price</th>
                              <th className="py-2.5 text-center" style={{ width: "70px" }}>Qty</th>
                              <th className="py-2.5 text-center" style={{ width: "70px" }}>Period</th>
                              <th className="py-2.5 text-end" style={{ width: "120px" }}>Settlement Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!selectedClaim.drugsrequest || selectedClaim.drugsrequest.length === 0 ? (
                              <tr><td colSpan="5" className="text-center text-muted py-3">No active itemized line rows link profile.</td></tr>
                            ) : (
                              selectedClaim.drugsrequest.map((drug) => {
                                const isRecalledState = selectedClaim.status === "recalled";
                                return (
                                  <tr key={drug.id} className="border-bottom border-light-subtle">
                                    <td className="px-3 fw-semibold text-dark text-wrap" style={{ maxWidth: "240px" }}>
                                      {drug.itemname}
                                      {drug.denialreason && <small className="d-block text-danger font-monospace mt-0.5">⚠️ Auditor Exception: {drug.denialreason}</small>}
                                    </td>
                                    <td className="text-end font-monospace text-muted">{formatNaira(drug.price)}</td>
                                    <td className="text-center font-monospace fw-bold text-dark">{isRecalledState ? 0 : drug.qty}</td>
                                    <td className="text-center font-monospace text-secondary">{isRecalledState ? "0d" : `${drug.period || 1}d`}</td>
                                    <td className={`text-end font-monospace fw-bold ${isRecalledState ? "text-muted text-decoration-line-through" : "text-primary"}`}>{formatNaira(isRecalledState ? 0 : drug.total)}</td>
                                  </tr>
                                );
                              })
                            )}
                            
                            {/* Cumulative Grid Calculations Row */}
                            <tr className="table-secondary fw-bold">
                              <td colSpan="4" className="text-end py-3 px-3 text-secondary uppercase text-xs tracking-wider">Entitled Folder Valuation Balance:</td>
                              <td className="text-end pe-3 text-danger font-monospace fs-6">
                                {formatNaira(selectedClaim.status === "recalled" ? 0 : selectedClaim.drugsrequest?.reduce((sum, d) => sum + Number(d.total), 0))}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="modal-footer border-0 bg-white py-2.5 px-4 shadow-inner">
                  <button type="button" className="btn btn-sm btn-secondary fw-semibold px-4 py-1.5" onClick={() => setShowModal(false)}>
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

// ✅ 1. Server-Level Filtering Pulling Strictly processed & recalled folders
  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from("authrequest")
      .select(`
        id,
        enrolleename,
        policyid,
        client,
        plan,
        diagnosis,
        hcpcode,
        hospname,
        authcode,
        reason,
        status,
        created_at,
        drugsrequest (
          id,
          itemname,
          price,
          qty,
          period,
          total,
          denialreason
        )
      `)
      .eq("hcpcode", hcpCode)
      .or("status.eq.processed,status.eq.recalled")
      .order("created_at", { ascending: false });

    if (error) {
      showAlert("Could not load your active payment advice ledger.", "danger");
    } else {
      setClaimsData(data || []);
    }
  };

  useEffect(() => {
    if (hcpCode) {
      fetchClaims();

      // stop here 
    




*/