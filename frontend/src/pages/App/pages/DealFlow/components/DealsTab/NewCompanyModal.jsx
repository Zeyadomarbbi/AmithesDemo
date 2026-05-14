import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import "./NewCompanyModal.css";

function NewCompanyModal({ onClose, onNext }) {
  const [companyName, setCompanyName] = useState("");
  const [codeName, setCodeName] = useState("");

  const handleNext = () => {
    onNext?.({ companyName, codeName });
    onClose();
  };

  return (
    <div className="ncm-overlay" onClick={onClose}>
      <div className="ncm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ncm-header">
          <button className="ncm-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="ncm-body">
          <h2 className="ncm-title">Create a company</h2>

          <div className="ncm-field">
            <label className="ncm-label">Company name*</label>
            <input
              type="text"
              className="ncm-input"
              placeholder="placeholder"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="ncm-field">
            <label className="ncm-label">Code name*</label>
            <input
              type="text"
              className="ncm-input"
              placeholder="placeholder"
              value={codeName}
              onChange={(e) => setCodeName(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="ncm-footer">
          <button className="ncm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ncm-btn-next" onClick={handleNext}>Next</button>
        </div>

      </div>
    </div>
  );
}

export default NewCompanyModal;
