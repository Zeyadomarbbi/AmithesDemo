import React, { useState } from "react";
import "./NewLimitDrawer.css";
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import { ChevronDownIcon, ChevronDoubleLeftIcon } from '/src/components/Icons/DirectionIcons';

export default function NewLimitDrawer({ open, onClose, onSave }) {
  if (!open) return null;

  const [name, setName] = useState("");
  const [ppmRef, setPpmRef] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseGroup, setExpenseGroup] = useState("");
  const [minMax, setMinMax] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("new-limit-overlay")) {
      onClose();
    }
  };

  const handleSave = () => {
    const newLimit = {
      name: name || "",
      article: ppmRef || "",
      description: description || "",
      limit: rate || "",
      q4: rate || "",
    };
    if (onSave) onSave(newLimit);
  };

  return (
    <div className="new-limit-overlay" onClick={handleOverlayClick}>
      <aside className="new-limit-panel">

        {/* HEADER */}
        <div className="new-limit-header">
          <button type="button" className="new-limit-back-btn" onClick={onClose}>
            <ChevronDoubleLeftIcon />
          </button>
          <h2 className="new-limit-title">Adding a new limit</h2>
          <button type="button" className="new-limit-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* BODY */}
        <div className="new-limit-body">

          {/* General information */}
          <section className="new-limit-section">
            <div className="new-limit-section-label">General information</div>

            <div className="new-limit-field">
              <label className="new-limit-label">Name*</label>
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

            <div className="new-limit-field">
              <label className="new-limit-label">Type of expense</label>
              <div className="new-limit-select-wrapper">
                <select
                  className="new-limit-select-native"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  required
                >
                  <option value="" disabled hidden>Select a type of expense</option>
                  {/* TODO: populate with real expense types */}
                </select>
                <span className="new-limit-select-chevron" aria-hidden="true">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Group of expense</label>
              <input
                className="new-limit-input"
                placeholder="Name of the group"
                value={expenseGroup}
                onChange={(e) => setExpenseGroup(e.target.value)}
              />
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Min/Max*</label>
              <input
                className="new-limit-input"
                placeholder="Minimum or Maxiumum"
                value={minMax}
                onChange={(e) => setMinMax(e.target.value)}
              />
            </div>

            <div className="new-limit-field">
              <label className="new-limit-label">Rate*</label>
              <input
                className="new-limit-input"
                placeholder="Please enter a percentage"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </section>

          <hr className="new-limit-divider" />

          {/* Description */}
          <section className="new-limit-section">
            <div className="new-limit-section-label">Description</div>
            <div className="new-limit-field">
              <label className="new-limit-label">Description as per PPM*</label>
              <textarea
                className="new-limit-textarea"
                placeholder="Please type the description here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <div className="new-limit-footer">
          <button type="button" className="new-limit-btn new-limit-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="new-limit-btn new-limit-btn-save" onClick={handleSave}>
            Save
          </button>
        </div>

      </aside>
    </div>
  );
}