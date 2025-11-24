import React from "react";

const NewLPDrawer = ({ open, onClose }) => {
  
  // ✅ ADD THIS LINE — prevents drawer from showing when "open" is false
  if (!open) return null;

  const stopClick = (e) => e.stopPropagation();

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={stopClick}>
        <header className="drawer-header">
          <button className="drawer-back-btn" onClick={onClose}>‹</button>
          <h2 className="drawer-title">Adding a new LP</h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </header>

        <div className="drawer-content">
          <section className="drawer-section">
            <h3 className="drawer-section-title">LP informations</h3>

            <div className="field">
              <label className="field-label">LP name*</label>
              <input className="field-input" placeholder="Enter LP name" />
            </div>

            <div className="field">
              <label className="field-label">Adress*</label>
              <input className="field-input" />
            </div>

            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">City*</label>
                <input className="field-input" />
              </div>
              <div className="field">
                <label className="field-label">Zip code*</label>
                <input className="field-input" />
              </div>
              <div className="field">
                <label className="field-label">Country*</label>
                <input className="field-input" placeholder="France" />
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section-title">Bank details</h3>

            <div className="field">
              <label className="field-label">IBAN*</label>
              <input className="field-input" />
            </div>

            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">Bank name*</label>
                <input className="field-input" />
              </div>
              <div className="field">
                <label className="field-label">SWIFT*</label>
                <input className="field-input" />
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section-title">Shares</h3>

            <div className="drawer-grid-4">
              <div className="field">
                <label className="field-label">Type of share*</label>
                <input className="field-input" placeholder="A1" />
              </div>
              <div className="field">
                <label className="field-label">Currency*</label>
                <input className="field-input" placeholder="€" />
              </div>
              <div className="field">
                <label className="field-label">Commitment*</label>
                <input className="field-input" placeholder="10 000" />
              </div>
              <div className="field">
                <label className="field-label">Closing*</label>
                <input className="field-input" placeholder="00/00/00" />
              </div>
            </div>
          </section>
        </div>

        <footer className="drawer-footer">
          <button className="btn-secondary-wide" onClick={onClose}>Cancel</button>
          <button className="btn-primary-wide">Save</button>
        </footer>
      </aside>
    </div>
  );
};

export default NewLPDrawer;
