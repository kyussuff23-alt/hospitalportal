import { useState,useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bcrypt from "bcryptjs";

function Signup() {
  const [hcpCode, setHcpCode] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
 
 
 
  // Auto-clear alert after 10 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Auto-clear success after 10 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);


const handleSignup = async (e) => {
  e.preventDefault();
  setAlert("");
  setSuccess("");

  // Check if HCP code exists in myhospitals
  const { data: hospitalData, error: hospitalError } = await supabase
    .from("myhospitals")
    .select("hcpcode")
    .eq("hcpcode", hcpCode)
    .single();

  if (hospitalError || !hospitalData) {
    setAlert("HCPCODE is not profiled yet.");
    return;
  }

  // Check if HCP code already registered
  const { data: existingProfile } = await supabase
    .from("hospitalprofile")
    .select("hcpcode")
    .eq("hcpcode", hcpCode)
    .single();

  if (existingProfile) {
    setAlert("This HCP Code is already registered. Please log in instead.");
    return;
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  const { error: insertError } = await supabase
    .from("hospitalprofile")
    .insert([{ hcpcode: hcpCode, password: hashedPassword }]);

  if (insertError) {
    setAlert("Signup failed. Please try again.");
  } else {
    setSuccess("Signup successful! You can now log in.");
    setTimeout(() => navigate("/login"), 2000);
  }
};

  return (
  <div className="vh-100 d-flex flex-column align-items-center bg-gradient">
  {/* Header */}
  <div className="text-center mt-5 mb-4">
    <i className="bi bi-person-plus-fill text-primary" style={{ fontSize: "4rem" }}></i>
    <h1 className="fw-bold text-primary mt-2">NONSUCH PROVIDER PORTAL</h1>
    <p className="text-muted">Register your hospital access</p>
  </div>

  {/* Form */}
  <div className="w-100" style={{ maxWidth: "420px" }}>
    {alert && <div className="alert alert-danger">{alert}</div>}
    {success && <div className="alert alert-success">{success}</div>}

    <form onSubmit={handleSignup} className="p-4 rounded-4 shadow-sm bg-white">
      <div className="input-group mb-3">
        <span className="input-group-text"><i className="bi bi-building"></i></span>
        <input
          type="text"
          className="form-control"
          placeholder="HCP Code"
          value={hcpCode}
          onChange={(e) => setHcpCode(e.target.value)}
          required
        />
      </div>

      <div className="input-group mb-3">
        <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
        <input
          type="password"
          className="form-control"
          placeholder="Desired Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-dark w-100 mb-3">
        <i className="bi bi-check-circle me-2"></i> Sign Up
      </button>

      <div className="text-center">
        <span>Already have an account? </span>
        <Link to="/login" className="fw-bold text-primary">Back to Login</Link>
      </div>
    </form>
  </div>
</div>


  );
}

export default Signup;
