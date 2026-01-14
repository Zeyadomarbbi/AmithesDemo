import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useCurrencies } from "../../../../hooks/useCurrencies.js";
import { usePhases } from "../../../../hooks/useFundPhase.js";

import "./FundIdentity.css";


const FundIdentity = () => {
  const { fund } = useOutletContext();
  const { currencies } = useCurrencies();
  const { phases } = usePhases();

  const [formData, setFormData] = useState({
    legalName: "",
    shortName: "",
    formationDate: "",
    fundCurrencyId: "",
    currencyName: "",
    legalForm: "",
    managementCompany: "",
    fundStrategy: "",
    fundPhaseId: "",
  });

  useEffect(() => {
    if (fund) {
      setFormData({
        legalName: fund.legal_name || "",
        shortName: fund.short_name || "",
        formationDate: fund.formation_date_string || "",
        fundCurrencyId: fund.currency || "",
        currencyName: fund.currency_name || "",
        legalForm: fund.legal_form || "",
        managementCompany: fund.management_company || "",
        fundStrategy: fund.fund_strategy || "",
        fundPhaseId: fund.phase || "",
      });
    }
  }, [fund]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  return (
    <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Legal name<span className="required">*</span></label>
          <div className="field-input static-field">{formData.legalName}</div>
        </div>
        <div className="form-field">
          <label className="field-label">Short name<span className="required">*</span></label>
          <div className="field-input static-field">{formData.shortName || "—"}</div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Formation date<span className="required">*</span></label>
          <div className="field-input static-field">{formData.formationDate || "—"}</div>
        </div>
        <div className="form-field">
          <label className="field-label">Fund currency<span className="required">*</span></label>
          <div className="field-input static-field">{formData.currencyName || "—"}</div>
        </div>
      </div>

      <hr className="form-divider" />

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Legal form</label>
          <input 
            type="text" 
            className="field-input" 
            value={formData.legalForm} 
            onChange={handleChange("legalForm")} 
          />
        </div>
        <div className="form-field">
          <label className="field-label">Management company</label>
          <input 
            type="text" 
            className="field-input" 
            value={formData.managementCompany} 
            onChange={handleChange("managementCompany")} 
          />
        </div>
      </div>

      <div className="form-field form-field--full">
        <label className="field-label">Fund strategy<span className="required">*</span></label>
        <input 
          type="text" 
          className="field-input" 
          value={formData.fundStrategy} 
          onChange={handleChange("fundStrategy")} 
        />
      </div>

      <div className="form-field">
        <label className="field-label">Fund's phase<span className="required">*</span></label>
        <div className="field-input field-input--with-icon">
          <select 
            className="field-input-inner field-select" 
            value={formData.fundPhaseId} 
            onChange={handleChange("fundPhaseId")}
          >
            <option value="">Please select a phase</option>
            {phases.map((p) => (
              <option key={p.phase_id} value={p.phase_id}>{p.phase_name}</option>
            ))}
          </select>
          <span className="field-icon">▾</span>
        </div>
      </div>
    </form>
  );
};

export default FundIdentity;