// frontend/src/pages/App/pages/Settings/components/NewFundModal/NewFundModal.jsx
import React, { useState, useEffect } from "react";
import { useCurrencies } from "../../../../hooks/Reference/useCurrencies"; 
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput";
import SearchableSelect from "../../../../../../components/SearchBar/SearchableSelect.jsx";
import { ChevronDownIcon } from '/src/components/Icons/DirectionIcons';
import "./NewFundModal.css";

// Helper to get ISO format "YYYY-MM-DD" for backend compatibility
const getTodayISO = () => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return `${y}-${m}-${d}`;
};

export default function NewFundModal({ open, onClose, onCreate }) {
  const { currencies, isLoading } = useCurrencies();

  const [legalName, setLegalName] = useState("");
  const [shortName, setShortName] = useState("");
  const [formationDate, setFormationDate] = useState(null);
  const [currency, setCurrency] = useState("");
  useEffect(() => {
    if (open) {
      setLegalName("");
      setShortName("");
      setCurrency("");
      setFormationDate(getTodayISO());
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
              placeholder="Ex. Amethis Fund I"
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
                 if (!formationDate) return new Date();
                 const [y, m, d] = formationDate.split("-");
                 return new Date(y, m - 1, d);
              })()}
              onDateChange={(date) => {
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                setFormationDate(`${year}-${month}-${day}`);
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
              <SearchableSelect
                options={currencies.map((c) => ({
                  ...c,
                  name: c.currency_name || c.name || c.currency_code || c.code || "",
                  code: c.currency_code || c.code || "",
                }))}
                value={currency}
                onChange={(val) => setCurrency(val)}
                placeholder={isLoading ? "Loading..." : "Please select a currency"}
                disabled={isLoading}
                labelKey="name"
                valueKey="id"
                secondaryLabelKey="code"
                triggerClassName="nf-input nf-select nf-select-trigger"
              />
            </div>
              <div className={`nf-select-wrapper ${isSelectOpen ? "is-open" : ""}`}>
                <select
                  className="nf-input nf-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  onFocus={() => setIsSelectOpen(true)}
                  onBlur={() => setIsSelectOpen(false)}
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
                <ChevronDownIcon />
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
            disabled={!legalName || !shortName || !currency || !formationDate}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
