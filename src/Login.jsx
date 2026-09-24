import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bcrypt from "bcryptjs";

function Login({ setIsAuthenticated, setHcpCode, setHospitalName }) {
  const [hcpCode, setHcpCodeLocal] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const navigate = useNavigate();

  // ✅ Utility hash generator (kept for background testing)
  useEffect(() => {
    async function generateHash() {
      const hash = await bcrypt.hash("TempPass123", 10);
      console.log("consuming", hash);
    }
    generateHash();
  }, []);

  // Auto-clear alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Step 1: Validate hospital via RPC (returns hospital name or "not_profiled")
    const { data: hospitalName, error: hospError } = await supabase.rpc("validate_hospital", {
      hcp: hcpCode
    });

    if (hospError || hospitalName === "not_profiled") {
      setAlert("Your input is invalid, contact NONSUCH for profiling 08078392043 nonsuchmedicare@gmail.com.");
      return;
    }

    setHospitalName(hospitalName);

    // Step 2: Fetch hospital profile via RPC (returns stored hash or "not_registered")
    const { data: storedHash, error: profileError } = await supabase.rpc("get_hospital_profile", {
      hcp: hcpCode
    });

    if (profileError || storedHash === "not_registered") {
      setAlert("Invalid HCP Code.");
      return;
    }

    // Step 3: Compare entered password with stored hash (bcrypt stays in frontend)
    const isMatch = await bcrypt.compare(password, storedHash);

    if (!isMatch) {
      setAlert("Password is incorrect, contact NONSUCH or try again.");
    } else {
      setAlert("");
      setIsAuthenticated(true);
      setHcpCode(hcpCode);

      // Persist session in localStorage with expiry
      const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hour
      localStorage.setItem("hcpCode", hcpCode);
      localStorage.setItem("hospitalName", hospitalName);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("expiryTime", expiryTime.toString());

      navigate("/dashboard");
    }
  };


  return (
    <div className="vh-100 d-flex flex-column flex-md-row" style={{ backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      
      {/* Dynamic Embedded CSS Core Animation Matrix */}
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
        .anim-fade-slide {
          animation: customFadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-dancing-headline {
          animation: textDance 3s ease-in-out infinite alternate;
          display: inline-block;
        }
        .anim-delay-1 { animation-delay: 0.15s; opacity: 0; }
        .anim-delay-2 { animation-delay: 0.3s; opacity: 0; }
        .anim-delay-3 { animation-delay: 0.45s; opacity: 0; }
        .anim-glow-loop-1 { animation: customPulseGlow 8s ease-in-out infinite; }
        .anim-glow-loop-2 { animation: customPulseGlow 12s ease-in-out infinite alternate; }
        .interactive-btn { transition: all 0.25s ease; }
        .interactive-btn:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25) !important; }
        .interactive-btn:active { transform: translateY(0); }
        .interactive-input { transition: all 0.2s ease; }
        .interactive-input:focus-within { transform: translateX(3px); }
      `}</style>
    {/* LEFT COLUMN: Premium Sales Pitch & Value Proposition Panel */}
<div className="col-md-6 col-lg-7 d-flex flex-column justify-content-between p-5 text-white position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
  {/* Animated background glow elements for premium tech aesthetic */}
  <div className="position-absolute rounded-circle anim-glow-loop-1" style={{ width: "400px", height: "400px", background: "rgba(59, 130, 246, 0.15)", filter: "blur(80px)", top: "-100px", left: "-100px" }}></div>
  <div className="position-absolute rounded-circle anim-glow-loop-2" style={{ width: "300px", height: "300px", background: "rgba(16, 185, 129, 0.1)", filter: "blur(60px)", bottom: "-50px", right: "-50px" }}></div>

  {/* Top Branding Block */}
  <div className="position-relative z-3 anim-fade-slide">
    <div className="d-flex align-items-center gap-3 mb-2">
      <div className="d-flex align-items-center justify-content-center bg-primary rounded-3 shadow-sm" style={{ width: "40px", height: "40px" }}>
        <i className="bi bi-activity text-white fs-4"></i>
      </div>
      <h1 className="fw-black m-0 h3 tracking-wider" style={{ letterSpacing: "2px" }}>
        SYNAEGIS<span className="text-primary fw-medium" style={{ fontSize: "0.55em", verticalAlign: "super" }}>®</span>
      </h1>
    </div>
    <p className="small text-uppercase fw-semibold tracking-widest opacity-75" style={{ letterSpacing: "1px", color: "#93c5fd" }}>
      Claims Gateway Multi-Module System
    </p>
  </div>

  {/* Core Marketing Pitch & ROI Copy */}
  <div className="my-auto position-relative z-3 py-4" style={{ maxWidth: "540px" }}>
    <div className="anim-fade-slide anim-delay-1">
      <span className="badge bg-primary bg-opacity-25 border border-primary border-opacity-50 px-3 py-2 rounded-pill small fw-semibold mb-3 text-uppercase" style={{ color: "#60a5fa" }}>
        ⚡ Next-Gen Healthcare Automation
      </span>
      <h2 className="display-6 fw-bold text-white mb-3 lh-sm anim-dancing-headline">
        Accelerate Claim Clearances from Days to Seconds.
      </h2>
      <p className="fs-6 mb-4 opacity-90" style={{ color: "#cbd5e1" }}>
        Eliminate traditional claim processing bottlenecks. Securely log in to verify provider profile, automate batch reconciliation, upload records & lots more.
      </p>
    </div>

    {/* Value Pillars List */}
    <div className="d-flex flex-column gap-3 mb-4 anim-fade-slide anim-delay-2">
      {/* Row 1 */}
      <div className="d-flex align-items-start gap-3">
        <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
          <i className="bi bi-check-lg fw-bold"></i>
        </div>
        <div>
          <h6 className="m-0 fw-semibold text-white">100% Automated Adjudication</h6>
          <p className="small m-0" style={{ color: "#94a3b8" }}>Instantly approve claims on the go.</p>
        </div>
      </div>

      {/* Row 2 */}
      <div className="d-flex align-items-start gap-3">
        <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
          <i className="bi bi-check-lg fw-bold"></i>
        </div>
        <div>
          <h6 className="m-0 fw-semibold text-white">Real-Time Validation</h6>
          <p className="small m-0" style={{ color: "#94a3b8" }}>Seamless Request-Approval of authorization.</p>
        </div>
      </div>

      {/* Row 3 */}
      <div className="d-flex align-items-start gap-3">
        <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
          <i className="bi bi-check-lg fw-bold"></i>
        </div>
        <div>
          <h6 className="m-0 fw-semibold text-white">Payment gateway integration</h6>
          <p className="small m-0" style={{ color: "#94a3b8" }}>Instant payment generation and advice.</p>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Trust Sign-off & Conversion CTA Hook */}
  <div className="position-relative z-3 border-top pt-3 anim-fade-slide anim-delay-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
    <div className="row align-items-center g-3">
      <div className="col-sm-7">
        <p className="small m-0 opacity-75" style={{ color: "#94a3b8", fontSize: "12px" }}>
          Want to deploy similar automated modules or custom architectural infrastructure for your enterprise? <strong>08078392043</strong>
        </p>
      </div>
      <div className="col-sm-5 text-sm-end">
     
      </div>
    </div>
  </div>
</div>
      {/* RIGHT COLUMN: Minimalist Clean Secure Action Login Form */}
      <div className="col-md-6 col-lg-5 d-flex align-items-center justify-content-center p-4 p-sm-5 bg-white">
        <div className="w-100 anim-fade-slide anim-delay-1" style={{ maxWidth: "400px" }}>
          
          {/* Header Mobile Branding */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-light text-primary border border-primary-subtle rounded-pill font-monospace" style={{ fontSize: "10px" }}>HOSPITAL PORTAL v2.0</span>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill font-monospace" style={{ fontSize: "10px" }}>CONNECTED</span>
            </div>
            
            <h3 className="fw-bold text-dark m-0">Secure Gateway Access</h3>
            <p className="text-muted small m-0">Enter your authorized infrastructure credentials below.</p>
          </div>

          {/* Form Alert Engine Feedback */}
          {alert && (
            <div className="alert alert-danger shadow-sm small py-2 px-3 rounded-3 border-0 mb-3 d-flex align-items-center gap-2 anim-fade-slide" style={{ animationDuration: '0.4s' }}>
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <div>{alert}</div>
            </div>
          )}

          {/* Main Action Login Form */}
          
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: "11px" }}>Facility Provider Code</label>
              <div className="input-group interactive-input">
                <span className="input-group-text bg-light text-muted border-end-0" style={{ borderColor: "#e2e8f0" }}>
                  <i className="bi bi-building"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0 ps-1 py-2" 
                  style={{ borderColor: "#e2e8f0", fontSize: "14px" }} 
                  placeholder="Enter HCP Code" 
                  value={hcpCode} 
                  onChange={(e) => setHcpCodeLocal(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small m-0 fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: "11px" }}>Secure Password</label>
                <a href="tel:08078392043" className="text-decoration-none small text-muted" style={{ fontSize: "11px" }}></a>
              </div>
              <div className="input-group interactive-input">
                <span className="input-group-text bg-light text-muted border-end-0" style={{ borderColor: "#e2e8f0" }}>
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input 
                  type="password" 
                  className="form-control bg-light border-start-0 ps-1 py-2" 
                  style={{ borderColor: "#e2e8f0", fontSize: "14px" }} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-4 rounded-3 text-uppercase tracking-wide interactive-btn" style={{ fontSize: "13px" }}>
              <i className="bi bi-shield-lock-fill"></i> Initialize Session
            </button>

  <div 
  className="p-4 mb-4 rounded-3 d-flex align-items-center justify-content-between shadow-sm interactive-box" 
  style={{ 
    backgroundColor: "#eff6ff", 
    border: "2px solid #2563eb", 
    cursor: "pointer", 
    transition: "all 0.2s ease" 
  }} 
  onClick={() => navigate("/nhia-login")}
>
  <div className="d-flex align-items-center gap-3">
    <div 
      className="d-flex align-items-center justify-content-center rounded-circle bg-white text-primary shadow-sm" 
      style={{ width: "44px", height: "44px", border: "1px solid #bfdbfe" }}
    >
      <i className="bi bi-hospital" style={{ fontSize: "20px" }}></i>
    </div>
    <div>
      <div className="fw-bold text-primary text-uppercase" style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
        NHIA Portal Direct Access
      </div>
      <div className="text-dark fw-semibold" style={{ fontSize: "12px" }}>
        Request authorizatin & Lots more 
      </div>
    </div>
  </div>
  <div className="d-flex align-items-center bg-white px-3 py-2 rounded-pill text-primary fw-bold shadow-sm" style={{ fontSize: "11px" }}>
    Proceed <i className="bi bi-arrow-right ms-2"></i>
  </div>
</div>


  {/* Bottom Registration Link */}
  <div className="text-center pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
    <span className="text-muted small">New facility setup needed?</span>
    <Link to="/signup" className="fw-bold text-primary small text-decoration-none ms-1">Register Module</Link>
  </div>
            

          
          </form>

          {/* Micro Footer Trust Signals */}
          <div className="text-center mt-5">
            <p className="text-muted m-0" style={{ fontSize: "11px" }}>
              Protected by SYNAEGIS Security Protocol Matrix. <br />
              Support Lines: <span className="text-dark fw-medium">nonsuchmedicare@gmail.com</span>
            </p>
          </div>

        </div>
      </div>

    </div>
  ); {/* NEW: Beautiful Styled Bracket/Container for Alternative Navigation */}
  <div 
    className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between interactive-box" 
    style={{ 
      backgroundColor: "#f8fafc", 
      border: "1px dashed #cbd5e1",
      cursor: "pointer",
      transition: "all 0.2s ease"
    }}
    onClick={() => navigate("/portal-guidelines")} // Target page path
  >
    <div className="d-flex align-items-center gap-3">
      <div 
        className="d-flex align-items-center justify-content-center rounded-circle"
        style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff", color: "#2563eb" }}
      >
        <i className="bi bi-journal-medical" style={{ fontSize: "14px" }}></i>
      </div>
      <div>
        <div className="fw-semibold text-dark" style={{ fontSize: "12px", letterSpacing: "0.3px" }}>
          Portal Guidelines & Legal Policy
        </div>
        <div className="text-muted" style={{ fontSize: "11px" }}>
          Read verification protocols before entry
        </div>
      </div>
    </div>
    <i className="bi bi-chevron-right text-muted small"></i>
  </div>

  {/* Bottom Registration Link */}
  <div className="text-center pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
    <span className="text-muted small">New facility setup needed?</span>
    <Link to="/signup" className="fw-bold text-primary small text-decoration-none ms-1">Register Module</Link>
  </div>
}

export default Login;
