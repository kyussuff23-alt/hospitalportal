import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function EnrolleeSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);
    
    // Don't search if the input is empty or too short
    if (!value.trim() || value.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);

    // SECURE: Call the database function directly instead of accessing the raw table
    const { data, error } = await supabase
      .rpc("secure_enrollee_search", { search_term: value });
        
    if (!error && data) {
      setResults(data);
    } else {
      console.error("Search failed or blocked:", error?.message);
      setResults([]);
    }
    
    setLoading(false);
  };

  // FIX: Clear results and set input text on click
  const handleItemClick = (step) => {
    if (onSelect) onSelect(step);
    setQuery(step.enrolleename); 
    setResults([]); 
  };

  return (
    <div className="w-100 d-block position-relative" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <label className="form-label small fw-bold text-secondary mb-1">Search Patient Registry</label>
      
      <div className="input-group shadow-sm rounded-2 overflow-hidden border border-light-subtle">
        <span className="input-group-text bg-white border-0 text-muted px-2.5">
          <i className="bi bi-search"></i>
        </span>
        <input 
          type="text" 
          className="form-control border-0 shadow-none py-2 text-dark bg-white font-medium" 
          placeholder="Type Policy ID or Enrollee Name to locate benefits..." 
          value={query} 
          onChange={(e) => handleSearch(e.target.value)} 
        />
        {loading && (
          <span className="input-group-text bg-white border-0 text-primary px-3">
            <i className="spinner-border spinner-border-sm" role="status"></i>
          </span>
        )}
        {query && !loading && (
          <button 
            type="button" 
            className="btn btn-white border-0 text-muted px-2.5 bg-white hover-bg-light"
            onClick={() => { setQuery(""); setResults([]); }}
          >
            <i className="bi bi-x-circle-fill small"></i>
          </button>
        )}
      </div>
      
      {/* Popover suggest layout list overlay drops cleanly OVER lower form fields */}
      {results.length > 0 && (
        <ul 
          className="list-group position-absolute w-100 mt-1 shadow-lg border-light-subtle rounded-3 overflow-hidden bg-white custom-search-scroll" 
          style={{ maxHeight: "220px", overflowY: "auto", zIndex: 1080 }}
        >
          {results.map((step) => (
            <li 
              key={step.id} 
              className="list-group-item list-group-item-action py-2.5 px-3 border-0 border-bottom text-start d-flex align-items-center justify-content-between text-dark" 
              style={{ cursor: "pointer" }}
              onClick={() => handleItemClick(step)}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-check-fill text-success fs-5"></i>
                <div className="d-flex flex-column">
                  <span className="fw-semibold text-dark small">{step.enrolleename}</span>
                  <span className="text-muted font-monospace tracking-wide text-xs" style={{ fontSize: "0.75rem" }}>
                    Sponsor: {step.client || "Private Policy"}
                  </span>
                </div>
              </div>
              <span className="badge bg-light text-secondary border font-monospace px-2 py-1 small rounded">
                {step.policyid}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
