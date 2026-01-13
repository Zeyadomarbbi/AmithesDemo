// components/NewInvestmentModal.jsx
import React from "react";
import {
  DocumentIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const iconStyle = {
  color: "#111827",
  stroke: "#111827",
  strokeWidth: 1.5,
  width: 20,
  height: 20,
};

const smallIconStyle = {
  ...iconStyle,
  width: 14,
  height: 14,
};

const NewInvestmentModal = ({ onClose }) => {
  return (
    <div className="investment-modal-overlay" onClick={onClose}>
      <div
        className="investment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="investment-modal-header">
          <div className="investment-modal-icon">
            <DocumentIcon className="icon-svg" style={iconStyle} />
          </div>
          <div className="investment-modal-title-block">
            <h2 className="investment-modal-title">
              Create a new investment
            </h2>
            <p className="investment-modal-subtitle">Description</p>
          </div>
          <button
            className="investment-modal-close"
            onClick={onClose}
          >
            <XMarkIcon className="icon-svg" style={iconStyle} />
          </button>
        </div>

        {/* Body */}
        <div className="investment-modal-body">
          <div className="investment-field">
            <label className="investment-label">Investment name*</label>
            <input
              className="investment-input"
              type="text"
              placeholder="Please enter the investment name..."
            />
          </div>

          <div className="investment-row">
            <div className="investment-field">
              <label className="investment-label">Sector*</label>
              <button className="investment-select">
                <span>Select a sector</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
            </div>
            <div className="investment-field">
              <label className="investment-label">Geography*</label>
              <button className="investment-select">
                <span>Select a country</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
            </div>
          </div>

          <div className="investment-row">
            <div className="investment-field">
              <label className="investment-label">Ownership*</label>
              <input
                className="investment-input"
                type="text"
                placeholder="Please enter the ownership..."
              />
            </div>
            <div className="investment-field">
              <label className="investment-label">Local Currency*</label>
              <button className="investment-select">
                <span>Select a currency</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="investment-modal-footer">
          <button
            className="investment-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="investment-save-btn">Save</button>
        </div>
      </div>
    </div>
  );
};

export default NewInvestmentModal;
