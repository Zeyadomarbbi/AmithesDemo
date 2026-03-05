import React, { useState } from "react";
import { useCountries } from "../../../../../../../../../hooks/Reference/useCountries";
import { useCurrencies } from "../../../../../../../../../hooks/Reference/useCurrencies";
import { usePortfolio } from "../../../../../../../../../hooks/Portfolio/usePortfolio.js";
import { CloseIcon, AddNewDocIcon } from '/src/components/Icons/InteractiveIcons';
import { ChevronDownIcon } from '/src/components/Icons/DirectionIcons';
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';
import "./NewInvestmentModal.css";

const NewInvestmentModal = ({ fundId, scenarioId, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [countryId, setCountryId] = useState("");
  const [ownership, setOwnership] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { createInvestment } = usePortfolio(fundId);
  const { countries = [] } = useCountries();
  const { currencies = [] } = useCurrencies();

  const ownershipNumber = Number(String(ownership).replace(/,/g, "").trim());
  const isOwnershipValid = Number.isFinite(ownershipNumber) && ownershipNumber >= 1 && ownershipNumber <= 100;

  const isValid = name && sector && countryId && currencyId && isOwnershipValid;

  const handleSave = async () => {
    if (!isValid) return;
    setIsCreating(true);
    try {
      const selectedCurrency = currencies.find((c) => 
        String(c.currency_code) === String(currencyId) || 
        String(c.id) === String(currencyId)
      );

      const payload = {
        name,
        sector,
        ownership: ownershipNumber,
        country_id: countryId,
        currency_id: selectedCurrency?.id || currencyId,
      };

      await createInvestment(scenarioId, payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Immediate creation failed", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="portfolio-new-investment-overlay">
      <div className="portfolio-new-investment-card">
        <div className="portfolio-new-investment-header">
          <div className="portfolio-new-investment-header-top">
            <div className="portfolio-new-investment-icon" aria-hidden="true">
              <AddNewDocIcon />
            </div>
            <button className="portfolio-new-investment-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="portfolio-new-investment-header-text">
            <h2>Create a new investment</h2>
            <p>Scenario Projection Investment</p>
          </div>
        </div>

        <div className="portfolio-new-investment-body">
          <div className="portfolio-new-investment-form-group">
            <label className="portfolio-new-investment-label">Investment name*</label>
            <input
              className="portfolio-new-investment-input"
              placeholder="Please enter the investment name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="portfolio-new-investment-form-grid">
            <div className="portfolio-new-investment-form-group">
              <label className="portfolio-new-investment-label">Sector*</label>
              <input
                className="portfolio-new-investment-input"
                placeholder="Select a sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>

            <div className="portfolio-new-investment-form-group">
              <label className="portfolio-new-investment-label">Geography*</label>
              <div className="portfolio-new-investment-select-wrapper">
                <select 
                  className="portfolio-new-investment-select" 
                  value={countryId} 
                  onChange={(e) => setCountryId(e.target.value)}
                  required
                >
                  <option value="" disabled hidden>Select a country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="portfolio-new-investment-select-icon">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="portfolio-new-investment-form-group">
              <label className="portfolio-new-investment-label">Ownership*</label>
              <div className="portfolio-new-investment-input-wrapper">
                <input
                  className="portfolio-new-investment-input"
                  placeholder="Please enter the ownership..."
                  value={ownership}
                  type="number"
                  min="1" max="100" step="0.01"
                  onChange={(e) => setOwnership(e.target.value)}
                />
                <div className="portfolio-new-investment-input-icon">
                  <PercentageIcon />
                </div>
              </div>
            </div>

            <div className="portfolio-new-investment-form-group">
              <label className="portfolio-new-investment-label">Local Currency*</label>
              <div className="portfolio-new-investment-select-wrapper">
                <select 
                  className="portfolio-new-investment-select" 
                  value={currencyId} 
                  onChange={(e) => setCurrencyId(e.target.value)}
                  required
                >
                  <option value="" disabled hidden>Select a currency</option>
                  {currencies.map((curr) => (
                    <option key={curr.id} value={curr.id}>
                      {curr.name} - {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
                <div className="portfolio-new-investment-select-icon">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="portfolio-new-investment-footer">
          <button className="portfolio-new-investment-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="portfolio-new-investment-btn-save"
            disabled={!isValid || isCreating}
            onClick={handleSave}
          >
            {isCreating ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInvestmentModal;