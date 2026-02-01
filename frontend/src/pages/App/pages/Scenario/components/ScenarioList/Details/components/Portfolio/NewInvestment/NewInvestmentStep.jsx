import React, { useState } from "react";
import "./NewInvestmentStep.css";

const COUNTRIES = ["Egypt", "UAE", "Saudi Arabia", "Qatar", "Bahrain"];
const CURRENCIES = ["EUR", "USD", "GBP"];

const NewInvestmentModal = ({ onClose, onNext }) => {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [ownership, setOwnership] = useState("");
  const [currency, setCurrency] = useState("");

  const isValid =
    name && sector && country && ownership && currency;

  const handleNext = () => {
    if (!isValid) return;

    // 👇 ده اللي Portfolio مستنيه
    onNext({
      name,
      sector,
      country,
      ownership,
      currency,
    });

    onClose(); // يقفل المودال
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">＋</span>
            <div>
              <h2>Create a new investment</h2>
              <p>Description</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-group full">
            <label>Investment name*</label>
            <input
              placeholder="Please enter the investment name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Sector*</label>
              <input
                placeholder="Please enter the sector..."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Geography*</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ownership*</label>
              <input
                placeholder="Please enter the ownership..."
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Local Currency*</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="">Select a currency</option>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-save"
            disabled={!isValid}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInvestmentModal;
