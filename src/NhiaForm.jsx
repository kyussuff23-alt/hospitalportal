import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import NhiaNyscItemsMatrix from "./NhiaNyscItemsMatrix"; // Reusing the identical shared matrix asset

export default function NhiaForm({ hospitalName, hcpCode }) {
  const navigate = useNavigate();
  const [refId, setRefId] = useState("");
  
  // Aligned identically with NhiaNyscForm's shared object mapping names
  const [biodata, setBiodata] = useState({
    enrolleename: "", 
    gender: "", 
    nin: "", 
    nhiaNumber: "",
    diagnosis: "",
     hospitalname: hospitalName, // Passed implicitly into the payload object
  hcpcode: hcpCode  
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Generate unique NHIA-specific identification prefix
  useEffect(() => {
    setRefId("NHIA-REF-" + crypto.randomUUID().substring(0, 8).toUpperCase());
  }, []);

  // Handle automatic alert timeouts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleClearForm = () => {
    setBiodata({ 
      enrolleename: "", 
      gender: "", 
      nin: "", 
      nhiaNumber: "", 
      diagnosis: "" ,
        hospitalname: hospitalName, // Keep persistent across clean sweeps
    hcpcode: hcpCode 
    });
    setSelectedItems([]);
    setRefId("NHIA-REF-" + crypto.randomUUID().substring(0, 8).toUpperCase());
    setAlert({ message: "Form workspace completely cleared and reset.", type: "success" });
  };

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const { enrolleename, gender, nin, nhiaNumber, diagnosis } = biodata;

    if (!enrolleename || !gender || !nhiaNumber || !diagnosis || selectedItems.length === 0) {
      setAlert({ message: "Please fill in all mandatory demographics fields and append at least one item before submission.", type: "danger" });
      return;
    }

    setSubmitting(true);

  
    try {
      // 1. First resolve the hcpCode variable from localStorage or parameters
      const localSession = JSON.parse(localStorage.getItem("hospital_session") || "{}");
      const activeHcpCode = localSession.hcpCode || hcpCode;

      // 2. Build the explicit payload safely referencing activeHcpCode
      const submissionPayload = {
        refId,
        biodata: {
          ...biodata,
          hospitalname: hospitalName,
          hcpcode: activeHcpCode
        },
        selectedItems,
        hospitalName,
        hcpCode: activeHcpCode
      };

      // 3. Fire the invoke action command
      const { data, error } = await supabase.functions.invoke('nhianysclogic', {
        body: submissionPayload
      });

      if (error || (data && data.error)) {
        const errorMsg = error?.message || data?.error;
        console.error("Edge function execution error:", errorMsg);
        setAlert({ message: `Submission failed: ${errorMsg}`, type: "danger" });
        setSubmitting(false);
        return;
      }

      setAlert({ message: "Claim transmitted and submitted successfully via Edge Network!", type: "success" });

      setBiodata({ 
        enrolleename: "", 
        gender: "", 
        nin: "", 
        nhiaNumber: "", 
        diagnosis: "",
        hospitalname: hospitalName,
        hcpcode: hcpCode
      });
      setSelectedItems([]);

      setTimeout(() => {
        setSubmitting(false);
        navigate("/nhia-dashboard");
      }, 2000);

    } catch (err) {
      console.error("Network routing abstraction crash:", err.message);
      setAlert({ message: "Network connection broken or timeout exceeded.", type: "danger" });
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-left animate-fade-in">
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${alert.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <i className={`bi ${alert.type === "success" ? "bi-check-circle-fill text-emerald-600" : "bi-exclamation-triangle-fill text-red-600"}`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-slate-800">
          <div>
            <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Relational Reference ID Token (Idempotency Lock)</span>
            <span className="font-mono text-sm font-black text-blue-400">{refId || "Generating Key..."}</span>
          </div>
          <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/50 font-mono">Standard NHIA Routing Entry</span>
        </div>

        {/* Modular Inline Demographics Definition Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Enrollee Full Name</label>
            <input 
              type="text" 
              placeholder="JOHN DOE" 
              value={biodata.enrolleename} 
              onChange={(e) => {
                // Strips out numbers/symbols, leaving only letters and spaces, then capitalizes
                const cleanText = e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase();
                setBiodata({ ...biodata, enrolleename: cleanText });
              }} 
              className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 transition-colors uppercase" 
            />
          </div>

        <div className="flex flex-col gap-1.5">
  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
    NHIA National Number <span className="text-red-500">*</span>
  </label>
  <input 
    type="text" 
    placeholder="e.g. 12345678-0" 
    value={biodata.nhiaNumber} 
    onChange={(e) => {
      // Allows only pure numbers and a single linking hyphen
      const clean = e.target.value.replace(/[^0-9-]/g, "");
      setBiodata({ ...biodata, nhiaNumber: clean });
    }} 
    className="border rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-slate-400 transition-colors" 
  />
</div>

<div className="flex flex-col gap-1.5">
  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
    National Identification Number (NIN) <span className="text-slate-400 font-normal text-[11px]">(OPTIONAL)</span>
  </label>
  <input 
    type="text" 
    maxLength={11}
    placeholder="E.G. 11 DIGIT NUMBER" 
    value={biodata.nin || ""} 
    onChange={(e) => {
      // Strips out everything except raw digits
      const clean = e.target.value.replace(/[^0-9]/g, "");
      setBiodata({ ...biodata, nin: clean });
    }} 
    className="border rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-slate-400 transition-colors" 
  />
</div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gender Orientation</label>
            <select value={biodata.gender} onChange={(e) => setBiodata({ ...biodata, gender: e.target.value })} className="border rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-slate-400 transition-colors">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
  <div className="flex justify-between items-center">
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
      Clinical Diagnosis & Clinical History Summary <span className="text-red-500">*</span>
    </label>
    <span className={`text-[10px] font-mono font-bold ${(biodata.diagnosis?.length || 0) >= 450 ? 'text-red-500' : 'text-slate-400'}`}>
      {(biodata.diagnosis?.length || 0)} / 500 Chars
    </span>
  </div>
  
  <textarea 
    name="diagnosis"
    required
    maxLength={500}
    rows={4}
    placeholder="Provide comprehensive details regarding observations, underlying symptoms, or definitive medical assessment notes..." 
    value={biodata.diagnosis} 
    onChange={(e) => {
      // 🛡️ REJECT INJECTION VECTORS
      // Dynamically strips raw structural database or shell formatting inputs safely: ` ' " < > ;
      const clean = e.target.value.replace(/['"`<>;]/g, "");
      setBiodata({ ...biodata, diagnosis: clean });
    }} 
    className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 transition-colors resize-y min-h-[100px]" 
  />
</div>

      
        </div>

        {/* Prefilled Institution Context Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submitting Facility</span>
            <span className="text-sm font-semibold text-slate-700">{hospitalName || "Not Connected"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HCP Code / NHIA Registry Key</span>
            <span className="text-sm font-mono font-bold text-slate-600">{hcpCode || "Unassigned"}</span>
          </div>
        </div>

        {/* Shared Matrix Processing Intermediary Component */}
        <NhiaNyscItemsMatrix refId={refId} hcpCode={hcpCode} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" disabled={submitting} onClick={handleClearForm} className="px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl tracking-wide uppercase transition-colors">
            Clear & Cancel Entry
          </button>
          
          <button
            type="submit"
            disabled={submitting || selectedItems.length === 0}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl tracking-widest uppercase transition-colors shadow-sm flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm animate-spin inline-block w-3 h-3 border-2 border-t-transparent border-white rounded-full"></span>
                Transmitting Requests Portfolio...
              </>
            ) : (
              <>
                Transmit Portfolio Request <i className="bi bi-send-check text-sm"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
