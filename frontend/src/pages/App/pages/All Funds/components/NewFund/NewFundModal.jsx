// src/pages/App/pages/All Funds/components/NewFundModal.jsx
import React, { useState } from "react";
import "./NewFundModal.css";
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput";


export default function NewFundModal({ open, onClose, onCreate }) {
  if (!open) return null;

  // Local state for form fields
  const [legalName, setLegalName] = useState("");
  const [shortName, setShortName] = useState("");
  const [formationDate, setFormationDate] = useState(null);
  const [currency, setCurrency] = useState("");

  const stopClick = (e) => e.stopPropagation();

  const handleCreate = () => {
    // ✅ build payload from fields (no silent return)
    const payload = {
      legalName: legalName.trim(),
      shortName: shortName.trim(),
      formationDate: formationDate.trim(),
      currency,
    };

    if (onCreate) {
      onCreate(payload);       // 🔥 this calls handleCreateFund in AllFundsPage
    }

    // reset fields
    setLegalName("");
    setShortName("");
    setFormationDate("");
    setCurrency("");

    // close modal
    if (onClose) onClose();
  };

  return (
    <div className="nf-backdrop" onClick={onClose}>
      <div className="nf-modal" onClick={stopClick}>
        {/* HEADER */}
        <div className="nf-header">
          <h2 className="nf-title">Create new fund</h2>
          <button
            type="button"
            className="nf-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="nf-body">
          {/* Legal name */}
          <div className="nf-field">
            <label className="nf-label">
              Legal name<span className="nf-required">*</span>
            </label>
            <input
              className="nf-input"
              placeholder="Asterium Fund I"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>

          {/* Short name */}
          <div className="nf-field">
            <label className="nf-label">
              Short name<span className="nf-required">*</span>
            </label>
            <input
              className="nf-input"
              placeholder="Please enter the acronym..."
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
            />
          </div>

          {/* Formation date */}
          <div className="nf-field">
  <label className="nf-label">
    Formation date<span className="nf-required">*</span>
  </label>

<DateInputWithPicker
  initialDate={
    formationDate
      ? (() => {
          const [d, m, y] = formationDate.split("/");
          return new Date(y, m - 1, d);
        })()
      : new Date()
  }
  onDateChange={(date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    setFormationDate(`${day}/${month}/${year}`);
  }}
  isSingle
  dateFormat="DD/MM/YYYY"
/>


</div>


          {/* Fund currency */}
          <div className="nf-field">
            <label className="nf-label">
              Fund currency<span className="nf-required">*</span>
            </label>
            <div className="nf-select-wrapper">
              <select
                className="nf-input nf-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="">Please select a currency</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
              <span className="nf-select-chevron" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="nf-footer">
          <button
            type="button"
            className="nf-btn nf-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="nf-btn nf-btn-primary"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}  