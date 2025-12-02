import React, { useState } from "react";
import "./AddFlowModal.css";

export default function AddFlowModal({ onClose }) {
  const [flowName, setFlowName] = useState("");
  const [flowType, setFlowType] = useState("Due diligence fees");
  const [alignAll, setAlignAll] = useState(false);

  return (
    <div className="af-backdrop">
      <div className="af-modal">
        <div className="af-header">
          <h3 className="af-title">Add new flow</h3>
          <button className="af-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="af-body">
          <div className="af-field">
            <label className="af-label">Flow name*</label>
            <input
              className="af-input"
              placeholder="Please enter the flow name..."
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
            />
          </div>

          <div className="af-field">
            <label className="af-label">Type of flow*</label>
            <div className="af-select">
              <span>{flowType}</span>
              <span className="af-select-arrow">▾</span>
            </div>
          </div>

          <label className="af-checkbox">
            <input
              type="checkbox"
              checked={alignAll}
              onChange={(e) => setAlignAll(e.target.checked)}
            />
            <span>Align all LPs</span>
          </label>
        </div>

        <div className="af-footer">
          <button className="af-btn af-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="af-btn af-btn--primary"
            onClick={onClose}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
