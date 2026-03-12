import React, { useState } from "react";
import "./NewInvestmentModal.css";
import { useCountries } from "../../../../../../hooks/Reference/useCountries";
import { useCurrencies } from "../../../../../../hooks/Reference/useCurrencies";
import SearchableSelect from "../../../../../../../../components/SearchBar/SearchableSelect.jsx";
import { CloseIcon, AddNewDocIcon } from '/src/components/Icons/InteractiveIcons';
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';

const NewInvestmentModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [countryId, setCountryId] = useState("");
  const [ownership, setOwnership] = useState("");
  const [currencyId, setCurrencyId] = useState("");

  const { countries = [] } = useCountries();
  const { currencies = [] } = useCurrencies();

  const ownershipNumber = Number(String(ownership).replace(/,/g, "").trim());
  const isOwnershipValid =
    Number.isFinite(ownershipNumber) && ownershipNumber >= 1 && ownershipNumber <= 100;

  const isValid = name && sector && countryId && currencyId && isOwnershipValid;

  const formattedCurrencies = currencies.map((c) => ({
    ...c,
    customLabel: `${c.currency_name || c.name || c.currency_code || c.code || ""}`,
    customSecondary: c.currency_code || c.code || "",
  }));

  const handleSave = async () => {
    if (!isValid) return;

    const selectedCountry = countries.find((c) => String(c.id) === String(countryId));
    const selectedCurrency =
      currencies.find((c) => String(c.currency_code) === String(currencyId)) ||
      currencies.find((c) => String(c.code) === String(currencyId)) ||
      currencies.find((c) => String(c.id) === String(currencyId));

    await onSave({
      name,
      sector,
      ownership: ownershipNumber,
      countryId,
      currencyId: selectedCurrency?.id || currencyId,
      countryName: selectedCountry?.name || "",
      currencyCode: selectedCurrency?.currency_code || selectedCurrency?.code || String(currencyId),
      currencyName: selectedCurrency?.currency_name || selectedCurrency?.name || "",
      currencySymbol: selectedCurrency?.currency_symbol || selectedCurrency?.symbol || "",
    });

    onClose();
  };

  return (
    <div className="portfolio-new-investment-overlay">
      <div className="portfolio-new-investment-card">

        {/* Header */}
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
            <p>Description</p>
          </div>
        </div>

        {/* Body */}
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
                placeholder="Please enter the sector..."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>

            <div className="portfolio-new-investment-form-group">
              <label className="portfolio-new-investment-label">Geography*</label>
              <SearchableSelect
                options={countries.map((c) => ({
                  ...c,
                  name: c.name || c.country_name || "",
                  code: c.iso3 || c.iso3_code || c.iso2 || c.iso2_code || "",
                }))}
                value={countryId}
                onChange={(val) => setCountryId(val)}
                placeholder="Select a country"
                labelKey="name"
                valueKey="id"
                secondaryLabelKey="code"
                triggerClassName="portfolio-new-investment-input"
              />
            </div>

            <div className="portfolio-new-investment-form-group">
              <label className="portfolio-new-investment-label">Ownership*</label>
              <div className="portfolio-new-investment-input-wrapper">
                <input
                  className="portfolio-new-investment-input"
                  placeholder="Please enter the ownership (1 - 100)..."
                  value={ownership}
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
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
                onChange={(val) => setCurrencyId(val)}
                placeholder="Select a currency"
                labelKey="customLabel"
                valueKey="id"
                secondaryLabelKey="customSecondary"
                triggerClassName="portfolio-new-investment-input"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="portfolio-new-investment-footer">
          <button className="portfolio-new-investment-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="portfolio-new-investment-btn-save"
            disabled={!isValid}
            onClick={handleSave}
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewInvestmentModal;