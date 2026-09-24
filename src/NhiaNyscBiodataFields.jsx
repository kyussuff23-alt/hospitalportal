import React from "react";

export default function NhiaNyscBiodataFields({ biodata, setBiodata, hospitalName, hcpCode }) {
  const updateField = (e) => {
    setBiodata({ ...biodata, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-5">
      <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
        <i className="bi bi-person-lines-fill text-sm"></i> 1. Enrollee Demographics Profile
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        {/* Full Name Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Name <span className="text-red-500">*</span></label>
          <input
            name="enrolleename"
            type="text"
            required
            value={biodata.enrolleename}
            onChange={(e) => {
              // Strip numbers/symbols, leave only letters/spaces, and convert to uppercase
              e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase();
              updateField(e);
            }}
            placeholder="CORPS MEMBER NAME"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors uppercase"
          />
        </div>


        {/* Gender Selection Menu */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Gender Option <span className="text-red-500">*</span></label>
          <select
            name="gender"
            required
            value={biodata.gender}
            onChange={updateField}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="">-- Choose Option --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
{/* Mandatory NHIA ID string (Format: Numbers, a dash, and a single trailing suffix digit) */}
<div>
  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">NHIA Number <span className="text-red-500">*</span></label>
  <input
    name="nhiaNumber"
    type="text"
    required
    value={biodata.nhiaNumber}
    placeholder="e.g. 12345678-0"
    onChange={(e) => {
      // Allows numbers and a single optional tracking dash
      const clean = e.target.value.replace(/[^0-9-]/g, "");
      setBiodata({ ...biodata, nhiaNumber: clean });
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
  />
</div>

{/* Call Up Code input string (Format: NYSC/TEXT/NUMBER/NUMBER) */}
{/* Call Up Code input string */}
<div>
  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Call-Up Code <span className="text-red-500">*</span></label>
  <input
    name="callUpNumber"
    type="text"
    required
    value={biodata.callUpNumber}
    placeholder="NYSC/XYZ/2026/0192"
    onChange={(e) => {
      let inputVal = e.target.value.toUpperCase();
      
      // Force it to always start with NYSC/
      if (!inputVal.startsWith("NYSC/")) {
        inputVal = "NYSC/" + inputVal.replace(/^NYSC\/?/i, "");
      }
      
      // Strip out illegal characters, keeping only letters, numbers, and slashes
      const clean = inputVal.replace(/[^A-Z0-9/]/g, "");
      setBiodata({ ...biodata, callUpNumber: clean });
    }}
    onKeyDown={(e) => {
      // Prevent deleting the required 'NYSC/' prefix using backspace
      if (e.key === "Backspace" && e.target.value.length <= 5) {
        e.preventDefault();
      }
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
  />
</div>

{/* State Code identifier parameters (Format: TEXT/TEXT/NUMBER or TEXT/NUMBER/NUMBER like LA/26A/4081) */}
<div>
  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">State Code <span className="text-red-500">*</span></label>
  <input
    name="stateCode"
    type="text"
    required
    value={biodata.stateCode}
    placeholder="e.g. LA/26A/4081"
    onChange={(e) => {
      const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9/]/g, "");
      setBiodata({ ...biodata, stateCode: clean });
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
  />
</div>

{/* National NIN key entry (Strictly 11 digits maximum, numbers only) */}
<div>
  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">NIN <span className="text-red-500">*</span></label>
  <input
    name="nin"
    type="text"
    required
    maxLength={11}
    value={biodata.nin}
    placeholder="e.g. 11 DIGIT NUMBER"
    onChange={(e) => {
      // Strip everything except pure digits
      const clean = e.target.value.replace(/[^0-9]/g, "");
      setBiodata({ ...biodata, nin: clean });
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
  />
</div>

        {/* Deployment Batch Selection choice */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Service Batch <span className="text-red-500">*</span></label>
          <select
            name="batch"
            required
            value={biodata.batch}
            onChange={updateField}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="">-- Choose Batch --</option>
            <option value="Batch A">Batch A</option>
            <option value="Batch B">Batch B</option>
            <option value="Batch C">Batch C</option>
            <option value="Batch D">Batch D</option>
            <option value="Batch E">Batch E</option>


          </select>
        </div>

        {/* Stream deployment layout options */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Stream Node Layer <span className="text-red-500">*</span></label>
          <select
            name="stream"
            required
            value={biodata.stream}
            onChange={updateField}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="">-- Choose Stream --</option>
            <option value="Stream I">Stream 1</option>
            <option value="Stream II">Stream 2</option>
            <option value="Stream III">Stream 3</option>
            <option value="Stream IV">Stream 4</option>


          </select>
        </div>

        {/* Optional contact line phone details */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Contact Line <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input
            name="phoneNumber"
            type="tel"
            value={biodata.phoneNumber}
            onChange={updateField}
            placeholder="e.g. 0803XXXXXXX"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Prefilled Locked Institutional Context Indicators */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Provider Node</label>
          <input type="text" disabled value={hospitalName} className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-sm font-semibold uppercase truncate" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Node HCP Identifier</label>
          <input type="text" disabled value={hcpCode} className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-sm font-mono font-bold" />
        </div>
      </div>

      {/* Clinical diagnosis multi-line text input parameters */}
<div className="pt-2">
  <div className="flex justify-between items-center mb-2">
    <label className="block text-xs font-bold text-slate-700 uppercase">
      Primary Clinical Diagnosis <span className="text-red-500">*</span>
    </label>
    <span className={`text-[10px] font-mono font-bold ${(biodata.diagnosis?.length || 0) >= 450 ? 'text-red-500' : 'text-slate-400'}`}>
      {(biodata.diagnosis?.length || 0)} / 500 Chars
    </span>
  </div>
  
  <textarea
    name="diagnosis"
    rows="3"
    required
    maxLength={500}
    value={biodata.diagnosis}
    placeholder="State clear, comprehensive clinical diagnostic indicators..."
    onChange={(e) => {
      // 🛡️ INJECTION SANITATION REJECTION
      // Strips structural SQL control operators: backticks, single quotes, double quotes, semicolons, and angle brackets
      const clean = e.target.value.replace(/['"`<>;]/g, "");
      setBiodata({ ...biodata, diagnosis: clean });
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-y min-h-[80px]"
  ></textarea>
</div>
    </div>
  );
}
