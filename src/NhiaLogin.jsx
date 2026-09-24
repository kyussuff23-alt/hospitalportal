import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "./supabaseClient";



export default function NhiaLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ hcpCode: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);


 const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    // Send raw password over secure HTTPS network
    const { data, error } = await supabase.functions.invoke('nhia-auth', {
      body: { 
        hcpCode: formData.hcpCode, 
        password: formData.password 
      },
    });

    if (error) {
      alert("Server error");
      return;
    } 
    
    // Core fix: Supabase invoke might return stringified JSON depending on client version
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (result?.success) {
      // 1. Update the state management flag
      
      // 2. Core Fix: Persist institutional data into browser memory for Dashboard usage
     localStorage.setItem("nhia_isAuthenticated", "true");
  localStorage.setItem("nhia_hcpCode", result.hospital.nhiacode);
  localStorage.setItem("nhia_hospname", result.hospital.hospname);
      
      // 3. Route to target component view
      navigate('/nhia-dashboard');
    } else {
      alert(result?.error || "Invalid credentials");
    }
  } catch (err) {
    alert("Unexpected error: " + err.message);
  } finally {
    setIsLoading(false);
  }
};




  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans overflow-x-hidden">
      
      {/* Embedded Core CSS Animation Matrix */}
      <style>{`
        @keyframes customFadeSlideIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes customPulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
        @keyframes textDance {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-0.5deg); }
          75% { transform: translateY(2px) rotate(0.5deg); }
        }
        .anim-fade-slide { animation: customFadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-dancing-headline { animation: textDance 3s ease-in-out infinite alternate; display: inline-block; }
        .anim-delay-1 { animation-delay: 0.15s; opacity: 0; }
        .anim-delay-2 { animation-delay: 0.3s; opacity: 0; }
        .anim-glow-loop-1 { animation: customPulseGlow 8s ease-in-out infinite; }
        .anim-glow-loop-2 { animation: customPulseGlow 12s ease-in-out infinite alternate; }
      `}</style>

      {/* LEFT COLUMN: Premium Dark Navy Value Proposition Panel */}
      <div 
        className="hidden md:flex md:w-1/2 p-12 flex-col justify-between text-white relative overflow-hidden border-r border-white/10"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" }}
      >
        {/* Animated background glow elements for premium tech aesthetic */}
        <div className="absolute rounded-circle anim-glow-loop-1 bg-blue-500/15 blur-[80px] w-[400px] h-[400px] -top-24 -left-24 pointer-events-none"></div>
        <div className="absolute rounded-circle anim-glow-loop-2 bg-emerald-500/10 blur-[60px] w-[300px] h-[300px] -bottom-12 -right-12 pointer-events-none"></div>

        {/* Top Branding Block */}
        <div className="relative z-10 flex items-center gap-3 anim-fade-slide">
          <div className="d-flex items-center justify-center bg-blue-600 rounded-3 shadow-sm w-10 h-10">
            <i className="bi bi-activity text-white fs-4"></i>
          </div>
          <div>
            <h1 className="fw-black m-0 h4 tracking-wider uppercase">
              SYNAEGIS<span className="text-blue-400 fw-medium text-[0.55em] align-super">®</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-300 opacity-75 mt-0.5">
              Claims Gateway Multi-Module System
            </p>
          </div>
        </div>

        {/* Center Informational Content & Value Pillars */}
        <div className="my-auto relative z-10 max-w-md space-y-6">
          <div className="anim-fade-slide anim-delay-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-semibold tracking-wider text-blue-400 uppercase mb-4">
              🏥 Accredited Providers Only
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white anim-dancing-headline">
              Secure Gateway for Healthcare Facilities
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mt-4">
              Access your National Health Insurance Authority provider dashboard. Manage encounter submissions, authorization codes, capitation data, and Claims Adjudication smoothly in one hub.
            </p>
          </div>

          {/* Value Pillars List */}
          <div className="flex flex-col gap-4 pt-2 anim-fade-slide anim-delay-2">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center w-7 h-7 mt-0.5">
                <i className="bi bi-check-lg font-bold text-sm"></i>
              </div>
              <div>
                <h6 className="m-0 font-semibold text-white text-sm">100% Automated Adjudication</h6>
                <p className="text-xs text-slate-400 m-0">Instantly approve claims on the go.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center w-7 h-7 mt-0.5">
                <i className="bi bi-check-lg font-bold text-sm"></i>
              </div>
              <div>
                <h6 className="m-0 font-semibold text-white text-sm">Real-Time Validation</h6>
                <p className="text-xs text-slate-400 m-0">Seamless Request-Approval of authorization.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Policy / Legal Notice */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-white/10 pt-6 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} SYNAEGIS. All rights reserved.</span>
          <button 
            onClick={() => navigate('/portal-guidelines')} 
            className="text-slate-300 hover:text-white underline transition-colors font-medium"
          >
            Want a DEMO ??
          </button>
        </div>
      </div>
      {/* RIGHT PANEL: Login Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        
        {/* Mobile Header (Hidden on Desktop - Matches Dark Navy Theme) */}
        <div className="w-full max-w-md md:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <i className="bi bi-activity text-white text-lg"></i>
          </div>
          <div>
            <h1 className="font-black tracking-wider text-base uppercase text-slate-900">SYNAEGIS</h1>
            <p className="font-bold tracking-wide uppercase text-[9px] text-blue-600">NHIA Provider Portal</p>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              NHIA Provider Login
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Please enter your unique HCP credentials below to verify identity.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            
            {/* HCP Code Input Group (With horizontal focus shift) */}
            <div className="transition-all duration-200 focus-within:translate-x-1">
              <label htmlFor="hcpCode" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                HCP Code (Provider ID)
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-10.5h16.5M2.25 13.5h19.5M4.5 19.5v-15a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0119.5 4.5v15" />
                  </svg>
                </div>
                <input
                  id="hcpCode"
                  name="hcpCode"
                  type="text"
                  required
                  value={formData.hcpCode}
                  onChange={handleChange}
                  placeholder="e.g., LA/0123/P"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Input Group (With horizontal focus shift) */}
            <div className="transition-all duration-200 focus-within:translate-x-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="text-xs">
                  <a href="#" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors underline-offset-2 hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit Button (Changed to Dark Slate Blue matching premium theme) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://w3.org" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign In to Portal'}
              </button>
            </div>
          </form>

          {/* Alternative Quick Path / Back Link */}
          <div className="text-center pt-4">
            <button 
              onClick={() => navigate("/login")} 
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Go Back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
