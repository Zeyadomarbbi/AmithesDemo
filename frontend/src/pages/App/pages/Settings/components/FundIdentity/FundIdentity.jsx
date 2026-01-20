import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useFundDetails } from "../../../../hooks/useFundDetails.js"; // Fetch Hook
import { useFundData } from "../../../../hooks/useFundData";       // Action Hook
import { useCurrencies } from "../../../../hooks/useCurrencies.js";
import { usePhases } from "../../../../hooks/useFundPhase.js";
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput.jsx";

import "./FundIdentity.css";

const FundIdentity = () => {
  // 1. Get Fund ID from Layout
  const { fundId } = useOutletContext();

  // 2. Fetch Data Locally
  const { fund: serverData, isFundLoading, error, refetch } = useFundDetails(fundId);
  const { updateFund } = useFundData();
  const { phases } = usePhases();
  const { currencies, isLoading: currenciesLoading } = useCurrencies();

  // 3. Local Form State
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // 4. Sync Server Data to Local State (Initial Load)
  useEffect(() => {
    if (serverData) {
      setFormData(serverData);
    }
  }, [serverData]);

  // --- Handlers ---

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleDateChange = (date) => {
    if (!date) return;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    
    // FIX: Using ISO Format (YYYY-MM-DD) to match Backend expectation
    // This prevents the "does not match format" error we fixed earlier.
    setFormData((prev) => ({ 
      ...prev, 
      formation_date_string: `${year}-${month}-${day}` 
    }));
  };

  const getParsedDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Handle YYYY-MM-DD (Backend/ISO)
    if (dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      return new Date(y, m - 1, d);
    }
    // Handle DD/MM/YYYY (Legacy/Display)
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return new Date(y, m - 1, d);
    }
    return new Date();
  };

  // --- SAVE ACTION ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare Payload
      const payload = {
        legal_name: formData.legal_name,
        short_name: formData.short_name,
        fund_strategy: formData.fund_strategy,
        legal_form: formData.legal_form,
        management_company: formData.management_company,
        currency: formData.currency,
        phase: formData.phase,
        formation_date_string: formData.formation_date_string,
      };

      console.log("Saving Fund Identity:", payload);
      const result = await updateFund(fundId, payload);
      await refetch();

      if (!result.success) {
        console.error("Fund Save Error Details:", result.error);
        throw new Error(result.error || "Save failed");
      }

      // Refresh data to ensure sync
      alert("Saved successfully!");
      
    } catch (err) {
      console.error("Unexpected error saving:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isFundLoading) return <div className="fund-identity-loader">Loading Fund Identity...</div>;
  if (error) return <div className="fund-identity-error">Error: {error}</div>;

  return (
    <div className="fund-identity-wrapper">
      <form className="fund-identity-settings-form" onSubmit={(e) => e.preventDefault()}>
        
        {/* --- FORM FIELDS --- */}
        <div className="form-field">
          <label className="field-label">Legal name<span className="required">*</span></label>
          <div className="field-input">
            <input
              type="text"
              className="field-input-inner"
              placeholder="Enter legal name..."
              value={formData.legal_name || ""}
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
              value={formData.short_name || ""}
              onChange={handleChange("short_name")}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">Formation date<span className="required">*</span></label>
          <div className="date-input-wrapper">
            <DateInputWithPicker
              initialDate={getParsedDate(formData.formation_date_string)}
              onDateChange={handleDateChange}
              isSingle={true}
              dateFormat="DD/MM/YYYY" // Display format for the User
            />
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">Fund currency<span className="required">*</span></label>
          <div className="field-input">
            <select
              className={`field-input-inner field-select ${!formData.currency ? "placeholder-active" : ""}`}
              value={formData.currency || ""}
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
              value={formData.legal_form || ""}
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
              value={formData.management_company || ""}
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
              value={formData.fund_strategy || ""}
              onChange={handleChange("fund_strategy")}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">Fund's phase<span className="required">*</span></label>
          <div className="field-input">
            <select
              className={`field-input-inner field-select ${!formData.phase ? "placeholder-active" : ""}`}
              value={formData.phase || ""}
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

      {/* --- LOCAL FOOTER WITH SAVE BUTTON --- */}
      <div className="fund-identity-footer">
        <div className="fund-identity-actions">
          <button 
            className="fund-identity-btn-save" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundIdentity;