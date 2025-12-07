import React from "react";
import {
  ChevronLeftIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import "../styles/SidePanel.css";

const LimitSidePanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="sidepanel-overlay">
      <div className="sidepanel">
        <div className="sidepanel-header">
          <button
            type="button"
            className="sidepanel-back-btn"
            onClick={onClose}
          >
            <ChevronLeftIcon className="sidepanel-icon" />
          </button>

          <h2 className="sidepanel-title">Adding a new limit</h2>

          <button
            type="button"
            className="sidepanel-close-btn"
            onClick={onClose}
          >
            <XMarkIcon className="sidepanel-icon" />
          </button>
        </div>

        <div className="sidepanel-body">
          {/* General Info */}
          <h3 className="sidepanel-section-title">General informations</h3>

          <div className="form-group">
            <label className="form-label">
              Name<span className="required">*</span>
            </label>
            <input
              className="form-input"
              placeholder="Enter the name of the limit"
            />
          </div>

          <div className="form-group">
            <label className="form-label">PPM reference</label>
            <input
              className="form-input"
              placeholder="Enter the page or the article of the PPM"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type of expense</label>
            <div className="form-select">
              <span>Select a type of expense</span>
              <ChevronDownIcon className="icon-svg caret-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Group of expense</label>
            <input className="form-input" placeholder="Name of the group" />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">
                Min/Max<span className="required">*</span>
              </label>
              <input className="form-input" placeholder="Minimum or Maximum" />
            </div>

            <div className="form-group">
              <label className="form-label">
                Rate<span className="required">*</span>
              </label>
              <input
                className="form-input"
                placeholder="Please enter a percentage"
              />
            </div>
          </div>

          <hr className="form-divider" />

          {/* Description */}
          <h3 className="sidepanel-section-title">Description</h3>

          <div className="form-group">
            <label className="form-label">
              Description as per PPM<span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Please type the description here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimitSidePanel;