import { useState, useEffect,useMemo } from "react";
import { supabase } from "./supabaseClient";

export default function Authorization({ hcpCode, hospitalName }) {
  const [requests, setRequests] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
    const [showModall, setShowModall] = useState(false);

  // Form fields
  const [enrolleename, setEnrolleename] = useState("");
  const [policyid, setPolicyid] = useState("");
  const [clientname, setClientname] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 10;


  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  };

  // Fetch requests for this hospital
  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("authrequest")
        .select("*")
        .eq("hcpcode", hcpCode)
        .order("created_at", { ascending: false });

      if (error) {
        showAlert("Could not load your authorization requests.", "danger");
      } else {
        setRequests(data);
      }
    };

    if (hcpCode) fetchRequests();
  }, [hcpCode]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().split("T")[0];
  };

  // Handle new request submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("authrequest").insert([
      {
        enrolleename,
        policyid,
        clientname,
        diagnosis,
        treatment,
        hcpcode: hcpCode,
        hospname: hospitalName,
        status: "pending"
      }
    ]);

    if (error) {
      showAlert("Failed to submit request. Try again.", "danger");
    } else {
      showAlert("Authorization request submitted!", "success");
      setShowModal(false);
      setEnrolleename("");
      setPolicyid("");
      setClientname("");
      setDiagnosis("");
      setTreatment("");

      // Refresh table
      const { data } = await supabase
        .from("authrequest")
        .select("*")
        .eq("hcpcode", hcpCode)
        .order("created_at", { ascending: false });
      setRequests(data);
    }
  };

  // pagination Logic

  const currentRows = useMemo(() => {
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  return requests.slice(indexOfFirstRow, indexOfLastRow);
}, [requests, currentPage]);



  return (
   
   <div className="p-4">
      {/* Heading + Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-primary d-flex align-items-center gap-2">
          <i className="bi bi-bar-chart"></i>
          <span>Authorization Requests</span>
        </h3>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-2"></i> Request Code
        </button>
      </div>

      {/* Alerts */}
      {alert.message && (
        <div className={`alert alert-${alert.type} mb-3`} role="alert">
          {alert.message}
        </div>
      )}

    {/* Table */}

<div className="glass-card table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
  <table className="table table-striped table-hover table-bordered align-middle">
    <thead className="table-primary sticky-top">
      <tr>
        <th>SN</th>
        <th>Date</th>
        <th>Enrollee Name</th>
        <th>Policy ID</th>
        <th>Client Name</th>
        <th>HCP Code</th>
        <th>Hospital Name</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {requests.length === 0 ? (
        <tr>
          <td colSpan="8" className="text-center text-muted">
            No authorization requests yet.
          </td>
        </tr>
      ) : (
        currentRows.map((req, index) => (
          <tr key={req.id}>
            <td>{index + 1}</td>
            <td>{formatDate(req.created_at)}</td>
            <td>{req.enrolleename}</td>
            <td>{req.policyid || "-"}</td>
            <td>{req.clientname || "-"}</td>
            <td>{req.hcpcode}</td>
            <td>{req.hospname}</td>
            <td>
              <button
                className="btn btn-link p-0"
                onClick={() => {
                  setSelectedRequest(req);
                  setShowModall(true);
                }}
              >
                <span
                  className={`badge ${
                    req.status === "approved"
                      ? "bg-success"
                      : req.status === "denied"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                  }`}
                >
                  {req.status}
                </span>
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>

  {/* Pagination */}
  <nav>
    <ul className="pagination justify-content-center">
      {[...Array(Math.ceil(requests.length / rowsPerPage))].map((_, i) => (
        <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
            {i + 1}
          </button>
        </li>
      ))}
    </ul>
  </nav>
</div>


      {/* Bootstrap Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">New Authorization Request</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Enrollee Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={enrolleename}
                        onChange={(e) => setEnrolleename(e.target.value.toLowerCase())}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Policy ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={policyid}
                        onChange={(e) => setPolicyid(e.target.value.toLowerCase())}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Client Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clientname}
                        onChange={(e) => setClientname(e.target.value.toLowerCase())}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Diagnosis</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value.toLowerCase())}
                        required
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Treatment</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value.toLowerCase())}
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">
                      Submit Request
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
   
     {/* Modal for details */}
      {showModall && selectedRequest && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Authorization Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModall(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Prefilled readonly fields */}
                  <div className="mb-3">
                    <label className="form-label">Enrollee Name</label>
                    <input type="text" className="form-control" value={selectedRequest.enrolleename} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Policy ID</label>
                    <input type="text" className="form-control" value={selectedRequest.policyid || "-"} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Client Name</label>
                    <input type="text" className="form-control" value={selectedRequest.clientname || "-"} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Diagnosis</label>
                    <textarea className="form-control" rows="3" value={selectedRequest.diagnosis} readOnly></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Treatment</label>
                    <textarea className="form-control" rows="3" value={selectedRequest.treatment} readOnly></textarea>
                  </div>
                    <div className="mb-3">
                    <label className="form-label">Denial Reason</label>
                    <textarea className="form-control" rows="3" value={selectedRequest.reason} readOnly></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Auth Code</label>
                    <input type="text" className="form-control" value={selectedRequest.authcode || "-"} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <input type="text" className="form-control" value={selectedRequest.status} readOnly />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModall(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
   
    </div>
 




);
}
