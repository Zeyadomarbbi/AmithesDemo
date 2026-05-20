import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import "./NewBoardModal.css";

function NewBoardModal({ onClose, onNext }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(null);

  const handleNext = () => {
    onNext?.({ name, date });
  };

  return (
    <div className="nbrd-overlay" onClick={onClose}>
      <div className="nbrd-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="nbrd-header">
          <button className="nbrd-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="nbrd-body">
          <h2 className="nbrd-title">New board</h2>

          <div className="nbrd-field">
            <label className="nbrd-label">Name*</label>
            <input
              type="text"
              className="nbrd-input"
              placeholder="Enter snapshot name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="nbrd-field">
            <label className="nbrd-label">Date</label>
            <div className="nbrd-date-wrap">
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
        <div className="nbrd-footer">
          <button className="nbrd-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="nbrd-btn-next" onClick={handleNext}>Create</button>
        </div>

      </div>
    </div>
  );
}

export default NewBoardModal;
