import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 1. Import useParams
import DateInputWithPicker from "../../../../../../components/DateComponents/DateInput";
import { useFundClosings } from "../../../../hooks/LPsStatement/useClosingPeriods"; 
import "./addPeriodModal.css";

// Helper to convert DD/MM/YYYY to Date object
function parseDateString(value) {
  if (!value) return null;
  const str = String(value).trim();
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// Helper to convert Date object to DD/MM/YYYY
function formatDDMMYYYY(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const AddPeriodModal = ({ open, onClose, onSave }) => {
  const { fundId } = useParams();
  const [selectedClosingId, setSelectedClosingId] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { 
    closingPeriods, 
    fetchClosingPeriods, 
    createFundClosing, 
    loading,
    error 
  } = useFundClosings(fundId);

  // Initialize data on modal open
  useEffect(() => {
    if (open) {
      fetchClosingPeriods();
      setSelectedClosingId("");
      setEndDate(formatDDMMYYYY(new Date()));
    }
  }, [open, fetchClosingPeriods]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClosingId || !endDate.trim()) return;

    const parsedDate = parseDateString(endDate);
    if (!parsedDate) return;

    // Django expects YYYY-MM-DD
    const isoDate = parsedDate.toISOString().split('T')[0];

    try {
      const payload = {
        closing_period: parseInt(selectedClosingId, 10),
        date: isoDate,
        fund: parseInt(fundId, 10)
      };
      console.log("Submitting payload:", payload);
      const newRecord = await createFundClosing(payload);
      
      // Notify parent and close
      if (onSave) onSave(newRecord);
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  return (
    <div className="period-modal-backdrop" onClick={onClose}>
      <div className="period-modal" onClick={(e) => e.stopPropagation()}>
        <div className="period-modal-header">
          <h2 className="period-modal-title">Add new period</h2>
          <button type="button" className="period-close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="period-modal-body" onSubmit={handleSubmit}>
          {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          
          {/* Closing Period Dropdown */}
          <div className="period-field">
            <label className="period-label">Closing Period *</label>
            <select
              className="period-input"
              value={selectedClosingId}
              onChange={(e) => setSelectedClosingId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="" disabled>Select a closing period...</option>
              {closingPeriods.map((period) => (
                <option key={period.closing_id} value={period.closing_id}>
                  {period.closing_name} ({period.closing_code})
                </option>
              ))}
            </select>
          </div>

          {/* End Date Picker */}
          <div className="period-field period-field-end">
            <label className="period-label">End Date*</label>
            <div className="period-input-with-icon">
              <DateInputWithPicker
                initialDate={parseDateString(endDate) || new Date()}
                onDateChange={(date) => setEndDate(formatDDMMYYYY(date))}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="period-modal-footer">
            <button
              type="button"
              className="btn-secondary-wide"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-wide" 
              disabled={loading || !selectedClosingId}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPeriodModal;