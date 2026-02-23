// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/AddFlowModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AddFlowModal.css";

// ✅ use your existing hook (already points to /api/lps-statement/flow-types/)
import { useFlowTypes } from "/src/pages/App/hooks/LPsStatement/useFlowTypes.js";

export default function AddFlowModal({ onClose, onSave, isSaving = false }) {
  const [flowName, setFlowName] = useState("");

  // ✅ store BOTH id + name
  const [flowTypeId, setFlowTypeId] = useState("");
  const [flowTypeName, setFlowTypeName] = useState("");

  const [alignAll, setAlignAll] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const { flowTypes, fetchFlowTypes, isLoading, error } = useFlowTypes();

  useEffect(() => {
    // fetch DB flow types when modal opens
    fetchFlowTypes?.().catch(() => {});
  }, [fetchFlowTypes]);

  // Normalize DB list to a consistent shape
  const options = useMemo(() => {
    const arr = Array.isArray(flowTypes) ? flowTypes : [];
    return arr
      .map((t) => {
        const id = t?.flow_type_id ?? t?.id ?? t?.pk ?? null;
        const name = t?.name ?? t?.label ?? null;
        if (id === null || id === undefined || !name) return null;
        return { id: String(id), name: String(name) };
      })
      .filter(Boolean);
  }, [flowTypes]);

  // Set default selection once options load
  useEffect(() => {
    if (!flowTypeId && options.length > 0) {
      setFlowTypeId(options[0].id);
      setFlowTypeName(options[0].name);
    }
  }, [options, flowTypeId]);

  const selectedLabel = flowTypeName || "Choose flow type";

  const handleSave = () => {
    if (!onSave) return;

    onSave({
      flowName: flowName.trim(),
      flowTypeId: flowTypeId ? Number(flowTypeId) : null, // ✅ integer for backend
      flowTypeName: flowTypeName || "", // ✅ UI display
      alignAll,
    });

    if (onClose) onClose();
  };

  const disabled = Boolean(isSaving) || Boolean(isLoading);

  return (
    <div className="af-backdrop">
      <div className="af-modal">
        <div className="af-header">
          <h3 className="af-title">Add new flow</h3>
          <button
            className="af-close"
            onClick={onClose}
            type="button"
            disabled={disabled}
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
                  {isLoading ? "Loading..." : selectedLabel}
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
                        opt.id === String(flowTypeId) ? "is-selected" : ""
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

                  {options.length === 0 && (
                    <div className="af-select-option" style={{ cursor: "default" }}>
                      No flow types found
                    </div>
                  )}
                </div>
              )}
            </div>

            {error?.message && (
              <div style={{ marginTop: 8, color: "#b42318", fontSize: 12 }}>
                {error.message}
              </div>
            )}
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
            disabled={disabled}
          >
            Cancel
          </button>

          <button
            className="af-btn af-btn--primary"
            onClick={handleSave}
            type="button"
            disabled={
              disabled ||
              !flowTypeId ||
              !String(flowName || "").trim()
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
