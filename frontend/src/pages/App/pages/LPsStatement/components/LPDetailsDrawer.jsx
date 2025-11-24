import React from "react";

const LPDetailsDrawer = ({ lp, open, onClose }) => {
  if (!open) return null;       // <-- drawer only renders if open === true
  if (!lp) return null;         // <-- drawer only renders if we have an LP selected

  const stopClick = (e) => e.stopPropagation();

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer lp-details-drawer" onClick={stopClick}>
        {/* Header */}
        <header className="drawer-header">
          <button className="drawer-back-btn" onClick={onClose}>‹</button>

          <div className="lp-details-title">
            <div className="lp-details-name">{lp.name}</div>
            <div className="lp-details-sub">
              Created on {lp.createdOn || "April 18, 2024"}
            </div>
          </div>

          <button className="icon-button" onClick={onClose}>✕</button>
        </header>

        {/* Content */}
        <div className="drawer-content">

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
                <div></div>
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
      </aside>
    </div>
  );
};

export default LPDetailsDrawer;
