import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import "./StageLogModal.css";

export function toRawDate(displayDate) {
  if (!displayDate) return "";
  const d = new Date(displayDate);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function StageLogModal({ stages, initialEntry, onSave, onClose }) {
  const [selectedStage, setSelectedStage] = useState(initialEntry?.stage || null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!initialEntry?.rawDate) return null;
    const [y, m, d] = initialEntry.rawDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  });
  const isValid = selectedStage && selectedDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    const formatted = selectedDate.toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric",
    });
    const rawDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    onSave({ stage: selectedStage, date: formatted, rawDate });
  };

  return (
    <div className="sl-modal-overlay" onClick={onClose}>
      <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sl-modal-header">
          <span className="sl-modal-title">{initialEntry ? "Edit Stage" : "New Stage"}</span>
          <button className="sl-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <form className="sl-modal-body" onSubmit={handleSubmit}>
          <div className="sl-modal-field">
            <label className="sl-modal-label">Stage</label>
            <SimpleDropdown
              options={stages}
              value={selectedStage}
              onChange={setSelectedStage}
              placeholder="Select a stage..."
              labelKey="name"
              valueKey="name"
            />
          </div>
          <div className="sl-modal-field">
            <label className="sl-modal-label">Date</label>
            <DateInputWithPicker
              initialDate={selectedDate}
              onDateChange={setSelectedDate}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
          </div>
          <div className="sl-modal-footer">
            <button type="button" className="sl-modal-btn sl-modal-btn--cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="sl-modal-btn sl-modal-btn--save" disabled={!isValid}>
              {initialEntry ? "Save Changes" : "Add Stage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StageLogModal;
