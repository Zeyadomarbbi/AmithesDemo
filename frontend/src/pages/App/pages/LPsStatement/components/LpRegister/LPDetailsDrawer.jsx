// src/pages/App/pages/LPsStatement/components/LPDetailsDrawer.jsx
import React from "react";
import "./LPDetailsDrawer.css";
import { ChevronDownIcon } from "../Icons.jsx";
import { CloseIcon } from "../Icons.jsx";
import { ChevronDoubleLeftIcon } from "../Icons.jsx";

const LPDetailsDrawer = ({ lp, open, onClose, onSave }) => {
  if (!open) return null;
  if (!lp) return null;

  const stopClick = (e) => e.stopPropagation();

  const handleClose = () => {
    onClose?.();
  };

  const handleSave = () => {
    // in the future you can pass edited values up here
    if (onSave) onSave(lp);
    handleClose();
  };

  return (
    <div className="drawer-backdrop" onClick={handleClose}>
      <aside className="drawer lp-details-drawer" onClick={stopClick}>
        {/* HEADER */}
        <header className="drawer-header lp-details-header">
          <button className="drawer-back-btn" type="button" onClick={handleClose}>
            <ChevronDoubleLeftIcon />
          </button>

          <div className="lp-details-title">
            <div className="lp-details-name">{lp.name}</div>
            <div className="lp-details-sub">
              Created on {lp.createdOn || "April 18, 2024"}
            </div>
          </div>

          <button
            className="drawer-close-btn"
            type="button"
            onClick={handleClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>


        {/* CONTENT */}
        <div className="drawer-content lp-details-content">
          {/* LP informations */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">LP informations</h3>

            <div className="field">
              <label className="field-label">LP name*</label>
              <input className="field-input" defaultValue={lp.name} />
            </div>

            <div className="field">
              <label className="field-label">Adress*</label>
              <input
                className="field-input"
                defaultValue={lp.address || "19 rue des Archives"}
              />
            </div>

            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">City*</label>
                <input
                  className="field-input"
                  defaultValue={lp.city || "Paris"}
                />
              </div>
              <div className="field">
                <label className="field-label">Zip code*</label>
                <input
                  className="field-input"
                  defaultValue={lp.zip || "75003"}
                />
              </div>
              <div className="field">
                <label className="field-label">Country*</label>
                                  <span className="field-icon field-icon-chevron">
                                    <ChevronDownIcon />
                                  </span>
                <select
                  className="field-input"
                  defaultValue={lp.country || "France"}
                >
                  
                  <option>France</option>
                  <option>UAE</option>
                  <option>UK</option>
                </select>
              </div>
            </div>
          </section>

          {/* Bank details */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Bank details</h3>

            <div className="field">
              <label className="field-label">IBAN*</label>
              <input
                className="field-input"
                defaultValue={lp.iban || "FR 3930 1234 5678 910"}
              />
            </div>

            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">Bank name*</label>
                <select
                  className="field-input"
                  defaultValue={lp.bank || "BNP Paribas"}
                >
                  <option>BNP Paribas</option>
                  <option>HSBC</option>
                  <option>ADCB</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">BIC*</label>
                <input
                  className="field-input"
                  defaultValue={lp.bic || "SWIFTXXX"}
                />
              </div>
            </div>
          </section>

          {/* Shares table */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Shares</h3>

            <div className="shares-mini-table">
              <div className="shares-mini-header">
                <div>Type of share</div>
                <div>Currency</div>
                <div>Commitment</div>
                <div>Closing</div>
                <div />
              </div>

              {(lp.sharesRows || [
                {
                  type: lp.class,
                  currency: "Euros (€)",
                  commitment: `${lp.commitment} €`,
                  closing: "1st Closing",
                },
              ]).map((r, i) => (
                <div className="shares-mini-row" key={i}>
                  <div>
                    <span className={`tag ${lp.classColor}`}>{r.type}</span>
                  </div>
                  <div>{r.currency}</div>
                  <div>{r.commitment}</div>
                  <div>{r.closing}</div>
                  <div className="dots">⋮</div>
                </div>
              ))}

              <button className="new-tranche-btn" type="button">
                + New tranche
              </button>
            </div>
          </section>
        </div>

        {/* FOOTER (sticky at bottom) */}
        <footer className="drawer-footer lp-details-footer">
          <button
            type="button"
            className="btn-secondary-wide"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-wide"
            onClick={handleSave}
          >
            Save
          </button>
        </footer>
      </aside>
    </div>
  );
};

export default LPDetailsDrawer;
