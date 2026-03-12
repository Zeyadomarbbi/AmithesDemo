import React, { useState } from "react";
import { useCountries } from "../../../../../../../../../hooks/Reference/useCountries";
import { useCurrencies } from "../../../../../../../../../hooks/Reference/useCurrencies";
import { usePortfolio } from "../../../../../../../../../hooks/Portfolio/usePortfolio.js";
import { CloseIcon, AddNewDocIcon } from '/src/components/Icons/InteractiveIcons';
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';
import SearchableSelect from "../../../../../../../../../../../components/SearchBar/SearchableSelect.jsx";
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

  // Format currencies to align with SearchableSelect rendering logic
  const formattedCurrencies = currencies.map(c => ({
    ...c,
    customLabel: `${c.name} - ${c.code}`,
    customSecondary: c.symbol
  }));

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
              <SearchableSelect
                options={countries}
                value={countryId}
                onChange={setCountryId}
                placeholder="Select a country"
                labelKey="name"
                secondaryLabelKey="iso2"
                valueKey="id"
                triggerClassName="portfolio-new-investment-input"
              />
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
              <SearchableSelect
                options={formattedCurrencies}
                value={currencyId}
                onChange={setCurrencyId}
                placeholder="Select a currency"
                labelKey="customLabel"
                secondaryLabelKey="customSecondary"
                valueKey="id"
                triggerClassName="portfolio-new-investment-input"
              />
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