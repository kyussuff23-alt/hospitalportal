import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bcrypt from "bcryptjs";

function Signup() {
  const [hcpCode, setHcpCode] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Auto-clear alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Auto-clear success after 5 seconds
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

    // Step 1: Validate hospital via RPC (returns "not_profiled" or "ok")
    const { data: validationResult, error: validationError } = await supabase.rpc("signup_validate_hospital", {
      hcp: hcpCode
    });

    if (validationError || validationResult === "not_profiled") {
      setAlert("HCPCODE is not profiled yet.");
      return;
    }

    // Step 2: Check if already registered via RPC (returns "already_registered" or "not_registered")
    const { data: profileStatus, error: profileError } = await supabase.rpc("signup_check_profile", {
      hcp: hcpCode
    });

    if (profileError) {
      setAlert("Signup failed. Please try again.");
      return;
    }

    if (profileStatus === "already_registered") {
      setAlert("This HCP Code is already registered. Please log in instead.");
      return;
    }

    // Step 3: Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Insert new profile via RPC
    const { data: insertResult, error: insertError } = await supabase.rpc("signup_create_profile", {
      hcp: hcpCode,
      pass: hashedPassword
    });

    if (insertError || insertResult !== "success") {
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
  <p className="text-muted" style={{ fontWeight: 'bold' }}>Register Your Hospital Access</p>
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
