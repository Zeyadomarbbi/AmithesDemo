// frontend/src/pages/App/pages/LPsStatement/components/NewLimitDrawer.jsx
import React, { useState } from "react";
import "./NewLimitDrawer.css";
import { ChevronDownIcon, CloseIcon, ChevronDoubleLeftIcon,} from "/src/pages/App/pages/LPsStatement/components/Icons.jsx";


export default function NewLimitDrawer({ open, onClose, onSave }) {
  if (!open) return null;

  const [name, setName] = useState("");
  const [ppmRef, setPpmRef] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("new-limit-overlay")) {
      onClose();
    }
  };

  const handleSave = () => {
    // build the row for the table
    const newLimit = {
      name: name || "",
      article: ppmRef || "",
      description: description || "",
      limit: rate || "",
      // for now use the same rate for Q4 – you can change later if needed
      q4: rate || "",
    };

    if (onSave) {
      onSave(newLimit);
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
            <ChevronDoubleLeftIcon />

          </button>

          <h2 className="new-limit-title">Adding a new limit</h2>

          <button
            type="button"
            className="new-limit-close-btn"
            onClick={onClose}
          >
           <CloseIcon />

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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">PPM reference</label>
              <input
                className="new-limit-input"
                placeholder="Enter the page or the article of the PPM"
                value={ppmRef}
                onChange={(e) => setPpmRef(e.target.value)}
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
                <span className="new-limit-select-chevron" aria-hidden="true">
  <ChevronDownIcon />
</span>

              </div>
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Min/Max</label>
              <div className="new-limit-select">
                <span className="new-limit-select-placeholder">
                  Select minimum or maximum
                </span>
               <span className="new-limit-select-chevron" aria-hidden="true">
  <ChevronDownIcon />
</span>

              </div>
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Rate</label>
              <input
                className="new-limit-input"
                placeholder="Enter a percentage"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
          <button
            type="button"
            className="new-limit-btn new-limit-btn-save"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </aside>
    </div>
  );
}
