import React from "react";
import "./Phase.css";

const PhasePPM = ({ value, onChange }) => {
  return (
    <div className="mgmt-card">
      <div className="mgmt-phase-title">PPM Description</div>
      <div className="mgmt-ppm-row">
        <textarea
          className="mgmt-ppm-textarea"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe provisions related to cost computations and limits on write-offs..."
          rows={4}
        />
      </div>
    </div>
  );
};

export default PhasePPM;