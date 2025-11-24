import React, { useState } from "react";
import "./NewFundModal.css";

export default function NewFundModal({ open, onClose, onCreate }) {
  const [legalName, setLegalName] = useState("");
  const [shortName, setShortName] = useState("");
  const [formationDate, setFormationDate] = useState("");
  const [currency, setCurrency] = useState("");

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="close">
          ×
        </button>

        <h2 className="modal-title">Create new fund</h2>

        <label className="modal-label">Legal name*</label>
        <input
          className="modal-input"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="Asterium Fund I"
        />

        <label className="modal-label">Short name*</label>
        <input
          className="modal-input"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Please enter the acronym..."
        />

        <label className="modal-label">Formation date*</label>
        <input
          className="modal-input"
          value={formationDate}
          onChange={(e) => setFormationDate(e.target.value)}
          placeholder="00/00/00"
        />

        <label className="modal-label">Fund currency*</label>
        <input
          className="modal-input"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          placeholder="Please select a currency"
        />

        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-btn primary"
            onClick={() =>
              onCreate?.({ legalName, shortName, formationDate, currency })
            }
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
