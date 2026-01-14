// src/pages/App/pages/LPsStatement/components/AddPeriodModal.jsx
import React, { useState, useEffect } from "react"; // ✅ added useEffect
import "./addPeriodModal.css";
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput";

/* ✅ same helper we used for NewFundModal / NewLPDrawer */
function parseDateString(value) {
  if (!value) return null;
  const str = String(value).trim();

  // supports DD/MM/YYYY
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);

  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  )
    return null;

  return d;
}

function formatDDMMYYYY(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const AddPeriodModal = ({ open, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [endDate, setEndDate] = useState(""); // "DD/MM/YYYY"

  // ✅ ONLY FIX: when modal opens, set a default date so Save works without clicking calendar
  useEffect(() => {
    if (!open) return;
    setName("");
    setEndDate(formatDDMMYYYY(new Date()));
  }, [open]);

  if (!open) return null;

  const stopClick = (e) => e.stopPropagation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !endDate.trim()) return;

    onSave?.({
      name: name.trim(),
      end: endDate,
    });
    onClose?.();
  };

  return (
    <div className="period-modal-backdrop" onClick={onClose}>
      <div className="period-modal" onClick={stopClick}>
        <div className="period-modal-header">
          <h2 className="period-modal-title">Add new period</h2>
          <button type="button" className="period-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="period-modal-body" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="period-field">
            <label className="period-label">Name *</label>
            <input
              className="period-input"
              placeholder="Please enter the period name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* End (DateInputWithPicker) */}
          <div className="period-field period-field-end">
            <label className="period-label">End*</label>

            <div className="period-input-with-icon">
              <DateInputWithPicker
                initialDate={parseDateString(endDate) || new Date()}
                onDateChange={(date) => setEndDate(formatDDMMYYYY(date))}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="period-modal-footer">
            <button
              type="button"
              className="btn-secondary-wide"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-wide">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPeriodModal;
