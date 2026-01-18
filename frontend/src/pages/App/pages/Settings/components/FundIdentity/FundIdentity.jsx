import React from "react";
import { useOutletContext } from "react-router-dom";
import { useCurrencies } from "../../../../hooks/useCurrencies.js";
import { usePhases } from "../../../../hooks/useFundPhase.js";
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput.jsx";
import "./FundIdentity.css";

const FundIdentity = () => {
  // 1. Get the DRAFT data and the UPDATER from Parent
  const { fund, updateDraft } = useOutletContext();
  
  const { phases } = usePhases();
  const { currencies, isLoading: currenciesLoading } = useCurrencies();

  // Helper to update specific fields in Parent State
  const handleChange = (field) => (e) => {
    updateDraft({ [field]: e.target.value });
  };

  // Helper to parse "DD/MM/YYYY" string to Date object for the picker
  const getParsedDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Assuming backend format is DD/MM/YYYY or similar. 
    // If backend sends YYYY-MM-DD, adjust logic.
    // Let's assume standard '2023-01-01' from typical API get, 
    // BUT we need to send 'DD/MM/YYYY' back.
    
    // Safety check for format
    if (dateStr.includes('/')) {
       const [d, m, y] = dateStr.split("/");
       return new Date(y, m - 1, d);
    }
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d);
  };

  // Handle Date Change: Update Parent with "DD/MM/YYYY" string
  const handleDateChange = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    // Directly update draft with the format Backend expects
    updateDraft({ formation_date_string: `${day}/${month}/${year}` });
  };

  // Render using 'fund' (Draft Data) directly
  return (
    <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-field">
        <label className="field-label">Legal name<span className="required">*</span></label>
        <div className="field-input">
          <input
            type="text"
            className="field-input-inner"
            placeholder="Enter legal name..."
            value={fund.legal_name || ""}
            onChange={handleChange("legal_name")}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Short name<span className="required">*</span></label>
        <div className="field-input">
          <input
            type="text"
            className="field-input-inner"
            placeholder="Enter short name..."
            value={fund.short_name || ""}
            onChange={handleChange("short_name")}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Formation date<span className="required">*</span></label>
        <div className="date-input-wrapper">
          <DateInputWithPicker
            initialDate={getParsedDate(fund.formation_date_string)}
            onDateChange={handleDateChange}
            isSingle={true}
            dateFormat="DD/MM/YYYY"
          />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Fund currency<span className="required">*</span></label>
        <div className="field-input">
          <select
            className={`field-input-inner field-select ${!fund.currency ? "placeholder-active" : ""}`}
            value={fund.currency || ""}
            onChange={handleChange("currency")}
            disabled={currenciesLoading}
          >
            <option value="" disabled>{currenciesLoading ? "Loading..." : "Please select"}</option>
            {currencies?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
            ))}
          </select>
          <span className="nf-select-chevron" />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Legal form</label>
        <div className="field-input">
          <input
            type="text"
            className="field-input-inner"
            placeholder="Enter legal form..."
            value={fund.legal_form || ""}
            onChange={handleChange("legal_form")}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Management company</label>
        <div className="field-input">
          <input
            type="text"
            className="field-input-inner"
            placeholder="Enter a management company..."
            value={fund.management_company || ""}
            onChange={handleChange("management_company")}
          />
        </div>
      </div>

      <div className="form-field form-field--full">
        <label className="field-label">Fund strategy<span className="required">*</span></label>
        <div className="field-input">
          <input
            type="text"
            placeholder="Enter fund strategy..."
            className="field-input-inner"
            value={fund.fund_strategy || ""}
            onChange={handleChange("fund_strategy")}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Fund's phase<span className="required">*</span></label>
        <div className="field-input">
          <select
            className={`field-input-inner field-select ${!fund.phase ? "placeholder-active" : ""}`}
            value={fund.phase || ""}
            onChange={handleChange("phase")}
          >
            <option value="" disabled>Please select a phase</option>
            {phases?.map((p) => (
              <option key={p.phase_id} value={p.phase_id}>{p.phase_name}</option>
            ))}
          </select>
          <span className="nf-select-chevron" />
        </div>
      </div>
    </form>
  );
};

export default FundIdentity;