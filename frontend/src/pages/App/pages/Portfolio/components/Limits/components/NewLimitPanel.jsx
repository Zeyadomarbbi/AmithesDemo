import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, CloseIcon, SelectIcon } from "../../../icons"; 
import "./NewLimitPanel.css"; 

const NewLimitPanel = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    ppm_reference: "",
    expense_type: "",
    expense_group: "",
    min_max: "",
    rate: "",
    description: ""
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Reset form whenever the panel is opened
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        ppm_reference: "",
        expense_type: "",
        expense_group: "",
        min_max: "",
        rate: "",
        description: ""
      });
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  return (
    <div className="portfolio-new-limit-overlay" onClick={onClose}>
      <div 
        className={`portfolio-new-limit-panel ${isExpanded ? "portfolio-new-limit-panel--expanded" : ""}`} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Standardized Header */}
        <div className="portfolio-new-limit-header">
          <div className="portfolio-new-limit-header-actions">
            <button 
              type="button" 
              className={`portfolio-new-limit-back ${isExpanded ? "portfolio-new-limit-back--rotated" : ""}`} 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronLeftIcon />
            </button>
            
            <button type="button" className="portfolio-new-limit-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="portfolio-new-limit-title">Adding a new limit</div>
        </div>

        {/* Standardized Body */}
        <div className="portfolio-new-limit-body">
          <div className="portfolio-new-limit-section">
            <div className="portfolio-new-limit-section-label">General informations</div>
            
            <div className="portfolio-new-limit-field">
              <label className="portfolio-new-limit-label">Name*</label>
              <input 
                type="text" 
                className="portfolio-new-limit-input" 
                placeholder="Enter the name of the limit"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="portfolio-new-limit-field">
              <label className="portfolio-new-limit-label">PPM reference</label>
              <input 
                type="text" 
                className="portfolio-new-limit-input" 
                placeholder="Enter the page or the article of the PPM"
                value={formData.ppm_reference}
                onChange={(e) => handleChange("ppm_reference", e.target.value)}
              />
            </div>

            <div className="portfolio-new-limit-field">
              <label className="portfolio-new-limit-label">Type of expense</label>
              <div className="portfolio-new-limit-select-wrapper">
                <select 
                  className="portfolio-new-limit-select" 
                  value={formData.expense_type}
                  onChange={(e) => handleChange("expense_type", e.target.value)}
                  required 
                >
                  <option value="" disabled hidden>Select a type of expense</option>
                  <option value="mgmt">Management Fees</option>
                  <option value="ops">Organizational Expenses</option>
                  <option value="other">Other</option>
                </select>
                <div className="portfolio-new-limit-select-icon">
                  <SelectIcon />
                </div>
              </div>
            </div>

            <div className="portfolio-new-limit-field">
              <label className="portfolio-new-limit-label">Group of expense</label>
              <input 
                type="text" 
                className="portfolio-new-limit-input" 
                placeholder="Name of the group"
                value={formData.expense_group}
                onChange={(e) => handleChange("expense_group", e.target.value)}
              />
            </div>

            <div className="portfolio-new-limit-row--two">
              <div className="portfolio-new-limit-field">
                <label className="portfolio-new-limit-label">Min/Max*</label>
                <input 
                  type="text" 
                  className="portfolio-new-limit-input" 
                  placeholder="Min or Max"
                  value={formData.min_max}
                  onChange={(e) => handleChange("min_max", e.target.value)}
                />
              </div>

              <div className="portfolio-new-limit-field">
                <label className="portfolio-new-limit-label">Rate*</label>
                <input 
                  type="text" 
                  className="portfolio-new-limit-input" 
                  placeholder="Percentage"
                  value={formData.rate}
                  onChange={(e) => handleChange("rate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="portfolio-new-limit-divider" />

          <div className="portfolio-new-limit-section">
            <div className="portfolio-new-limit-section-label">Description</div>
            <div className="portfolio-new-limit-field">
              <label className="portfolio-new-limit-label">Description as per PPM*</label>
              <textarea 
                className="portfolio-new-limit-textarea" 
                placeholder="Please type the description here..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="portfolio-new-limit-footer">
          <button 
            type="button" 
            className="portfolio-new-limit-btn portfolio-new-limit-btn-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="portfolio-new-limit-btn portfolio-new-limit-btn-save" 
            onClick={() => onSave(formData)} // Pass current state to parent
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewLimitPanel;