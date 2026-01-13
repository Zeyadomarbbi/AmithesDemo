// src/pages/App/pages/LPsStatement/components/NewLPDrawer.jsx
import React, { useState } from "react";
import "./NewLPDrawer.css";

const EMPTY_FORM = {
  lpName: "",
  address: "",
  city: "",
  zip: "",
  country: "",
  iban: "",
  bankName: "",
  swift: "",
  shareType: "",
  currency: "",
  commitment: "",
  closing: "",
};

export default function NewLPDrawer({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!open) return null;

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose?.();
  };

  const handleSave = () => {
    if (!form.lpName.trim()) return; // simple required check

    onSave?.(form);        // 🔥 send data to parent
    setForm(EMPTY_FORM);   // reset form
    onClose?.();
  };

  return (
    <div className="drawer-backdrop" onClick={handleClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className="drawer-header">
          <button
            className="drawer-back-btn"
            type="button"
            onClick={handleClose}
          >
            «
          </button>
          <h2 className="drawer-title">Adding a new LP</h2>
          <button
            className="drawer-close-btn"
            type="button"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="drawer-content">
          {/* --- LP informations --- */}
          <div className="drawer-section">
            <div className="drawer-section-title">LP informations</div>

            <div className="field">
              <label className="field-label">LP name*</label>
              <input
                className="field-input"
                placeholder="Enter the share class name"
                value={form.lpName}
                onChange={updateField("lpName")}
              />
            </div>

            <div className="field field-with-icon">
              <label className="field-label">Adress*</label>
              <div className="field-input-with-icon">
                <input
                  className="field-input"
                  placeholder="ex : 10 000"
                  value={form.address}
                  onChange={updateField("address")}
                />
                <span className="field-icon">
                  {/* location icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 1.167C4.974 1.167 3.5 2.674 3.5 4.69C3.5 7.07 6.3 10.4 6.79 10.97C6.896 11.093 7.104 11.093 7.21 10.97C7.7 10.4 10.5 7.07 10.5 4.69C10.5 2.674 9.026 1.167 7 1.167ZM7 5.75A1.167 1.167 0 1 1 7 3.417 1.167 1.167 0 0 1 7 5.75Z"
                      fill="#375A89"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">City*</label>
                <input
                  className="field-input"
                  placeholder="ex : 10 000"
                  value={form.city}
                  onChange={updateField("city")}
                />
              </div>

              <div className="field">
                <label className="field-label">Zip code*</label>
                <input
                  className="field-input"
                  placeholder="00/00/00"
                  value={form.zip}
                  onChange={updateField("zip")}
                />
              </div>

              <div className="field">
                <label className="field-label">Country*</label>
                <div className="field-input-with-icon">
                  <select
                    className="field-input select-input"
                    value={form.country}
                    onChange={updateField("country")}
                  >
                    <option value="">ex : France</option>
                    <option value="France">France</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                  </select>
                  <span className="field-icon field-icon-chevron">⌄</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- Bank details --- */}
          <div className="drawer-section">
            <div className="drawer-section-title">Bank details</div>

            <div className="field">
              <label className="field-label">IBAN*</label>
              <input
                className="field-input"
                placeholder="ex : 10 000"
                value={form.iban}
                onChange={updateField("iban")}
              />
            </div>

            <div className="drawer-grid-2">
              <div className="field">
                <label className="field-label">Bank name*</label>
                <div className="field-input-with-icon">
                  <select
                    className="field-input select-input"
                    value={form.bankName}
                    onChange={updateField("bankName")}
                  >
                    <option value="">ex : France</option>
                    <option value="BNP Paribas">BNP Paribas</option>
                    <option value="Société Générale">Société Générale</option>
                  </select>
                  <span className="field-icon field-icon-chevron">⌄</span>
                </div>
              </div>

              <div className="field">
                <label className="field-label">SWIFT*</label>
                <input
                  className="field-input"
                  placeholder="ex : 10 000"
                  value={form.swift}
                  onChange={updateField("swift")}
                />
              </div>
            </div>
          </div>

          {/* --- Shares block --- */}
          <div className="drawer-section shares-panel">
            <div className="drawer-section-title">Shares</div>

            <div className="drawer-grid-2">
              <div className="field">
                <label className="field-label">Type of share*</label>
                <div className="field-input-with-icon">
                  <select
                    className="field-input select-input"
                    value={form.shareType}
                    onChange={updateField("shareType")}
                  >
                    <option value="">e.g. A</option>
                    <option value="Class A1">Class A1</option>
                    <option value="Class A2">Class A2</option>
                    <option value="Class B">Class B</option>
                  </select>
                  <span className="field-icon field-icon-chevron">⌄</span>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Currency*</label>
                <div className="field-input-with-icon">
                  <select
                    className="field-input select-input"
                    value={form.currency}
                    onChange={updateField("currency")}
                  >
                    <option value="">e.g. A</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                  <span className="field-icon field-icon-chevron">⌄</span>
                </div>
              </div>
            </div>

            <div className="drawer-grid-2">
              <div className="field field-input-with-suffix">
                <label className="field-label">Commitment*</label>
                <input
                  className="field-input"
                  placeholder="e.g.10 000"
                  type="number"
                  value={form.commitment}
                  onChange={updateField("commitment")}
                />
                <span className="field-suffix">€</span>
              </div>

              <div className="field">
                <label className="field-label">Closing *</label>
                <div className="field-input-with-icon">
                  <input
                    className="field-input"
                    placeholder="placeholder"
                    value={form.closing}
                    onChange={updateField("closing")}
                  />
                  {/* calendar icon */}
                  <span className="field-icon">
                    <svg
                      width="14"
                      height="15"
                      viewBox="0 0 14 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4 0C4.36819 0 4.66667 0.298477 4.66667 0.666667V1.33333H8.66667V0.666667C8.66667 0.298477 8.96514 0 9.33334 0C9.70153 0 10 0.298477 10 0.666667V1.33442C10.317 1.3366 10.594 1.34314 10.8346 1.3628C11.2093 1.39341 11.5538 1.45912 11.8773 1.62398C12.3791 1.87965 12.787 2.28759 13.0427 2.78936C13.2075 3.11292 13.2733 3.45738 13.3039 3.83212C13.3334 4.19291 13.3333 4.63581 13.3333 5.17245V10.8276C13.3333 11.3642 13.3334 11.8071 13.3039 12.1679C13.2733 12.5426 13.2075 12.8871 13.0427 13.2106C12.787 13.7124 12.3791 14.1204 11.8773 14.376C11.5538 14.5409 11.2093 14.6066 10.8346 14.6372C10.4738 14.6667 10.0309 14.6667 9.49422 14.6667H3.83912C3.30248 14.6667 2.85958 14.6667 2.49878 14.6372C2.12405 14.6066 1.77958 14.5409 1.45603 14.376C0.95426 14.1204 0.546312 13.7124 0.29065 13.2106C0.125789 12.8871 0.0600798 12.5426 0.029463 12.1679C-1.52091e-05 11.8071 -8.21607e-06 11.3642 2.87528e-07 10.8275V5.17247C-8.21607e-06 4.63582 -1.52091e-05 4.19291 0.029463 3.83212C0.0600798 3.45738 0.125789 3.11292 0.29065 2.78936C0.546312 2.28759 0.95426 1.87965 1.45603 1.62398C1.77958 1.45912 2.12405 1.39341 2.49878 1.3628C2.73932 1.34314 3.01636 1.3366 3.33333 1.33442V0.666667C3.33333 0.298477 3.63181 0 4 0ZM3.33333 2.66784C3.03632 2.66993 2.80309 2.67571 2.60736 2.6917C2.31508 2.71558 2.16561 2.75887 2.06135 2.81199C1.81046 2.93982 1.60649 3.1438 1.47866 3.39468C1.42553 3.49895 1.38225 3.64842 1.35837 3.94069C1.33385 4.24075 1.33333 4.62895 1.33333 5.2V5.33333H12V5.2C12 4.62895 11.9995 4.24075 11.975 3.94069C11.9511 3.64842 11.9078 3.49895 11.8547 3.39468C11.7268 3.1438 11.5229 2.93982 11.272 2.81199C11.1677 2.75887 11.0183 2.71558 10.726 2.6917C10.5302 2.67571 10.297 2.66993 10 2.66784V3.33333C10 3.70152 9.70153 4 9.33334 4C8.96514 4 8.66667 3.70152 8.66667 3.33333V2.66667H4.66667V3.33333C4.66667 3.70152 4.36819 4 4 4C3.63181 4 3.33333 3.70152 3.33333 3.33333V2.66784ZM12 6.66667H1.33333V10.8C1.33333 11.3711 1.33385 11.7592 1.35837 12.0593C1.38225 12.3516 1.42553 12.5011 1.47866 12.6053C1.60649 12.8562 1.81046 13.0602 2.06135 13.188C2.16561 13.2411 2.31508 13.2844 2.60736 13.3083C2.90742 13.3328 3.29561 13.3333 3.86667 13.3333H9.46667C10.0377 13.3333 10.4259 13.3328 10.726 13.3083C11.0183 13.2844 11.1677 13.2411 11.272 13.188C11.5229 13.0602 11.7268 12.8562 11.8547 12.6053C11.9078 12.5011 11.9511 12.3516 11.975 12.0593C11.9995 11.7592 12 11.3711 12 10.8V6.66667Z"
                        fill="#375A89"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* small Save inside Shares */}
            <div className="shares-inner-footer">
              <button
                type="button"
                className="btn-primary-wide shares-save-btn"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* ===== GLOBAL FOOTER ===== */}
        <div className="drawer-footer">
          <button
            className="btn-secondary-wide"
            type="button"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary-wide"
            type="button"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
