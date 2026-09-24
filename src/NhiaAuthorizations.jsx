import React, { useState } from "react";
import { Link } from "react-router-dom";
import NhiaNyscForm from "./NhiaNyscForm";
import NhiaForm from "./NhiaForm";

export default function NhiaAuthorizations() {
  const [facilityName] = useState(localStorage.getItem("nhia_hospname") || "Accredited Facility");
  const [facilityCode] = useState(localStorage.getItem("nhia_hcpCode") || "NHIA-UNKNOWN");
  
  // Clean tab switcher state ("NYSC" or "NHIA")
  const [activeTab, setActiveTab] = useState("NYSC");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <header className="w-full bg-slate-900 text-white px-6 py-8 shadow-md relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -top-20 -left-10 pointer-events-none"></div>
        
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 tracking-widest uppercase mb-2">
              <Link to="/nhia-dashboard" className="hover:text-emerald-300 transition-colors no-underline flex items-center gap-1 text-emerald-400">
                <i className="bi bi-arrow-left"></i> Hub Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">Authorisations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase m-0">
              Treatment Authorisations Matrix
            </h1>
            <p className="text-sm text-slate-400 mt-2 m-0 max-w-xl">
              Query real-time managed care pre-approval arrays and check voucher confirmation strings instantly.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 md:text-right min-w-[240px] shadow-inner backdrop-blur-sm">
            <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">
              Active Provider Node
            </span>
            <span className="block text-sm font-bold text-slate-100 uppercase truncate max-w-[260px]">
              {facilityName}
            </span>
            <span className="inline-block text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
              ID: {facilityCode}
            </span>
          </div>
        </div>
      </header>

      {/* Switchable Button Container Bar */}
      <div className="w-full bg-slate-100 border-b border-slate-200 py-4 flex justify-center sticky top-0 z-40">
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 w-full max-w-xs border border-slate-300/50">
          <button
            type="button"
            onClick={() => setActiveTab("NYSC")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border-0 transition-all ${
              activeTab === "NYSC"
                ? "bg-slate-900 text-white shadow"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            NYSC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NHIA")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border-0 transition-all ${
              activeTab === "NHIA"
                ? "bg-slate-900 text-white shadow"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            NHIA
          </button>
        </div>
      </div>

      {/* Main Workspace: Dynamically rendering sub-modules via passed parameters the hcpcode and hospname 
      got their info here */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10">
        {activeTab === "NYSC" ? (
          <NhiaNyscForm hospitalName={facilityName} hcpCode={facilityCode} />
        ) : (
          <NhiaForm hospitalName={facilityName} hcpCode={facilityCode} />
        )}
      </main>
    </div>
  );
}
