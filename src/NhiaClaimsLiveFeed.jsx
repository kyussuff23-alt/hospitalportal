import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function NhiaClaimsLiveFeed({ hospitalName, hcpCode }) {
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
    if (!hcpCode) return;

    fetchInitialClaims();

    // Stand up a dedicated real-time listener channel for this hospital provider code
    const claimsChannel = supabase
      .channel(`live-feed-all-${hcpCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nhia_claims_biodata" },
        (payload) => {
          const currentRecord = payload.new?.id ? payload.new : payload.old;
          if (currentRecord && currentRecord.hcpcode === hcpCode) {
            handleRealtimeMutation(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(claimsChannel);
    };
  }, [hcpCode]);

  
   // Fetch initial data array by triggering Edge Function REST abstraction layer
  const fetchInitialClaims = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("nhiaclaimslivefeed", {
        body: { action: "fetch_all", hcpCode }
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

  // Pagination Calculation Subroutines
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = claims.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(claims.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  // Synchronize live mutations with client state vectors seamlessly
  const handleRealtimeMutation = (payload) => {
    const { eventType, new: newRow, old: oldRow } = payload;

    setClaims((currentClaims) => {
      if (eventType === "INSERT") {
        return [newRow, ...currentClaims];
      }

      if (eventType === "UPDATE") {
        return currentClaims.map((claim) => 
          claim.id === newRow.id ? { ...claim, ...newRow } : claim
        );
      }

      if (eventType === "DELETE") {
        return currentClaims.filter((claim) => claim.id !== oldRow.id);
      }

      return currentClaims;
    });
  };

  // Fetch linked drug inventory records on row link item click selection
    // Fetch cross-table matrix lines by triggering Edge Function REST abstraction layer
  const handleRowSelectionClick = async (claim) => {
    setSelectedClaim(claim);
    setModalLoading(true);
    setAssociatedDrugs([]);

    try {
      const { data, error } = await supabase.functions.invoke("nhiaclaimslivefeed", {
        body: { action: "fetch_details", hcpCode, refId: claim.refid }
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


  // Premium Custom Color System Separator
  const getStatusBadgeStyle = (status) => {
    const cleanStatus = status?.toLowerCase();
    if (cleanStatus === "processed" || cleanStatus === "approved") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-600/5";
    }
    if (cleanStatus === "denied") {
      return "bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-600/5";
    }
    return "bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-600/5";
  };
  
  
  
  return (
    <div className="w-full space-y-6">
      {/* Upper Data Feed Controls Head Section */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse relative">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
          </div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest m-0">Live Portal Ledger Stream</h3>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 px-3 py-1 rounded-xl shadow-inner uppercase tracking-wider">
          Feed Count: {claims.length} Records
        </span>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs font-mono font-bold text-slate-400 tracking-wider">
          Assembling real-time pipeline subscriptions...
        </div>
      ) : claims.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200/80 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-400">
          No records matching your facility code found inside active tracking loops.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden border border-slate-200/70 bg-white rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Submission Date</th>
                    <th className="p-4">Reference Token ID</th>
                    <th className="p-4">Enrollee Name</th>
                    <th className="p-4">NHIA Number</th>
                    <th className="p-4">Auth Code </th>
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
                          <span className="text-slate-300 italic font-normal">Pending Review</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <span className={`inline-block px-3 py-1 text-[9px] uppercase tracking-widest font-black rounded-full border ${getStatusBadgeStyle(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Premium Modular Pagination Interface Controller */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border border-slate-200/80 px-4 py-3 rounded-xl shadow-sm text-xs font-semibold text-slate-600">
              <span className="text-slate-400">
                Showing rows <span className="text-slate-700 font-bold">{indexOfFirstRow + 1}</span> to <span className="text-slate-700 font-bold">{Math.min(indexOfLastRow, claims.length)}</span> of <span className="text-slate-700 font-bold">{claims.length}</span>
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`h-7 w-7 rounded-lg transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Comprehensive Double-Table Case Inspection Modal Backdrop Overlay */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header section panel context controls */}
            <div className="p-6 bg-slate-900 text-slate-100 flex justify-between items-center border-b border-slate-800">
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Reference Node</span>
                <h3 className="font-mono text-sm font-black text-blue-400">{selectedClaim.refid}</h3>
              </div>
              <button 
                onClick={() => setSelectedClaim(null)} 
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold rounded-xl transition-colors border border-slate-700"
              >
                Close View
              </button>
            </div>

            {/* Scrollable multi-layered evaluation layout segment canvas */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-600">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Records </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Enrollee Name</span>
                    <span className="text-xs font-bold text-slate-800">{selectedClaim.enrolleename}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">NHIA Number</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedClaim.nhianumber}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Processing System Code</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedClaim.authcode || "N/A"}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 mt-2 border-t border-slate-200/60 pt-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Current Verification Status</span>
                    <span className={`inline-block mt-1 px-3 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-full border ${getStatusBadgeStyle(selectedClaim.status)}`}>
                      {selectedClaim.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Layer 2: Dependent Ingress Claims Materials Matrix List Items (From nhia_claims_drugs) */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Procedures & Drugs</h4>
                {modalLoading ? (
                  <div className="py-8 text-center text-xs font-mono font-bold text-slate-400">Assembling linked inventory array records...</div>
                ) : associatedDrugs.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl font-medium">
                    No prescription elements or items appended onto this entry portfolio payload.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
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
    {/* Dynamic Grand Total Calculation Footer Bar */}
    <tfoot>
      <tr className="bg-slate-900 text-white font-sans text-xs border-t-2 border-slate-800">
        {/* Changed colSpan from "3" to "4" to perfectly align the total under the 5th column */}
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
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wide uppercase">
                Active System Token: Verification Locked
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
