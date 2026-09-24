import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function NhiaReconciliation() {
  const [facilityName] = useState(localStorage.getItem("nhia_hospname") || "Accredited Facility");
  const [facilityCode] = useState(localStorage.getItem("nhia_hcpCode") || "NHIA-UNKNOWN");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <header className="w-full bg-slate-900 text-white px-6 py-8 shadow-md relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-amber-600/10 rounded-full blur-3xl -top-20 -left-10 pointer-events-none"></div>
        
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 tracking-widest uppercase mb-2">
              <Link to="/nhia-dashboard" className="hover:text-amber-300 transition-colors no-underline flex items-center gap-1">
                <i className="bi bi-arrow-left"></i> Hub Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">Reconciliation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase m-0">
              Capitation Reconciliation Ledger
            </h1>
            <p className="text-sm text-slate-400 mt-2 m-0 max-w-xl">
              Audit month-on-month operational capitation.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 md:text-right min-w-[240px] shadow-inner backdrop-blur-sm">
            <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">
              Active Provider Node
            </span>
            <span className="block text-sm font-bold text-slate-100 uppercase truncate max-w-[260px]">
              {facilityName}
            </span>
            <span className="inline-block text-[11px] font-mono font-bold text-amber-400 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
              ID: {facilityCode}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center max-w-lg mx-auto mt-8">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
            <i className="bi bi-arrow-left-right"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Audit Ledger Ready</h3>
          <p className="text-xs text-slate-500 leading-relaxed m-0">
            Welcome to the settlement alignment terminal. Review capitation registries, verify group adjustments, and extract reconciliation files safely.
          </p>
        </div>
      </main>
    </div>
  );
}
