import React from "react";

const AddTransferModal = ({ open, onClose }) => {
  if (!open) return null;     // ✅ Only show when open === true

  const stopClick = (e) => e.stopPropagation();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={stopClick}>
        <div className="modal-header">
          <h2 className="modal-title">Add a transfer</h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body modal-grid">
          <div className="field">
            <label className="field-label">Commitment*</label>
            <input className="field-input" placeholder="e.g. 200 000" />
          </div>

          <div className="field">
            <label className="field-label">Date*</label>
            <div className="field-input-with-icon">
              <input className="field-input" placeholder="00/00/00" />
              <span className="field-icon-calendar" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">From*</label>
            <input className="field-input" placeholder="Select LP..." />
          </div>

          <div className="field">
            <label className="field-label">To*</label>
            <input className="field-input" placeholder="Select LP..." />
          </div>

          <div className="field">
            <label className="field-label">Type of share*</label>
            <input className="field-input" placeholder="e.g. A1" />
          </div>

          <div className="field">
            <label className="field-label">Type of share*</label>
            <input className="field-input" placeholder="e.g. A1" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary-wide" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary-wide">Save</button>
        </div>
      </div>
    </div>
  );
};

export default AddTransferModal;
