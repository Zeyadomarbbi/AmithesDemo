import React, { useState, useEffect } from "react";
import { useCurrencies } from "../../../../hooks/useCurrencies.js"; 
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput";

import "./NewFundModal.css";

// Helper to get "DD/MM/YYYY" format
const getTodayString = () => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
};

export default function NewFundModal({ open, onClose, onCreate }) {
  const { currencies, isLoading } = useCurrencies();

  // 1. Initialize all to "none" (null/empty)
  const [legalName, setLegalName] = useState("");
  const [shortName, setShortName] = useState("");
  const [formationDate, setFormationDate] = useState(null);
  const [currency, setCurrency] = useState("");

  // 2. Reset/Sync fields when modal opens
  useEffect(() => {
    if (open) {
      setLegalName("");
      setShortName("");
      setCurrency("");
      // Sync state with the DatePicker's visual default (Today)
      // This ensures the user doesn't have to "pick" today manually to enable the button.
      setFormationDate(getTodayString());
    }
  }, [open]);

  if (!open) return null;

  const stopClick = (e) => e.stopPropagation();

  const handleCreate = () => {
    const payload = {
      legalName: legalName.trim(),
      shortName: shortName.trim(),
      formationDate: formationDate, 
      currency_id: currency, 
    };

    if (onCreate) onCreate(payload);
    if (onClose) onClose();
  };

  return (
    <div className="nf-backdrop" onClick={onClose}>
      <div className="nf-modal" onClick={stopClick}>
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

        <div className="nf-body">
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

          <div className="nf-field">
            <label className="nf-label">
              Formation date<span className="nf-required">*</span>
            </label>
            <DateInputWithPicker
              initialDate={(() => {
                 // If null, visual defaults to Today (new Date())
                 if (!formationDate) return new Date();
                 const [d, m, y] = formationDate.split("/");
                 return new Date(y, m - 1, d);
              })()}
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

          <div className="nf-field">
            <label className="nf-label">
              Fund currency<span className="nf-required">*</span>
            </label>
            <div className="nf-select-wrapper">
              <select
                className="nf-input nf-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isLoading}
              >
                <option value="">
                  {isLoading ? "Loading..." : "Please select a currency"}
                </option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
              <span className="nf-select-chevron" />
            </div>
          </div>
        </div>

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
            // Check checks that all fields are truthy
            disabled={!legalName || !shortName || !currency || !formationDate}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}