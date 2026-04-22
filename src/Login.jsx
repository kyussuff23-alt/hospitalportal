import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bcrypt from "bcryptjs";

function Login({ setIsAuthenticated, setHcpCode, setHospitalName }) {
  const [hcpCode, setHcpCodeLocal] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const navigate = useNavigate();

 

async function generateHash() {
  const hash = await bcrypt.hash("TempPass123", 10); // replace TempPass123 with your chosen password
  console.log("Hash to paste in Supabase:", hash);
}

generateHash();

 
 
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Step 1: Validate HCP code against myhospitals and fetch hospital name
    const { data: hospitalData, error: hospitalError } = await supabase
      .from("myhospitals")
      .select("hcpcode, name")
      .eq("hcpcode", hcpCode)
      .single();

    if (hospitalError || !hospitalData) {
      setAlert("Your input is invalid, contact NONSUCH for profiling 08078392043 nonsuchmedicare@gmail.com.");
      return;
    }

    // Store hospital name in App state
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
      setHcpCode(hcpCode);
      navigate("/dashboard");
    }
  };

  return (
    <div className="vh-100 d-flex flex-column align-items-center bg-gradient">
      {/* Header */}
      <div className="text-center mt-5 mb-4">
        <i className="bi bi-shield-lock text-primary" style={{ fontSize: "4rem" }}></i>
        <h1 className="fw-bold text-primary mt-2">NONSUCH CLAIMS PORTAL</h1>
        <p className="text-muted">Secure access for hospital Claims</p>
      </div>

      {/* Login Form */}
      <div className="w-100" style={{ maxWidth: "420px" }}>
        {alert && <div className="alert alert-danger">{alert}</div>}

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
            <Link to="/signup" className="fw-bold text-primary">Sign Up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
