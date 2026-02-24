import React, { useState } from "react";
import "./NewInvestmentModal.css";
import { useCountries } from "../../../../../hooks/Reference/useCountries";
import { useCurrencies } from "../../../../../hooks/Reference/useCurrencies";

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

  const isValid =
    name && sector && countryId && currencyId && isOwnershipValid;

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
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_24703_21077)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.29892 0.833985L11.6667 0.833985C11.8877 0.833985 12.0996 0.921782 12.2559 1.07806L17.2559 6.07806C17.4122 6.23434 17.5 6.44631 17.5 6.66732V14.3684C17.5 15.0392 17.5 15.5928 17.4632 16.0438C17.4249 16.5123 17.3428 16.9428 17.1367 17.3473C16.8171 17.9745 16.3072 18.4844 15.68 18.804C15.2755 19.0101 14.8449 19.0922 14.3765 19.1305C13.9255 19.1673 13.3719 19.1673 12.7011 19.1673H7.2989C6.6281 19.1673 6.07447 19.1673 5.62348 19.1305C5.15506 19.0922 4.72448 19.0101 4.32003 18.804C3.69283 18.4844 3.18289 17.9745 2.86331 17.3473C2.65724 16.9428 2.5751 16.5123 2.53683 16.0438C2.49998 15.5928 2.49999 15.0392 2.5 14.3684V5.6329C2.49999 4.96209 2.49998 4.40846 2.53683 3.95746C2.5751 3.48905 2.65724 3.05846 2.86331 2.65402C3.18289 2.02681 3.69283 1.51687 4.32003 1.1973C4.72448 0.991221 5.15506 0.909084 5.62348 0.870813C6.07448 0.833965 6.62811 0.833974 7.29892 0.833985ZM5.7592 2.53194C5.39385 2.56179 5.20702 2.6159 5.07668 2.68231C4.76308 2.8421 4.50811 3.09706 4.34832 3.41067C4.28192 3.541 4.22781 3.72784 4.19796 4.09318C4.16732 4.46826 4.16667 4.9535 4.16667 5.66732V14.334C4.16667 15.0478 4.16732 15.533 4.19796 15.9081C4.22781 16.2735 4.28192 16.4603 4.34832 16.5906C4.50811 16.9042 4.76308 17.1592 5.07668 17.319C5.20702 17.3854 5.39385 17.4395 5.7592 17.4694C6.13427 17.5 6.61952 17.5007 7.33333 17.5007H12.6667C13.3805 17.5007 13.8657 17.5 14.2408 17.4694C14.6061 17.4395 14.793 17.3854 14.9233 17.319C15.2369 17.1592 15.4919 16.9042 15.6517 16.5906C15.7181 16.4603 15.7722 16.2735 15.802 15.9081C15.8327 15.533 15.8333 15.0478 15.8333 14.334V7.50071L12.9734 7.50071C12.7631 7.50074 12.5583 7.50076 12.3848 7.48659C12.1943 7.47103 11.9695 7.4343 11.7433 7.31906C11.4297 7.15927 11.1748 6.9043 11.015 6.5907C10.8997 6.36451 10.863 6.13973 10.8475 5.94924C10.8333 5.77577 10.8333 5.57094 10.8333 5.36061L10.8333 2.50065H7.33333C6.61952 2.50065 6.13427 2.5013 5.7592 2.53194ZM12.5 3.67916L14.6549 5.83404H13C12.7529 5.83404 12.6177 5.8334 12.5205 5.82546C12.5167 5.82514 12.513 5.82482 12.5095 5.8245C12.5092 5.82105 12.5089 5.81739 12.5086 5.81352C12.5006 5.71636 12.5 5.58115 12.5 5.33405V3.67916ZM10 9.16732C10.4602 9.16732 10.8333 9.54041 10.8333 10.0007V11.6673H12.5C12.9602 11.6673 13.3333 12.0404 13.3333 12.5007C13.3333 12.9609 12.9602 13.334 12.5 13.334H10.8333V15.0007C10.8333 15.4609 10.4602 15.834 10 15.834C9.53976 15.834 9.16667 15.4609 9.16667 15.0007V13.334H7.5C7.03976 13.334 6.66667 12.9609 6.66667 12.5007C6.66667 12.0404 7.03976 11.6673 7.5 11.6673H9.16667V10.0007C9.16667 9.54041 9.53976 9.16732 10 9.16732Z"
                    fill="#375A89"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_24703_21077">
                    <rect width="20" height="20" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            <div>
              <h2>Create a new investment</h2>
              <p>Description</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-group full">
            <label>Investment name*</label>
            <input
              placeholder="Please enter the investment name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
  <label>Sector*</label>
  <input
    placeholder="Please enter the sector..."
    value={sector}
    onChange={(e) => setSector(e.target.value)}
  />
</div>


            <div className="form-group">
              <label>Geography*</label>
              <select value={countryId} onChange={(e) => setCountryId(e.target.value)}>
                <option value="">Select a country</option>
                {countries.map((c) => {
                  const name = c.name || c.country_name || "";
                  const code = c.iso3 || c.iso3_code || c.iso2 || c.iso2_code || "";
                  const label = code ? `${name} (${code})` : name;
                  return (
                    <option key={c.id} value={c.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>Ownership*</label>
              <input
                placeholder="Please enter the ownership (1 - 100)..."
                value={ownership}
                type="number"
                min="1"
                max="100"
                step="0.01"
                onChange={(e) => setOwnership(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Local Currency*</label>
              <select value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}>
                <option value="">Select a currency</option>
                {currencies.map((c) => {
                  const code = c.currency_code || c.code || "";
                  const name = c.currency_name || c.name || code;
                  const symbol = c.currency_symbol || c.symbol || "";
                  return (
                    <option key={c.id} value={c.id}>
                      {`${name} (${code}) ${symbol}`.trim()}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-save"
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

