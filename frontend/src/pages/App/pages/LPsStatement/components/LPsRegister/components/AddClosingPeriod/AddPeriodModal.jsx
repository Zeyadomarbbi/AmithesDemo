import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CloseIcon, DeleteIcon } from "../../../../../../../../components/Icons/InteractiveIcons.jsx";
import DateInputWithPicker from "../../../../../../../../components/DateComponents/DateInput";
import { useFundClosings } from "../../../../../../hooks/LPsStatement/useClosingPeriods";
import Prompt from "../../../../../../components/Toast/Prompt.jsx";
import "./AddPeriodModal.css";

function parseDateString(value) {
  if (!value) return null;
  const str = String(value).trim();
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function formatDDMMYYYY(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function isoToDisplay(isoDate) {
  if (!isoDate) return formatDDMMYYYY(new Date());
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

const AddPeriodModal = ({ open, onClose, onSave, editingClosing = null }) => {
  const { fundId } = useParams();
  const isEdit = !!editingClosing;

  const [closingName, setClosingName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);

  const { createFundClosing, updateFundClosing, deleteFundClosing, loading, error } = useFundClosings(fundId);

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setClosingName(editingClosing.closing_name || "");
        setDescription(editingClosing.description || "");
        setEndDate(isoToDisplay(editingClosing.date));
      } else {
        setClosingName("");
        setDescription("");
        setEndDate(formatDDMMYYYY(new Date()));
      }
    }
  }, [open, editingClosing, isEdit]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!closingName.trim() || !endDate.trim()) return;

    const parsedDate = parseDateString(endDate);
    if (!parsedDate) return;

    const isoDate = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;

    try {
      const payload = {
        closing_name: closingName.trim(),
        date: isoDate,
        description: description.trim(),
        fund: parseInt(fundId, 10),
      };

      let result;
      if (isEdit) {
        result = await updateFundClosing(editingClosing.lps_fund_closing_period_id, payload);
      } else {
        result = await createFundClosing(payload);
      }

      if (onSave) onSave(result);
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFundClosing(editingClosing.lps_fund_closing_period_id);
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <>
      <div className="lp-add-closing-period-modal-backdrop" onClick={onClose}>
        <div className="lp-add-closing-period-modal" onClick={(e) => e.stopPropagation()}>
          <div className="lp-add-closing-period-modal-header">
            <button type="button" className="lp-add-closing-period-modal-close-btn" onClick={onClose}>
              <CloseIcon />
            </button>
            <h2 className="lp-add-closing-period-modal-title">
              {isEdit ? "Edit closing period" : "Add new period"}
            </h2>
          </div>

          <form className="lp-add-closing-period-modal-body" onSubmit={handleSubmit}>
            {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

            <div className="lp-add-closing-period-modal-field">
              <label className="lp-add-closing-period-modal-label">Closing Name *</label>
              <input
                type="text"
                className="lp-add-closing-period-modal-input"
                placeholder="Enter closing name..."
                value={closingName}
                onChange={(e) => setClosingName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="lp-add-closing-period-modal-field">
              <label className="lp-add-closing-period-modal-label">Description</label>
              <input
                type="text"
                className="lp-add-closing-period-modal-input"
                placeholder="Enter period description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="lp-add-closing-period-modal-field lp-add-closing-period-modal-field-end">
              <label className="lp-add-closing-period-modal-label">End Date *</label>
              <DateInputWithPicker
                initialDate={parseDateString(endDate) || new Date()}
                onDateChange={(date) => setEndDate(formatDDMMYYYY(date))}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>

            <div className={`lp-add-closing-period-modal-footer ${isEdit ? 'is-edit' : ''}`}>
              {isEdit && (
                <button
                  type="button"
                  className="lp-add-closing-period-modal-btn-danger"
                  onClick={() => setDeletePromptOpen(true)}
                  disabled={loading}
                >
                  <DeleteIcon />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="submit"
                className="lp-add-closing-period-modal-btn-primary"
                disabled={loading || !closingName.trim()}
              >
                {loading ? "Saving..." : isEdit ? "Save Changes" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {deletePromptOpen && (
        <Prompt
          type="error"
          title="Delete closing period"
          message="This closing period will be permanently deleted. This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onCancel={() => setDeletePromptOpen(false)}
          onConfirm={() => {
            setDeletePromptOpen(false);
            handleDelete();
          }}
        />
      )}
    </>
  );
};

export default AddPeriodModal;