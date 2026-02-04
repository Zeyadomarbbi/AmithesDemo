import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useFundDetails } from "../../../../hooks/useFundDetails.js"; 
import { useFundData } from "../../../../hooks/Core/FundContext";       
import { useCurrencies } from "../../../../hooks/Reference/useCurrencies.js";
import { usePhases } from "../../../../hooks/Reference/useFundPhase.js";
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput.jsx";

import "./FundIdentity.css";

const FundIdentity = () => {
  const { fundId } = useOutletContext();

  const { fund: serverData, isFundLoading, error, refetch } = useFundDetails(fundId);
  const { updateFund } = useFundData();
  const { phases, isLoading: phasesLoading } = usePhases();
  const { currencies, isLoading: currenciesLoading } = useCurrencies();

  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (serverData) {
      setFormData(serverData);
    }
  }, [serverData]);

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === "currency_id") {
      value = parseInt(e.target.value, 10);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    if (!date) return;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    
    const isoDate = `${year}-${month}-${day}`;

    setFormData((prev) => ({ 
      ...prev, 
      formation_date: isoDate, // For backend payload
    }));
  };

  const getParsedDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr); 
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        legal_name: formData.legal_name,
        short_name: formData.short_name,
        fund_strategy: formData.fund_strategy,
        legal_form: formData.legal_form,
        management_company: formData.management_company,
        currency_id: formData.currency_id, 
        phase_name: formData.phase_name,      
        formation_date: formData.formation_date,
      };

      console.log("Saving Fund Identity with payload:", payload);
      const result = await updateFund(fundId, payload);
      await refetch();

      if (!result.success) throw new Error(result.error || "Save failed");
      alert("Saved successfully!");
      
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isFundLoading) return <div className="fund-identity-loader">Loading Fund Identity...</div>;
  if (error) return <div className="fund-identity-error">Error: {error}</div>;

  return (
    <div className="fund-identity-wrapper">
      <form className="fund-identity-form" onSubmit={(e) => e.preventDefault()}>
        
        <div className="fund-identity-field">
          <label className="fund-identity-label">Legal name<span className="fund-identity-required">*</span></label>
          <div className="fund-identity-input">
            <input
              type="text"
              className="fund-identity-input-inner"
              placeholder="Enter legal name..."
              value={formData.legal_name || ""}
              onChange={handleChange("legal_name")}
            />
          </div>
        </div>

        <div className="fund-identity-field">
          <label className="fund-identity-label">Short name<span className="fund-identity-required">*</span></label>
          <div className="fund-identity-input">
            <input
              type="text"
              className="fund-identity-input-inner"
              placeholder="Enter short name..."
              value={formData.short_name || ""}
              onChange={handleChange("short_name")}
            />
          </div>
        </div>

        <div className="fund-identity-field">
          <label className="fund-identity-label">Formation date<span className="fund-identity-required">*</span></label>
          <div className="fund-identity-date-wrapper">
            <DateInputWithPicker
              initialDate={getParsedDate(formData.formation_date)}
              onDateChange={handleDateChange}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
          </div>
        </div>

        <div className="fund-identity-field">
          <label className="fund-identity-label">Fund currency<span className="fund-identity-required">*</span></label>
          <div className="fund-identity-input">
            <select
              className="fund-identity-input-inner fund-identity-select"
              value={formData.currency_id || ""}
              onChange={handleChange("currency_id")}
              disabled={currenciesLoading}
            >
              <option value="" disabled>{currenciesLoading ? "Loading..." : "Please select"}</option>
              {currencies?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
              ))}
            </select>
            <span className="fund-identity-select-chevron" />
          </div>
        </div>

        <div className="fund-identity-field">
          <label className="fund-identity-label">Legal form</label>
          <div className="fund-identity-input">
            <input
              type="text"
              className="fund-identity-input-inner"
              placeholder="Enter legal form..."
              value={formData.legal_form || ""}
              onChange={handleChange("legal_form")}
            />
          </div>
        </div>

        <div className="fund-identity-field">
          <label className="fund-identity-label">Management company</label>
          <div className="fund-identity-input">
            <input
              type="text"
              className="fund-identity-input-inner"
              placeholder="Enter a management company..."
              value={formData.management_company || ""}
              onChange={handleChange("management_company")}
            />
          </div>
        </div>

        <div className="fund-identity-field fund-identity-field--full">
          <label className="fund-identity-label">Fund strategy<span className="fund-identity-required">*</span></label>
          <div className="fund-identity-input">
            <input
              type="text"
              placeholder="Enter fund strategy..."
              className="fund-identity-input-inner"
              value={formData.fund_strategy || ""}
              onChange={handleChange("fund_strategy")}
            />
          </div>
        </div>

        <div className="fund-identity-field">
          <label className="fund-identity-label">Fund's phase<span className="fund-identity-required">*</span></label>
          <div className="fund-identity-input">
            <select
              className="fund-identity-input-inner fund-identity-select"
              value={formData.phase_name || ""} 
              onChange={handleChange("phase_name")} 
              disabled={phasesLoading}
            >
              <option value="" disabled>Please select a phase</option>
              {phases?.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="fund-identity-select-chevron" />
          </div>
        </div>
      </form>

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