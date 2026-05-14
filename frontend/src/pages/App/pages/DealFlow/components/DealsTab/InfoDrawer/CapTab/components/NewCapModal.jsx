import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import "./NewCapModal.css";

function NewCapModal({ onClose, onNext }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(null);

  const handleNext = () => {
    onNext?.({ name, date });
  };

  return (
    <div className="ncap-overlay" onClick={onClose}>
      <div className="ncap-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ncap-header">
          <button className="ncap-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="ncap-body">
          <h2 className="ncap-title">Create a cap table</h2>

          <div className="ncap-field">
            <label className="ncap-label">Name*</label>
            <input
              type="text"
              className="ncap-input"
              placeholder="placeholder"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="ncap-field">
            <label className="ncap-label">Date*</label>
            <div className="ncap-date-wrap">
              <DateInputWithPicker
                initialDate={date}
                onDateChange={(d) => setDate(d)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ncap-footer">
          <button className="ncap-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ncap-btn-next" onClick={handleNext}>Next</button>
        </div>

      </div>
    </div>
  );
}

export default NewCapModal;
