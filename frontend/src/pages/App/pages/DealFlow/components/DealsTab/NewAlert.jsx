import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import "./NewAlert.css";

function NewAlert({ dealName, onClose, onSubmit }) {
  const [date, setDate] = useState(null);
  const [note, setNote] = useState("");

  const canSubmit = !!date;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({ date, note: note.trim() });
  };

  return (
    <div className="na-overlay" onClick={onClose}>
      <div className="na-modal" onClick={(e) => e.stopPropagation()}>

        <div className="na-header">
          <button className="na-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="na-body">
          <h2 className="na-title">Create an alert</h2>
          {dealName && <p className="na-deal-name">{dealName}</p>}

          <div className="na-field">
            <label className="na-label">Date *</label>
            <div className="na-date-wrap">
              <DateInputWithPicker
                initialDate={date}
                onDateChange={(d) => setDate(d)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="na-field">
            <label className="na-label">Note</label>
            <textarea
              className="na-textarea"
              placeholder="Add a note for this alert…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="na-footer">
          <button className="na-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="na-btn-create" onClick={handleSubmit} disabled={!canSubmit}>
            Create
          </button>
        </div>

      </div>
    </div>
  );
}

export default NewAlert;