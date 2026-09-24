import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import NhiaClaimsLiveFeed from "./NhiaClaimsLiveFeed"; // Importing our real-time feed page component

export default function NhiaDashboard() {
  const navigate = useNavigate();
  const [hospitalInfo, setHospitalInfo] = useState({ hospname: "", hcpCode: "" });

  useEffect(() => {
    const authStatus = localStorage.getItem("nhia_isAuthenticated");
    const storedName = localStorage.getItem("nhia_hospname");
    const storedCode = localStorage.getItem("nhia_hcpCode");

    if (authStatus !== "true" || !storedName || !storedCode) {
      localStorage.removeItem("nhia_isAuthenticated");
      localStorage.removeItem("nhia_hospname");
      localStorage.removeItem("nhia_hcpCode");
      navigate("/nhia-login"); 
      return;
    }

    setHospitalInfo({ hospname: storedName, hcpCode: storedCode });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("nhia_isAuthenticated");
    localStorage.removeItem("nhia_hospname");
    localStorage.removeItem("nhia_hcpCode");
    navigate("/nhia-login");
  };

  const modules = [
    {
      title: "Claims",
      description: "Process medical encounters, track clinical submissions, and log e-adjudication batches.",
      icon: "bi-file-earmark-medical",
      colorClass: "text-blue-600 bg-blue-50 border-blue-100",
      hoverClass: "hover:border-blue-500 hover:shadow-blue-500/5",
      path: "/claims-hub" 
    },
    {
      title: "Authorisations",
      description: "Query real-time treatment validation codes and manage managed-care pre-approvals.",
      icon: "bi-shield-check",
      colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
      hoverClass: "hover:border-emerald-500 hover:shadow-emerald-500/5",
      path: "/authorizations" 
    },
    {
      title: "Reconciliation",
      description: "Audit core structural capitation registers, check variances, and download ledger files.",
      icon: "bi-arrow-left-right",
      colorClass: "text-amber-600 bg-amber-50 border-amber-100",
      hoverClass: "hover:border-amber-500 hover:shadow-amber-500/5",
      path: "/reconciliation" 
    },
    {
      title: "Payment Ledger",
      description: "Track cleared fee-for-service remittances, verify payment vouchers, and review adjustments.",
      icon: "bi-cash-stack",
      colorClass: "text-purple-600 bg-purple-50 border-purple-100",
      hoverClass: "hover:border-purple-500 hover:shadow-purple-500/5",
      path: "/payments" 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans antialiased">
      
      {/* LEFT SIDEBAR (Fixed structural navigation panel) */}
      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col md:sticky md:top-0 md:h-screen z-40 shadow-xl">
        
        {/* Branding Area */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="bi bi-activity text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-white font-black text-sm tracking-wider uppercase m-0">SYNAEGIS</h1>
              <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 m-0">NHIA Gateway</p>
            </div>
          </div>
          
          {/* Mobile Sign Out Button */}
          <button 
            type="button" 
            onClick={handleLogout} 
            className="md:hidden px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:text-red-400 transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Operational Modules</p>
          {modules.map((mod, index) => (
            <Link
              key={index}
              to={mod.path} 
              style={{ textDecoration: 'none' }}
              className="flex items-center gap-3.5 px-3 py-3 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${mod.colorClass}`}>
                <i className={`bi ${mod.icon}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold tracking-tight m-0">{mod.title}</p>
              </div>
              <i className="bi bi-chevron-right text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors"></i>
            </Link>
          ))}
        </nav>

        {/* Footer Facility Identity Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 hidden md:block">
          <div className="flex flex-col mb-4 px-2">
            <span className="text-xs font-bold text-slate-200 uppercase truncate">
              {hospitalInfo.hospname || "Loading..."}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              ID: {hospitalInfo.hcpCode || "---"}
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleLogout} 
            className="w-full px-3 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:text-red-400 hover:bg-slate-800/80 transition-all border border-slate-700/50"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT AREA */}
      <main className="flex-1 p-6 sm:p-10 max-w-[1600px] w-full mx-auto space-y-8">
        
        {/* Greeting Banner */}
        <div className="border-b border-slate-200/60 pb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-[10px] font-bold tracking-widest text-blue-700 uppercase mb-3.5">
            ⚡ Live Gateway Monitoring Active
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Welcome, {hospitalInfo.hospname || "Healthcare Facility"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Authorized Provider Console. Real-time diagnostic systems and core module routing profiles are initialized.
          </p>
        </div>

        {/* LIVE DATABASE FEED CONTAINER */}
        {hospitalInfo.hcpCode ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[450px]">
            {/* Injecting the encapsulated Live Feed component directly passing our local authentication state hooks */}
            <NhiaClaimsLiveFeed 
              hospitalName={hospitalInfo.hospname} 
              hcpCode={hospitalInfo.hcpCode} 
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-xs font-mono font-bold text-slate-400 animate-pulse">
            Verifying secure facility identification access tokens...
          </div>
        )}
      </main>
    </div>
  );
}
