import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bcrypt from "bcryptjs";

function Login({ setIsAuthenticated, setHcpCode, setHospitalName }) {
  const [hcpCode, setHcpCodeLocal] = useState("");   // ✅ single state for HCP code
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();
  const [errorAlert, setErrorAlert] = useState("");
  const [successAlert, setSuccessAlert] = useState("");

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Step 1: Validate HCP code against myhospitals and fetch hospital name
    const { data: hospitalData, error: hospitalError } = await supabase
      .from("myhospitals")
      .select("hcpcode, name")   // ✅ also select name
      .eq("hcpcode", hcpCode)
      .single();

    if (hospitalError || !hospitalData) {
      setAlert("Your input is invalid, contact NONSUCH for profiling.");
      return;
    }

    // ✅ store hospital name in App state
    setHospitalName(hospitalData.name);

    // Step 2: Fetch hospital profile by HCP code
    const { data: user, error } = await supabase
      .from("hospitalprofile")
      .select("hcpcode, password")
      .eq("hcpcode", hcpCode)
      .single();

    if (error || !user) {
      setAlert("Invalid HCP Code.");
      return;
    }

    // Step 3: Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      setAlert("Password is incorrect, contact NONSUCH or try again.");
    } else {
      setAlert("");
      setIsAuthenticated(true);
      setHcpCode(hcpCode);   // ✅ pass the code up to App
      navigate("/dashboard");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!hcpCode || !newPassword) {
      setErrorAlert("Please enter your HCP Code and new password.");
      setSuccessAlert("");
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from("hospitalprofile")
      .update({ password: hashedPassword })
      .eq("hcpcode", hcpCode);

    if (error) {
      setErrorAlert("Failed to reset password. Contact NONSUCH.");
      setSuccessAlert("");
    } else {
      setSuccessAlert("Password reset successful. You can now log in.");
      setErrorAlert("");
      setPassword(newPassword);
      setShowReset(false);
      setNewPassword("");
    }
  };

  return (
    <div className="vh-100 d-flex flex-column align-items-center bg-gradient">
      {/* Header */}
      <div className="text-center mt-5 mb-4">
        <i className="bi bi-shield-lock text-primary" style={{ fontSize: "4rem" }}></i>
        <h1 className="fw-bold text-primary mt-2">NONSUCH PROVIDER PORTAL</h1>
        <p className="text-muted">Secure access for hospital Claims</p>
      </div>

      {/* Form */}
      <div className="w-100" style={{ maxWidth: "420px" }}>
        {alert && <div className="alert alert-danger">{alert}</div>}

        {!showReset ? (
          <form onSubmit={handleLogin} className="p-4 rounded-4 shadow-sm bg-white">
            <div className="input-group mb-3">
              <span className="input-group-text"><i className="bi bi-building"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="HCP Code"
                value={hcpCode}
                onChange={(e) => setHcpCodeLocal(e.target.value)}
                required
              />
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3">
              <i className="bi bi-box-arrow-in-right me-2"></i> Login
            </button>

            <div className="text-center">
              <span>Forgot password? </span>
              <button
                type="button"
                className="btn btn-link p-0 fw-bold text-primary"
                onClick={() => setShowReset(true)}
              >
                Reset Here
              </button>
              <span className="mx-2">|</span>
              <Link to="/signup" className="fw-bold text-primary">Sign Up</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="p-4 rounded-4 shadow-sm bg-white">
            <div className="input-group mb-3">
              <span className="input-group-text"><i className="bi bi-building"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="HCP Code"
                value={hcpCode}
                onChange={(e) => setHcpCodeLocal(e.target.value)}
                required
              />
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
              <input
                type="password"
                className="form-control"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-warning w-100 mb-3">
              <i className="bi bi-key me-2"></i> Reset Password
            </button>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-link p-0 fw-bold text-secondary"
                onClick={() => setShowReset(false)}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
