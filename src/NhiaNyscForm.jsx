import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import NhiaNyscBiodataFields from "./NhiaNyscBiodataFields";
import NhiaNyscItemsMatrix from "./NhiaNyscItemsMatrix";

export default function NhiaNyscForm({ hospitalName, hcpCode }) {
  const navigate = useNavigate();
  const [refId, setRefId] = useState("");
  
  // Bundling institutional parameters directly here to keep data models symmetric
  const [biodata, setBiodata] = useState({
    enrolleename: "", 
    gender: "", 
    nin: "", 
    nhiaNumber: "",
    callUpNumber: "", 
    stateCode: "", 
    batch: "", 
    stream: "",
    phoneNumber: "", 
    diagnosis: "",
    hospitalname: hospitalName, // Synchronized tracking properties
    hcpcode: hcpCode            // Synchronized tracking properties
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRefId("NYSC-REF-" + crypto.randomUUID().substring(0, 8).toUpperCase());
  }, []);

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
      callUpNumber: "", 
      stateCode: "", 
      batch: "", 
      stream: "", 
      phoneNumber: "", 
      diagnosis: "",
      hospitalname: hospitalName, // Kept safe and persistent during resets
      hcpcode: hcpCode 
    });
    setSelectedItems([]);
    setRefId("NYSC-REF-" + crypto.randomUUID().substring(0, 8).toUpperCase());
    setAlert({ message: "Form workspace completely cleared and reset.", type: "success" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const { enrolleename, gender, nhiaNumber, callUpNumber, stateCode, batch, stream, diagnosis } = biodata;

    if (!enrolleename || !gender || !nhiaNumber || !callUpNumber || !stateCode || !batch || !stream || !diagnosis || selectedItems.length === 0) {
      setAlert({ message: "Please fill in all mandatory demographics fields and append at least one item before submission.", type: "danger" });
      return;
    }


    // 1. NHIA Number structural pattern check
const nhiaRegex = /^\d+-\d$/; 
if (!nhiaRegex.test(biodata.nhiaNumber)) {
  setAlert({ message: "Invalid NHIA format. Must be formatted like 12345678-0", type: "danger" });
  return;
}

// 2. NIN Length verification check
if (biodata.nin.length !== 11) {
  setAlert({ message: "National Identification Number (NIN) must be exactly 11 digits.", type: "danger" });
  return;
}

// Validate NYSC Call-Up System String (Strictly: NYSC / ONLY LETTERS / 4-DIGIT YEAR / ONLY NUMBERS)
const callUpRegex = /^NYSC\/[A-Z]+\/\d{4}\/\d+$/;
if (!callUpRegex.test(callUpNumber)) {
  setAlert({ 
    message: "Format Error: Call-Up code rejected. System requires exact layout format: NYSC/LETTERS/YEAR/NUMBERS (e.g., NYSC/XYZ/2025/0192)", 
    type: "danger" 
  });
  return;
}

    const trimmedDiagnosis = diagnosis ? diagnosis.trim() : "";

    if (trimmedDiagnosis.length < 10) {
      setAlert({ message: "Validation Error: Diagnosis description is too short. Please provide comprehensive clinical notes.", type: "danger" });
      return;
    }

    if (trimmedDiagnosis.length > 500) {
      setAlert({ message: "Validation Error: Diagnosis notes must not exceed 500 characters.", type: "danger" });
      return;
    }

setSubmitting(true);

    try {
      const localSession = JSON.parse(localStorage.getItem("hospital_session") || "{}");
      const activeHcpCode = localSession.hcpCode || hcpCode;

      // Construct identical structural packaging as NhiaForm
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
        callUpNumber: "", 
        stateCode: "", 
        batch: "", 
        stream: "", 
        phoneNumber: "", 
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
          <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/50 font-mono">NYSC Core Routing Entry</span>
        </div>

        {/* Passing matched structural objects through subcomponents */}
        <NhiaNyscBiodataFields biodata={biodata} setBiodata={setBiodata} hospitalName={hospitalName} hcpCode={hcpCode} />
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
