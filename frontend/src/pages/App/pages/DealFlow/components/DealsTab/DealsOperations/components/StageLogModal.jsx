import React, { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import useApi from "/src/hooks/api/useApi";
import "./StageLogModal.css";

const DEALFLOW_TAXONOMY_ENDPOINT = "/api/dealflow/taxonomy/";

export function toRawDate(displayDate) {
  if (!displayDate) return "";
  const d = new Date(displayDate);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


function StageLogModal({ stages, initialEntry, onSave, onClose }) {
  const api = useApi();
  const [selectedStage, setSelectedStage] = useState(initialEntry?.stageId || initialEntry?.stage || null);
  const [selectedStage, setSelectedStage] = useState(initialEntry?.stage || null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!initialEntry?.rawDate) return null;
    const parsed = new Date(initialEntry.rawDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  });
  const normalizedStageOptions = useMemo(
    () => (Array.isArray(stageOptions) ? stageOptions.filter((item) => item?.name) : []),
    [stageOptions]
  );
  const isValid = selectedStage && selectedDate;

  useEffect(() => {
    if (Array.isArray(stages) && stages.length > 0) {
      setStageOptions(stages);
      return;
    }

    let isMounted = true;
    api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=stage`)
      .then((payload) => {
        if (!isMounted) return;
        setStageOptions(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setStageOptions([]);
      });

    return () => {
      isMounted = false;
    };
  }, [api, stages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    const formatted = selectedDate.toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric",
    });
    const rawDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    onSave({ stageId: selectedStage, date: formatted, rawDate });
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
              options={normalizedStageOptions}
              value={selectedStage}
              onChange={setSelectedStage}
              placeholder="Select a stage..."
              labelKey="name"
               valueKey="id"
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
