import React, { useState } from "react";
import "./ManagementFees.css";

const MANAGEMENT_PHASES = [
  {
    id: 1,
    phaseTitle: "Phase 1",
    name: "Commitment",
    fields: [
      { label: "From", value: "15/07/2021" },
      { label: "Until", value: "15/07/2026" },
      { label: "Shares A1", value: "1.00%" },
      { label: "Shares A2", value: "1.50%" },
      { label: "Shares A3", value: "2.00%" },
      { label: "Shares B", value: "1.00%" },
    ],
  },
  {
    id: 2,
    phaseTitle: "Phase 2",
    name: "Cost",
    fields: [
      { label: "From", value: "16/07/2026" },
      { label: "Until", value: "Last deal exited" },
      { label: "Rate", value: "2.00%" },
    ],
  },
];

const ManagementFees = () => {
  const [activeMgmtDate, setActiveMgmtDate] = useState(false);

  return (
    <div className="mgmt-wrap">
      {activeMgmtDate && (
        <div className="date-picker-overlay"></div>
      )}

      {MANAGEMENT_PHASES.map((phase) => (
        <div key={phase.id} className="mgmt-card">
          <div className="mgmt-phase-title">{phase.phaseTitle}</div>

          <div className="mgmt-phase-body">
            <div className="mgmt-name-col">
              <div className="field-label">
                Name<span className="required">*</span>
              </div>
              <div className="field-input static-field">
                {phase.name}
              </div>
            </div>

            <div className="mgmt-meta-row">
              {phase.fields.map((item) => (
                <div key={item.label} className="mgmt-meta-item">
                  <div className="mgmt-meta-label">{item.label}</div>
                  <div
                    className={
                      "field-input mgmt-date-input" +
                      ((item.label === "From" || item.label === "Until")
                        ? " mgmt-date-input--with-icon"
                        : "")
                    }
                  >
                    <input
                      type="text"
                      className="mgmt-date-input-inner"
                      defaultValue={item.value}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManagementFees;