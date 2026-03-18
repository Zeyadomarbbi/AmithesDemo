import React, { useMemo, useState } from "react";
import "./NewInvestmentModal.css";
import SearchableSelect from "../../../../../../../../components/SearchBar/SearchableSelect.jsx";
import { CloseIcon, AddNewDocIcon } from '/src/components/Icons/InteractiveIcons';
import { PercentageIcon } from '/src/components/Icons/NumericalIcons';

const NewInvestmentModal = ({ onClose, onSave, initialValues = null, mode = "create", countries = [], currencies = [] }) => {
  const [name, setName] = useState(initialValues?.name || "");
  const [sector, setSector] = useState(initialValues?.sector || "");
  const [countryId, setCountryId] = useState(initialValues?.countryId || "");
  const [ownership, setOwnership] = useState(
    initialValues?.ownership !== undefined && initialValues?.ownership !== null
      ? String(initialValues.ownership)
      : ""
  );
  const [currencyId, setCurrencyId] = useState(initialValues?.currencyId || "");

  const ownershipNumber = Number(String(ownership).replace(/,/g, "").trim());
  const isOwnershipValid =
    Number.isFinite(ownershipNumber) && ownershipNumber >= 0 && ownershipNumber <= 100;

  const formattedCurrencies = currencies.map((c) => ({
    ...c,
    customLabel: `${c.currency_name || c.name || c.currency_code || c.code || ""}`,
    customSecondary: c.currency_code || c.code || "",
  }));

  const headerTitle = mode === "edit" ? "Edit investment" : "Create a new investment";
  const headerDescription = mode === "edit"
    ? "Update the investment details."
    : "Description";
  const saveLabel = mode === "edit" ? "Update" : "Save";

  const resolvedCountryId = useMemo(() => {
    if (countryId) return countryId;
    if (!initialValues?.countryName) return "";
    const match = countries.find((c) => {
      const countryName = c.name || c.country_name || "";
      return String(countryName).trim().toLowerCase() === String(initialValues.countryName).trim().toLowerCase();
    });
    return match?.id || "";
  }, [countryId, countries, initialValues]);

  const resolvedCurrencyId = useMemo(() => {
    if (currencyId) return currencyId;
    if (!initialValues) return "";
    const match = currencies.find((c) => {
      const code = c.currency_code || c.code || "";
      const name = c.currency_name || c.name || "";
      return (
        String(code).trim().toLowerCase() === String(initialValues.currencyCode || "").trim().toLowerCase() ||
        String(name).trim().toLowerCase() === String(initialValues.currencyName || "").trim().toLowerCase()
      );
    });
    return match?.id || "";
  }, [currencyId, currencies, initialValues]);

  const isValid = name && sector && resolvedCountryId && resolvedCurrencyId && isOwnershipValid;

  const handleSave = async () => {
    if (!isValid) return;

    const selectedCountry = countries.find((c) => String(c.id) === String(resolvedCountryId));
    const selectedCurrency =
      currencies.find((c) => String(c.currency_code) === String(resolvedCurrencyId)) ||
      currencies.find((c) => String(c.code) === String(resolvedCurrencyId)) ||
      currencies.find((c) => String(c.id) === String(resolvedCurrencyId));

    await onSave({
      name,
      sector,
      ownership: ownershipNumber,
      countryId: resolvedCountryId,
      currencyId: selectedCurrency?.id || resolvedCurrencyId,
      countryName: selectedCountry?.name || "",
      currencyCode: selectedCurrency?.currency_code || selectedCurrency?.code || String(resolvedCurrencyId),
      currencyName: selectedCurrency?.currency_name || selectedCurrency?.name || "",
      currencySymbol: selectedCurrency?.currency_symbol || selectedCurrency?.symbol || "",
    });

    onClose();
  };

  return (
    <div
      className="portfolio-new-investment-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="portfolio-new-investment-card"
        onClick={(e) => e.stopPropagation()}
      >

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
            <h2>{headerTitle}</h2>
            <p>{headerDescription}</p>
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
                value={resolvedCountryId}
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
                  placeholder="Please enter the ownership (0 - 100)..."
                  value={ownership}
                  type="number"
                  min="0"
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
                value={resolvedCurrencyId}
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
            {saveLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewInvestmentModal;
