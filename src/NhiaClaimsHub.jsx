import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function NhiaClaimsHub() {
  const [facilityName] = useState(localStorage.getItem("nhia_hospname") || "Accredited Facility");
  const [facilityCode] = useState(localStorage.getItem("nhia_hcpCode") || "NHIA-UNKNOWN");

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State Variables
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modal inspection parameters state mapping
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [associatedDrugs, setAssociatedDrugs] = useState([]);

  // 1. Initial Data Fetching & Realtime Sync Engine Initialization
  useEffect(() => {
    if (!facilityCode || facilityCode === "NHIA-UNKNOWN") return;

    fetchProcessedClaims();

    // Dedicated real-time listener filtering by hospital provider code
    const hubChannel = supabase
      .channel(`claims-hub-${facilityCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nhia_claims_biodata" },
        (payload) => {
          const currentRecord = payload.new?.id ? payload.new : payload.old;
          if (currentRecord && currentRecord.hcpcode === facilityCode) {
            handleRealtimeMutation(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(hubChannel);
    };
  }, [facilityCode]);
 
  // Fetch initial data array by triggering Edge Function
  // Fetch initial data array by triggering Edge Function
  const fetchProcessedClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("NhiaClaimsProcessed", {
        body: { action: "fetch_all", hcpCode: facilityCode }
      });
      if (error || (data && data.error)) {
        throw new Error(error?.message || data?.error);
      }
      setClaims(data.data || []);
    } catch (err) {
      console.error("Edge Routing Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize live mutations with client state vectors seamlessly
  const handleRealtimeMutation = (payload) => {
    const { eventType, new: newRow, old: oldRow } = payload;
    setClaims((currentClaims) => {
      if (eventType === "INSERT" && newRow.status?.toLowerCase() === "processed") {
        return [newRow, ...currentClaims];
      }
      if (eventType === "UPDATE") {
        if (newRow.status?.toLowerCase() !== "processed") {
          return currentClaims.filter((claim) => claim.id !== newRow.id);
        }
        const exists = currentClaims.some((claim) => claim.id === newRow.id);
        if (exists) {
          return currentClaims.map((claim) => 
            claim.id === newRow.id ? { ...claim, ...newRow } : claim
          );
        } else {
          return [newRow, ...currentClaims];
        }
      }
      if (eventType === "DELETE") {
        return currentClaims.filter((claim) => claim.id !== oldRow.id);
      }
      return currentClaims;
    });
  };

  // Fetch cross-table matrix lines by triggering Edge Function on link item click selection
  const handleRowSelectionClick = async (claim) => {
    setSelectedClaim(claim);
    setModalLoading(true);
    setAssociatedDrugs([]);
    try {
      const { data, error } = await supabase.functions.invoke("NhiaClaimsProcessed", {
        body: { action: "fetch_details", hcpCode: facilityCode, refId: claim.refid }
      });
      if (error || (data && data.error)) {
        throw new Error(error?.message || data?.error);
      }
      setAssociatedDrugs(data.data || []);
    } catch (err) {
      console.error("Edge Routing Hydration Error:", err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Pagination Calculation Subroutines
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = claims.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(claims.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

 
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      {/* Module Workspace Header Banner */}
      <header className="w-full bg-slate-900 text-white px-6 py-8 shadow-md relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -top-20 -left-10 pointer-events-none"></div>
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 tracking-widest uppercase mb-2">
              <Link to="/nhia-dashboard" className="hover:text-blue-300 transition-colors no-underline flex items-center gap-1">
                <i className="bi bi-arrow-left"></i> Hub Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">Claims Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase m-0">Claims Processing Terminal</h1>
            <p className="text-sm text-slate-400 mt-2 m-0 max-w-xl">
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 md:text-right min-w-[240px] shadow-inner backdrop-blur-sm">
            <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">Active Provider Node</span>
            <span className="block text-sm font-bold text-slate-100 uppercase truncate max-w-[260px]">{facilityName}</span>
            <span className="inline-block text-[11px] font-mono font-bold text-blue-400 border border-blue-500/20 bg-blue-500/5 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
              ID: {facilityCode}
            </span>
          </div>
        </div>
      </header>

      {/* Primary Feature Workspace Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse relative">
              <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></span>
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest m-0">Processed Claims Ledger</h3>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 px-3 py-1 rounded-xl shadow-inner uppercase tracking-wider">
            Total Pipeline: {claims.length} Records
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-xs font-mono font-bold text-slate-400 tracking-wider">
            Assembling claims archive sub-pipelines...
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center max-w-lg mx-auto mt-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Encounter Queue Empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              No claims matching the "Processed" tracking criteria are currently indexed under this facility node identification marker.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Submission Date</th>
                      <th className="p-4">Reference Token ID</th>
                      <th className="p-4">Enrollee Designation</th>
                      <th className="p-4">NHIA Registry Key</th>
                      <th className="p-4">Auth Code</th>
                      <th className="p-4 pr-6 text-center">Status Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentRows.map((claim) => (
                      <tr 
                        key={claim.id} 
                        onClick={() => handleRowSelectionClick(claim)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-all group duration-150"
                      >
                        <td className="p-4 pl-6 font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                          {new Date(claim.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                          <span className="inline-flex items-center gap-1 group-hover:underline">
                            {claim.refid} <i className="bi bi-box-arrow-up-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{claim.enrolleename}</td>
                        <td className="p-4 font-mono text-slate-600">{claim.nhianumber}</td>
                        <td className="p-4 font-mono">
                          {claim.authcode ? (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">{claim.authcode}</span>
                          ) : (
                            <span className="text-slate-300 italic font-normal">N/A</span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <span className="inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-600/5">
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Showing <strong className="text-slate-800">{indexOfFirstRow + 1}</strong> to <strong className="text-slate-800">{Math.min(indexOfLastRow, claims.length)}</strong> of <strong className="text-slate-800">{claims.length}</strong> entries
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePageChange(currentPage - 1); }}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={(e) => { e.stopPropagation(); handlePageChange(page); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? "bg-slate-900 text-white border border-slate-900"
                            : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePageChange(currentPage + 1); }}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Inspector Overlay Portal View */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Claim Portfolio Audit File</h4>
                <p className="text-[11px] font-mono text-slate-400 mt-1 m-0">Ref ID: {selectedClaim.refid}</p>
              </div>
              <button 
                onClick={() => setSelectedClaim(null)}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 shadow-sm flex items-center justify-center font-bold hover:bg-slate-50 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Enrollee Name</span>
                  <span className="text-xs font-black text-slate-800">{selectedClaim.enrolleename}</span>
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">NHIA Registry Number</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{selectedClaim.nhianumber}</span>
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Authorization Code</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{selectedClaim.authcode || "N/A"}</span>
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Hospital Provider</span>
                  <span className="text-xs font-bold text-slate-800 truncate">{facilityName}</span>
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">HCP Alpha Identifier Code</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{selectedClaim.hcpcode}</span>
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Verification Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border rounded-lg bg-emerald-50 text-emerald-700 border-emerald-200">
                    {selectedClaim.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Associated Prescriptions & Drug Lines</h5>
                {modalLoading ? (
                  <div className="py-12 text-center text-xs font-mono font-bold text-slate-400 tracking-wider bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
                    Hydrating linked prescription datasets...
                  </div>
                ) : associatedDrugs.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-400">
                    No related item rows mapped to this reference code inside database schemas.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3 pl-4 text-left">Item Designation Summary Description</th>
                          <th className="p-3 text-center">Quantity</th>
                          <th className="p-3 text-center">Period</th>
                          <th className="p-3 text-right">Unit Rate</th>
                          <th className="p-3 pr-4 text-right">Total Aggregate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {associatedDrugs.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 font-sans font-semibold text-slate-800">
                              {item.itemname || item.drugname || item.description}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">{item.quantity}</td>
                            <td className="p-3 text-center font-bold text-slate-600">{item.period}</td>
                            <td className="p-3 text-right">₦{(item.price || 0).toLocaleString()}</td>
                            <td className="p-3 pr-4 text-right font-bold text-slate-900">
                              ₦{((item.quantity || 1) * (item.price || 0)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-sans text-xs border-t-2 border-slate-800">
                          <td colSpan="4" className="p-3.5 pl-4 font-bold uppercase tracking-wider text-[10px]">
                            Grand Total Portfolio Claim Value
                          </td>
                          <td className="p-3.5 pr-4 text-right font-mono font-black text-blue-400 text-sm">
                            ₦{associatedDrugs.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
