import React, { useState, useEffect, useRef, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useFundData, useFundDetails } from "../../../../hooks/Core/FundContext";
import { useCurrencies } from "../../../../hooks/Reference/useCurrencies.js";
import { usePhases } from "../../../../hooks/Reference/useFundPhase.js";
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput.jsx";
import Toast from '../../../../components/Toast/Toast.jsx';
import SimpleDropdown from "../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import "./FundIdentity.css";

const FundIdentity = () => {
  const { fundId } = useOutletContext();
  const [toast, setToast] = useState(null);
  const { fund: serverData, isFundLoading, error, refetch } = useFundDetails(fundId);
  const { updateFund } = useFundData();
  const { phases, isLoading: phasesLoading } = usePhases();
  const { currencies, isLoading: currenciesLoading } = useCurrencies();

  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  console.log("FundIdentity Rendered with serverData:", serverData);
  useEffect(() => {
    if (serverData) {
      setFormData({
        legal_name: serverData.name || "",
        short_name: serverData.shortName || "",
        formation_date: serverData.formationDate || "",
        currency_id: serverData.currencyId || "",
        fund_strategy: serverData.strategy || "",
        legal_form: serverData.legalForm || "",
        management_company: serverData.manCo || "",
        phase_name: serverData.phaseName || "",
      });
    }
  }, [serverData]);

  // Logic to determine if the mandatory fields are populated
  const isFormValid = useMemo(() => {
    return (
      formData.legal_name?.trim() &&
      formData.short_name?.trim() &&
      formData.formation_date &&
      formData.currency_id &&
      formData.fund_strategy?.trim() &&
      formData.phase_name
    );
  }, [formData]);

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
      formation_date: isoDate, 
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
    if (!isFormValid) return;
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

      const result = await updateFund(fundId, payload);
      await refetch();

      if (result.success) {
        setToast({
          type: "success",
          title: "Saved Successfully",
          message: "Fund identity has been updated."
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setToast({
        type: "error",
        title: "Save Failed",
        message: err.message
      });
      } finally {
      // Guaranteed reset of the button state
      setIsSaving(false);
    }
  };

  if (isFundLoading) return <div className="fund-identity-loader">Loading Fund Identity...</div>;
  if (error) return <div className="fund-identity-error">Error: {error}</div>;

  return (
    <div className="fund-identity-wrapper">
      <form className="fund-identity-form" onSubmit={(e) => e.preventDefault()}>
        
        {/* REQUIRED */}
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

        {/* REQUIRED */}
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

        {/* REQUIRED */}
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

        {/* REQUIRED */}
        <div className="fund-identity-field">
          <label className="fund-identity-label">Fund currency<span className="fund-identity-required">*</span></label>
            <SimpleDropdown
                options={currencies.map((c) => ({
                    id: c.id,
                    name: `${c.currency_name || c.name} (${c.currency_code || c.code} — ${c.currency_symbol || c.symbol})`,
                }))}
                value={formData.currency_id}
                onChange={(val) => handleChange("currency_id")({ target: { value: val } })}
                placeholder={currenciesLoading ? "Loading..." : "Please select"}
                disabled={currenciesLoading}
            />
        </div>
        {/* OPTIONAL */}
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

        {/* OPTIONAL */}
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

        {/* REQUIRED */}
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

        {/* REQUIRED */}
        <div className="fund-identity-field">
          <label className="fund-identity-label">Fund's phase<span className="fund-identity-required">*</span></label>
              <SimpleDropdown
                  options={phases}
                  value={formData.phase_name}
                  onChange={(val) => handleChange("phase_name")({ target: { value: val } })}
                  placeholder={phasesLoading ? "Loading..." : "Please select a phase"}
                  disabled={phasesLoading}
                  labelKey="name"
                  valueKey="name"
              />
        </div>
      </form>

      <div className="fund-identity-footer">
        <div className="fund-identity-actions">
          <button 
            className="fund-identity-btn-save" 
            onClick={handleSave}
            disabled={isSaving || !isFormValid}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          {toast && (
            <Toast
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FundIdentity;
