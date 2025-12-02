// frontend/src/pages/App/pages/LPsStatement/components/NewLimitDrawer.jsx
import React from "react";
import "./NewLimitDrawer.css";

export default function NewLimitDrawer({ open, onClose }) {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("new-limit-overlay")) {
      onClose();
    }
  };

  return (
    <div className="new-limit-overlay" onClick={handleOverlayClick}>
      <aside className="new-limit-panel">
        {/* HEADER */}
        <div className="new-limit-header">
          <button
            type="button"
            className="new-limit-back-btn"
            onClick={onClose}
          >
            ‹‹
          </button>

          <h2 className="new-limit-title">Adding a new limit</h2>

          <button
            type="button"
            className="new-limit-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="new-limit-body">
          {/* General information */}
          <section className="new-limit-section">
            <div className="new-limit-section-label">General information</div>

            <div className="new-limit-field">
              <label className="new-limit-label">Name</label>
              <input
                className="new-limit-input"
                placeholder="Enter the the name of the limit"
              />
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">PPM reference</label>
              <input
                className="new-limit-input"
                placeholder="Enter the page or the article of the PPM"
              />
            </div>
          </section>

          <hr className="new-limit-divider" />

          {/* Figures */}
          <section className="new-limit-section">
            <div className="new-limit-section-label">Figures</div>

            <div className="new-limit-field">
              <label className="new-limit-label">Type of shares</label>
              <div className="new-limit-select">
                <span className="new-limit-select-placeholder">
                  Select a share class
                </span>
                <span className="new-limit-select-chevron" />
              </div>
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Min/Max</label>
              <div className="new-limit-select">
                <span className="new-limit-select-placeholder">
                  Select minimum or maximum
                </span>
                <span className="new-limit-select-chevron" />
              </div>
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Rate</label>
              <input
                className="new-limit-input"
                placeholder="Enter a percentage"
              />
            </div>
          </section>

          <hr className="new-limit-divider" />

          {/* Description */}
          <section className="new-limit-section">
            <div className="new-limit-section-label">
              Description as per PPM *
            </div>
            <textarea
              className="new-limit-textarea"
              placeholder="Please type the description here..."
            />
          </section>
        </div>

        {/* FOOTER */}
        <div className="new-limit-footer">
          <button
            type="button"
            className="new-limit-btn new-limit-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="button" className="new-limit-btn new-limit-btn-save">
            Save
          </button>
        </div>
      </aside>
    </div>
  );
}
