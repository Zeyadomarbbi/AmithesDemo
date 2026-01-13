// components/NewLimitPanel.jsx
import React from "react";
import { ArrowLeftIcon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

const NewLimitPanel = ({ onClose }) => {
  return (
    <div className="limit-panel-overlay" onClick={onClose}>
      <aside
        className="limit-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="limit-panel-header">
          <button className="limit-back-btn" onClick={onClose}>
            <ArrowLeftIcon className="icon-svg" style={smallIconStyle} />
          </button>

          <div className="limit-panel-title-block">
            <h2 className="limit-panel-title">Adding a new limit</h2>
          </div>

          <button className="limit-close-btn" onClick={onClose}>
            <XMarkIcon className="icon-svg" style={smallIconStyle} />
          </button>
        </div>

        {/* Body */}
        <div className="limit-panel-body">
          <h3 className="limit-section-title">General informations</h3>

          <div className="limit-form">
            {/* Name */}
            <div className="limit-form-field">
              <label className="limit-form-label">Name*</label>
              <input
                className="limit-form-input"
                type="text"
                placeholder="Enter the name of the limit"
              />
            </div>

            {/* PPM reference */}
            <div className="limit-form-field">
              <label className="limit-form-label">PPM reference</label>
              <input
                className="limit-form-input"
                type="text"
                placeholder="Enter the page or the article of the PPM"
              />
            </div>

            {/* Type of expense / Group of expense */}
            <div className="limit-form-row">
              <div className="limit-form-field">
                <label className="limit-form-label">Type of expense</label>
                <button className="limit-form-select">
                  <span>Select a type of expense</span>
                  <ChevronDownIcon
                    className="icon-svg caret-icon"
                    style={smallIconStyle}
                  />
                </button>
              </div>

              <div className="limit-form-field">
                <label className="limit-form-label">Group of expense</label>
                <input
                  className="limit-form-input"
                  type="text"
                  placeholder="Name of the group"
                />
              </div>
            </div>

            {/* Min/Max / Rate */}
            <div className="limit-form-row">
              <div className="limit-form-field">
                <label className="limit-form-label">Min/Max*</label>
                <input
                  className="limit-form-input"
                  type="text"
                  placeholder="Minimum or Maximum"
                />
              </div>

              <div className="limit-form-field">
                <label className="limit-form-label">Rate*</label>
                <input
                  className="limit-form-input"
                  type="text"
                  placeholder="Please enter a percentage"
                />
              </div>
            </div>

            {/* Description */}
            <div className="limit-form-field">
              <label className="limit-form-label">
                Description as per PPM*
              </label>
              <textarea
                className="limit-form-textarea"
                placeholder="Please type the description here..."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="limit-panel-footer">
          <button className="limit-footer-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="limit-footer-save">Save</button>
        </div>
      </aside>
    </div>
  );
};

export default NewLimitPanel;
