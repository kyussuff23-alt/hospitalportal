import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./RequestCode.css";
import EnrolleeSearch from "./EnrolleeSearch";

export default function RequestCode({ hcpCode, hospitalName }) {
  const [enrolleename, setEnrolleename] = useState("");
  const [policyid, setPolicyid] = useState("");
  const [client, setClient] = useState("");
  const [plan, setPlan] = useState("");
  const [gender, setGender] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);


  // Service search states
  const [serviceQuery, setServiceQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Dynamic row fields
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [period, setPeriod] = useState("");
  const [total, setTotal] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");


  const navigate = useNavigate();

  // Auto‑clear alert after 10 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Auto‑calculate total when price/qty/period change
  useEffect(() => {
    const p = parseFloat(price) || 0;
    const q = parseFloat(qty) || 0;
    const per = parseFloat(period) || 1;
    setTotal(p * q * per);
  }, [price, qty, period]);

  const handleEnrolleeSelect = (step) => {
    setEnrolleename(step.enrolleename);
    setPolicyid(step.policyid);
    setClient(step.client);   
    setPlan(step.plan);
    setGender(step.gender);
    setPhonenumber(step.phonenumber); 
  };


// ⚡ STEP B: Generate the key only ONCE when the form component mounts on screen
useEffect(() => {
  setIdempotencyKey(crypto.randomUUID());
}, []);

// ⚡ STEP C: Your fully protected, explicit handleSubmit function
const handleSubmit = async (e) => { 
  e.preventDefault(); 
  
  if (submitting) return; // 🚫 prevent double clicks 
  setSubmitting(true); 

  // Validation: ensure all required fields are filled (Kept exactly as you wrote it) 
  if (!enrolleename || !policyid || !client || !plan || !gender || !diagnosis || !phonenumber || selectedServices.length === 0) { 
    setAlert({ message: "Please fill in all required fields before submitting.", type: "danger" }); 
    setSubmitting(false); 
    return; 
  } 

  // Format your services array properties into a structured payload for the database JSON loop 
  const servicesPayload = selectedServices.map(item => ({ 
    itemname: item.itemname, 
    price: Number(item.price) || 0, 
    qty: Math.floor(Number(item.qty)) || 0, // Matches your table's integer type period 
    period: Math.floor(Number(item.period)) || 0, // Matches your table's integer type period 
    total: Number(item.total) || 0 
  })); 

  // Execute your custom database transaction function via RPC 
  try { 
    const { error: submitError } = await supabase.rpc("submit_authorization_request", { 
      p_enrolleename: enrolleename, 
      p_policyid: policyid, 
      p_client: client, 
      p_plan: plan, 
      p_gender: gender, 
      p_diagnosis: diagnosis, 
      p_phonenumber: phonenumber, 
      p_hcpcode: hcpCode, 
      p_hospname: hospitalName, 
      p_services_json: servicesPayload, // Passes the array block to be unpacked safely by Postgres 
      p_idempotency_key: idempotencyKey   // 🔒 NEW: Passes the session key into the transaction loop
    }); 

    if (submitError) { 
      console.error("Submission Transaction Error:", submitError.message); 
      
      // 🔒 IDEMPOTENCY CHECK: Postgres code '23505' means unique constraint violation.
      // If a network lag caused a duplicate packet to submit, catch it here cleanly.
      if (submitError.code === "23505") {
        console.warn("Duplicate request intercepted and discarded securely.");
        // Redirect them safely anyway because the first attempt successfully wrote to the DB
        navigate("/dashboard");
        return;
      }

      setAlert({ message: "Failed to send request ensure all fields are filled. Try again.", type: "danger" }); 
      setSubmitting(false);
      return; 
    } 

    // Reset state matching your exact variables layout 
    setEnrolleename(""); 
    setPolicyid(""); 
    setClient(""); 
    setPlan(""); 
    setGender(""); 
    setDiagnosis(""); 
    setSelectedServices([]); 

    // Redirect after short delay 
    setTimeout(() => { 
      setSubmitting(false); 
      navigate("/dashboard"); 
    }, 2000); 

  } catch (err) { 
    setAlert({ message: "Network error. Please try again.", type: "danger" }); 
    setSubmitting(false); 
  } 
};






  // Search services table
  // 1. Keep this handler simple: it only updates what the user types instantly
const handleServiceSearch = (query) => {
  setServiceQuery(query);
};

// 2. Add this Debounce Effect right below your handler to protect the DB
// This block still executes cleanly only after the user stops typing for 300ms
useEffect(() => {
  const delayDebounce = setTimeout(async () => {
    const normalizedQuery = serviceQuery.trim();
    const normalizedCode = hcpCode ? hcpCode.trim() : "";

    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    // Call the database function via RPC matching column schemas
    const { data, error } = await supabase.rpc("search_hospital_tariff", {
      search_query: normalizedQuery,
      hcp_code: normalizedCode
    });

    if (error) {
      console.error("Database RPC Error:", error.message);
      setSearchResults([]);
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  }, 300); // 300ms delay window

  return () => clearTimeout(delayDebounce);
}, [serviceQuery, hcpCode]);

// 3. Your selection handler aligned with your drugsrequest lowercase schema
const handleSelectService = (item) => {
  setSelectedServices([
    ...selectedServices,
    {
      // Explicitly preserves your database lowercase column structure
      itemname: item.itemname || "", 
      price: Number(item.price) || 0,
      qty: 1,
      period: 1,
      total: Number(item.price) || 0
    }
  ]);
  setSearchResults([]);
  setServiceQuery("");
};


  const updateService = (index, field, value) => {
    const updated = [...selectedServices];
    updated[index][field] = value;
    const p = parseFloat(updated[index].price) || 0;
    const q = parseFloat(updated[index].qty) || 0;
    const per = parseFloat(updated[index].period) || 1;
    updated[index].total = p * q * per;
    setSelectedServices(updated);
  };

  const removeService = (index) => {
    const updated = selectedServices.filter((_, i) => i !== index);
    setSelectedServices(updated);
  };
  return (
    <div className="page-wrapper container-fluid py-4 bg-light min-vh-100" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="form-card mx-auto bg-white p-4 p-md-5 shadow-sm rounded-3 border-0" style={{ maxWidth: "900px" }}>
        
        {/* Real-time Validation Action Feedback Alerts Layout */}
        {alert && (
          <div className={`alert alert-${alert.type} border-0 border-start border-4 border-${alert.type} py-2.5 px-4 small bg-${alert.type}-subtle mb-4 text-start fw-medium`} role="alert">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${alert.type === "success" ? "bi-check-circle-fill text-success" : "bi-exclamation-triangle-fill text-danger"}`}></i>
              <span>{alert.message}</span>
            </div>
          </div>
        )}

<form onSubmit={handleSubmit} className="text-start"> 
  {/* Header Banner Ribbon Block */} 
  <div className="form-header bg-dark text-white p-3 rounded-3 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"> 
    <h6 className="m-0 fw-bold font-monospace"> 
      <i className="bi bi-file-earmark-plus-fill text-primary me-2"></i> Authorization Request Intake Form 
    </h6> 
    <span className="small text-muted font-monospace bg-black bg-opacity-25 px-2 py-0.5 rounded border border-secondary border-opacity-25"> 
      HCP: <strong className="text-white">{hcpCode}</strong> | {hospitalName} 
    </span> 
  </div> 

  {/* Enrollee Directory Live Picker Engine */} 
  <div className="search-bar mb-4 p-3 bg-light rounded-3 border border-light-subtle"> 
    <label className="form-label small fw-bold text-secondary mb-2"><i className="bi bi-person-search me-1"></i> Patient Directory Quick Search Picker</label> 
    <EnrolleeSearch hospitalName={hospitalName} onSelect={handleEnrolleeSelect} /> 
  </div> 

  {/* Biometric Avatar Placeholder Visual Anchor */} 
  <div className="avatar-section d-flex justify-content-center mb-4"> 
    <div className="avatar-placeholder bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary border shadow-inner" style={{ width: "70px", height: "70px" }}> 
      <i className="bi bi-person-circle fs-2"></i> 
    </div> 
  </div> 

  {/* PATIENT BIODATA CORE FIELD GRID SET */} 
  <div className="card border-0 bg-light p-4 rounded-3 border border-light-subtle mb-4"> 
    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2"> 
      <i className="bi bi-person-lines-fill fs-5"></i> Inspected Member Benefit Details 
    </h6> 
    <div className="row g-3"> 
      <div className="col-12"> 
        <label className="form-label small fw-bold text-secondary mb-1">Enrollee Patient Full Name</label> 
        <input type="text" value={enrolleename} readOnly className="form-control bg-white shadow-none font-medium text-dark border-light-subtle" placeholder="Awaiting profile selection from directory lookup above..." /> 
      </div> 
      <div className="col-md-6"> 
        <label className="form-label small fw-bold text-secondary mb-1">Policy ID Code</label> 
        <input type="text" value={policyid} readOnly className="form-control bg-white shadow-none font-monospace border-light-subtle text-secondary fw-semibold" placeholder="-" /> 
      </div> 
      <div className="col-md-6"> 
        <label className="form-label small fw-bold text-secondary mb-1">Corporate Client Organization</label> 
        <input type="text" value={client} readOnly className="form-control bg-white shadow-none border-light-subtle text-dark" placeholder="-" /> 
      </div> 
      <div className="col-md-6"> 
        <label className="form-label small fw-bold text-secondary mb-1">Active Coverage Insurance Plan</label> 
        <input type="text" value={plan} readOnly className="form-control bg-white shadow-none text-primary fw-bold border-light-subtle" placeholder="-" /> </div> 
      <div className="col-md-6"> 
        <label className="form-label small fw-bold text-secondary mb-1">Gender Scope</label> 
        <input type="text" value={gender} readOnly className="form-control bg-white shadow-none border-light-subtle text-center" placeholder="-" /> 
      </div> 
      <div className="col-12"> 
        <label className="form-label small fw-bold text-secondary mb-1">Verification Phone Number Address</label> 
        <div className="input-group"> 
          <span className="input-group-text bg-white border-end-0 border-light-subtle text-muted"><i className="bi bi-telephone"></i></span> 
          <input type="text" value={phonenumber} onChange={(e) => setPhonenumber(e.target.value)} className="form-control border-start-0 shadow-none text-dark fw-semibold" placeholder="+234..." /> 
        </div> 
      </div> 
    </div> 
  </div> 

  {/* Clinical Case Diagnosis Narrative */} 
  <div className="form-group mb-4"> 
    <label className="form-label small fw-bold text-secondary mb-1">Clinical Diagnosis Narrative</label> 
    <textarea rows="2" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required className="form-control border-light-subtle shadow-none text-dark-emphasis small" placeholder="State clear, comprehensive clinical diagnostic indicators..." ></textarea> 
  </div>
  {/* Medical Service Tariff Search Core Engine */} 
  <div className="form-group mb-4 position-relative"> 
    <label className="form-label small fw-bold text-secondary mb-1">Search Hospital Contract Tariff Catalogue</label> 
    <div className="input-group shadow-sm rounded-2 overflow-hidden"> 
      <span className="input-group-text bg-white border-end-0 border-light-subtle text-muted"> <i className="bi bi-search"></i> </span> 
      <input type="text" className="form-control border-start-0 shadow-none border-light-subtle py-2" placeholder="Type item names or formulation codes to search contract price lists..." value={serviceQuery} onChange={(e) => handleServiceSearch(e.target.value)} /> 
      {loading && ( 
        <span className="input-group-text bg-white border-start-0 border-light-subtle text-primary"> 
          <span className="spinner-border spinner-border-sm" role="status"></span> 
        </span> 
      )} 
    </div> 

    {/* Live Popover Auto-Suggest Search Results Drawer */} 
    {searchResults.length > 0 && ( 
      <ul className="list-group position-absolute w-100 mt-1 border-light-subtle shadow-lg rounded-3" style={{ zIndex: 1060 }}> 
        {searchResults.map((item) => ( 
          <li key={item.id} className="list-group-item list-group-item-action text-start small py-2.5 text-dark fw-medium" style={{ cursor: "pointer" }} onClick={() => handleSelectService(item)} > 
            <i className="bi bi-plus-circle-fill text-success me-2"></i> {item.itemname} 
            <span className="badge bg-light text-secondary border font-monospace ms-2 float-end"> ₦{Number(item.price).toLocaleString("en-NG")} </span> 
          </li> 
        ))} 
      </ul> 
    )} 
  </div> 

  {/* Selected Services Itemized Modification Ledger Grid Table */} 
  {selectedServices.length > 0 && ( 
    <div className="mb-4"> 
      <h6 className="text-secondary fw-bold text-start mb-2 px-1 uppercase text-xs tracking-wider"> 
        <i className="bi bi-list-check text-primary me-1"></i> Requested Items Breakdown Matrix 
      </h6> 
      <div className="card border-0 shadow-sm overflow-hidden bg-white border border-light-subtle rounded-3"> 
        <div className="table-responsive"> 
          <table className="table table-hover align-middle mb-0 text-nowrap small"> 
            <thead className="table-dark text-uppercase text-xs fw-bold"> 
              <tr> 
                <th className="py-3 px-3" style={{ width: "35%" }}>Prescription Item / Medical Service</th> 
                <th className="py-3 text-end" style={{ width: "15%" }}>Tariff Price</th> 
                <th className="py-3 text-center" style={{ width: "10%" }}>Qty</th> 
                <th className="py-3 text-center" style={{ width: "15%" }}>Days/Period</th> 
                <th className="py-3 text-end" style={{ width: "20%" }}>Aggregate Net</th> 
                <th className="py-3 text-center" style={{ width: "5%" }}>Action</th> 
              </tr> 
            </thead> 
            <tbody> 
              {selectedServices.map((service, index) => ( 
                <tr key={index} className="border-bottom border-light-subtle text-start"> 
                  <td className="px-3 fw-semibold text-dark text-wrap" style={{ maxWidth: "220px" }}>{service.itemname}</td> 
                  <td> 
                    <input type="number" className="form-control form-control-sm text-end font-monospace border-light-subtle shadow-none shadow-sm rounded" value={service.price} onChange={(e) => updateService(index, "price", e.target.value)} /> 
                  </td> 
                  <td> 
                    <input type="number" className="form-control form-control-sm text-center font-monospace border-light-subtle shadow-none shadow-sm rounded" value={service.qty} onChange={(e) => updateService(index, "qty", e.target.value)} /> 
                  </td> 
                  <td> 
                    <input type="number" className="form-control form-control-sm text-center font-monospace border-light-subtle shadow-none shadow-sm rounded" value={service.period} onChange={(e) => updateService(index, "period", e.target.value)} /> 
                  </td> 
                  <td className="text-end font-monospace fw-bold text-primary"> ₦{Number(service.total).toLocaleString("en-NG", { minimumFractionDigits: 2 })} </td> 
                  <td className="text-center px-3"> 
                    <button type="button" className="btn btn-outline-danger btn-sm border-transparent py-0.5 px-2 rounded-2" onClick={() => removeService(index)} > 
                      <i className="bi bi-trash3-fill"></i> 
                    </button> 
                  </td> 
                </tr> 
              ))} 
              {/* Live Grand Total Computation Accumulator Indicator Row */} 
              <tr className="table-light fw-bold"> 
                <td colSpan="4" className="text-end py-3 px-3 text-secondary uppercase text-xs tracking-wider">Estimated Encounter Request Net:</td> 
                <td colSpan="2" className="text-end pe-4 text-success font-monospace fs-6"> ₦{selectedServices.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })} </td> 
              </tr> 
            </tbody> 
          </table> 
        </div> 
      </div> 
    </div> 
  )} 

  {/* Form Action Controls Section */} 
  <div className="form-actions d-flex flex-sm-row justify-content-between align-items-center mt-5 gap-3 border-top pt-4"> 
    <button type="button" className="btn btn-outline-secondary fw-bold px-4 py-2 order-2 order-sm-1" 
    disabled={submitting} // prevent cancel while submitting
    onClick={() => navigate("/dashboard")} > Cancel Request </button> 
    
    <button 
    type="submit" 
    className="btn btn-primary bg-gradient fw-extrabold px-5 py-2 order-1 order-sm-2 shadow-sm" 
    disabled={submitting || selectedServices.length === 0} 
  > 
    {submitting ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Submitting…
      </>
    ) : (
      <>
        <i className="bi bi-send-fill me-2"></i> Submit Request Portfolio
      </>
    )}
  </button> 
 
  </div> 
</form>

      </div>
    </div>
  );
}

/* useEffect(() => {
  const delayDebounce = setTimeout(async () => {
    const normalizedQuery = serviceQuery.trim();
    const normalizedCode = hcpCode ? hcpCode.trim() : "";

    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    // Executes cleanly only after the user stops typing for 300ms
    const { data, error } = await supabase
      .from("hospital_tariff")
      .select("id, serviceid, itemname, price, hcpcode")
      .eq("hcpcode", normalizedCode)
      .is("effectiveto", null)
      .ilike("itemname", `%${normalizedQuery}%`)
      .limit(10);

    if (error) {
      console.error(error);
      setSearchResults([]);
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  }, 300); // 300ms delay window

  // Clean up the timer if the user types another character before 300ms is up
  return () => clearTimeout(delayDebounce);
}, [serviceQuery, hcpCode]);

// 3. Your selection handler stays exactly as you wrote it
const handleSelectService = (item) => {
  setSelectedServices([
    ...selectedServices, 
    { ...item, price: item.price || "", qty: 1, period: 1, total: item.price || 0 }
  ]);
  setSearchResults([]);
  setServiceQuery("");
}; 


const handleSubmit = async (e) => {
  e.preventDefault();
    if (submitting) return; // 🚫 prevent double clicks
  setSubmitting(true);

  // Validation: ensure all required fields are filled (Kept exactly as you wrote it)
  if (!enrolleename || !policyid || !client || !plan || !gender || !diagnosis || !phonenumber || selectedServices.length === 0) {
    setAlert({ message: "Please fill in all required fields before submitting.", type: "danger" });
     setSubmitting(false);
    return;
  }

  // Format your services array properties into a structured payload for the database JSON loop
  const servicesPayload = selectedServices.map(item => ({
    itemname: item.itemname,
    price: Number(item.price) || 0,
    qty: Math.floor(Number(item.qty)) || 0, // Matches your table's integer type period
    period: Math.floor(Number(item.period)) || 0, // Matches your table's integer type period
    total: Number(item.total) || 0
  }));

  // Execute your custom database transaction function via RPC
 try {
 
  const { error: submitError } = await supabase.rpc("submit_authorization_request", {
    p_enrolleename: enrolleename,
    p_policyid: policyid,
    p_client: client,
    p_plan: plan,
    p_gender: gender,
    p_diagnosis: diagnosis,
    p_phonenumber: phonenumber,
    p_hcpcode: hcpCode,
    p_hospname: hospitalName,
    p_services_json: servicesPayload // Passes the array block to be unpacked safely by Postgres
  });

  if (submitError) {
    console.error("Submission Transaction Error:", submitError.message);
    setAlert({ message: "Failed to send request ensure all fields are filled. Try again.", type: "danger" });
    return;
  }



// Reset state matching your exact variables layout
  setEnrolleename("");
  setPolicyid("");
  setClient("");
  setPlan("");
  setGender("");
  setDiagnosis("");
  setSelectedServices([]);

  // Redirect after short delay
   setTimeout(() => {
      setSubmitting(false);
      navigate("/dashboard");
    }, 2000);
  } catch (err) {
    setAlert({ message: "Network error. Please try again.", type: "danger" });
    setSubmitting(false);
  }

};


DECLARE
    v_auth_id BIGINT;
BEGIN
    -- 1. Insert directly into public.authrequest following your exact column types
    INSERT INTO public.authrequest (
        enrolleename,
        policyid,
        client,
        plan,
        gender,
        diagnosis,
        phonenumber,
        hcpcode,
        hospname,
        status
    ) VALUES (
        p_enrolleename,
        p_policyid,
        p_client,
        p_plan,
        p_gender,
        p_diagnosis,
        p_phonenumber,
        p_hcpcode,
        p_hospname,
        'pending'::public.auth_status
    )
    RETURNING id INTO v_auth_id;

    -- 2. Insert child items directly into public.drugsrequest matching your exact column names
    INSERT INTO public.drugsrequest (
        authrequest_id,
        itemname,
        price,
        qty,
        period,
        total
    )
    SELECT 
        v_auth_id,
        (elem->>'itemname')::CHARACTER VARYING,
        (elem->>'price')::NUMERIC,
        (elem->>'qty')::INTEGER,
        (elem->>'period')::INTEGER,
        (elem->>'total')::NUMERIC
    FROM jsonb_array_elements(p_services_json) AS elem;
END;



*/