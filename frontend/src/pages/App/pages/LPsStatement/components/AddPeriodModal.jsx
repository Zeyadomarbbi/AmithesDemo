import React from "react";

const AddPeriodModal = ({ open, onClose }) => {
  if (!open) return null;   // ✅ Only show when open === true

  const stopClick = (e) => e.stopPropagation();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-small" onClick={stopClick}>
        <div className="modal-header">
          <h2 className="modal-title">Add new period</h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="field-label">Name *</label>
            <input
              className="field-input"
              placeholder="Please enter the period name..."
            />
          </div>

          <div className="field field-with-top-margin">
            <label className="field-label">End*</label>
            <div className="field-input-with-icon">
              <input className="field-input" placeholder="00/00/00" />
              <span className="field-icon-calendar" />
            </div>
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

export default AddPeriodModal;
