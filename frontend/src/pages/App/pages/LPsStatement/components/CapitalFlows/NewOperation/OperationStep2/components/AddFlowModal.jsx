// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/AddFlowModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AddFlowModal.css";

export default function AddFlowModal({ 
  onClose, 
  onSave, 
  isSaving = false, 
  flowTypes = [], 
  isLoadingTypes = false 
}) {
  const [flowName, setFlowName] = useState("");
  const [flowTypeId, setFlowTypeId] = useState("");
  const [flowTypeName, setFlowTypeName] = useState("");
  const [alignAll, setAlignAll] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  // Normalize data from props
  const options = useMemo(() => {
    const arr = Array.isArray(flowTypes) ? flowTypes : [];
    return arr
      .map((t) => {
        const id = t?.flow_type_id ?? t?.id ?? t?.pk ?? null;
        const name = t?.name ?? t?.label ?? null;
        if (id === null || id === undefined || !name) return null;
        return { id: String(id), name: String(name) };
      })
      .filter(Boolean)
      .filter((opt) => opt.name.toLowerCase() !== "equalization");
  }, [flowTypes]);

  // Handle default selection when options are available
  useEffect(() => {
    if (!flowTypeId && options.length > 0) {
      setFlowTypeId(options[0].id);
      setFlowTypeName(options[0].name);
    }
  }, [options, flowTypeId]);

  const handleSave = () => {
    if (!onSave || !flowName.trim() || !flowTypeId) return;

    onSave({
      flowName: flowName.trim(),
      flowTypeId: Number(flowTypeId),
      flowTypeName: flowTypeName || "",
      alignAll,
    });

    if (onClose) onClose();
  };

  const disabled = isSaving || isLoadingTypes;
  const selectedLabel = flowTypeName || "Choose flow type";

  return (
    <div className="af-backdrop">
      <div className="af-modal">
        <div className="af-header">
          <h3 className="af-title">Add new flow</h3>
          <button
            className="af-close"
            onClick={onClose}
            type="button"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className="af-body">
          <div className="af-field">
            <label className="af-label">Flow name*</label>
            <input
              className="af-input"
              placeholder="Please enter the flow name..."
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              disabled={disabled}
              autoFocus
            />
          </div>

          <div className="af-field">
            <label className="af-label">Type of flow*</label>
            <div className="af-select-wrap">
              <button
                type="button"
                className={`af-select ${typeOpen ? "is-open" : ""}`}
                onClick={() => !disabled && setTypeOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={typeOpen}
                disabled={disabled}
              >
                <span>
                  {isLoadingTypes ? "Loading types..." : selectedLabel}
                </span>
                <span className="af-select-arrow">▾</span>
              </button>

              {typeOpen && !disabled && (
                <div className="af-select-menu" role="listbox">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`af-select-option ${
                        opt.id === flowTypeId ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setFlowTypeId(opt.id);
                        setFlowTypeName(opt.name);
                        setTypeOpen(false);
                      }}
                    >
                      {opt.name}
                    </button>
                  ))}

                  {options.length === 0 && !isLoadingTypes && (
                    <div className="af-select-option" style={{ cursor: "default" }}>
                      No flow types found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <label className="af-checkbox">
            <input
              type="checkbox"
              checked={alignAll}
              onChange={(e) => setAlignAll(e.target.checked)}
              disabled={disabled}
            />
            <span>Align all LPs</span>
          </label>
        </div>

        <div className="af-footer">
          <button
            className="af-btn af-btn--secondary"
            onClick={onClose}
            type="button"
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            className="af-btn af-btn--primary"
            onClick={handleSave}
            type="button"
            disabled={disabled || !flowTypeId || !flowName.trim()}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}