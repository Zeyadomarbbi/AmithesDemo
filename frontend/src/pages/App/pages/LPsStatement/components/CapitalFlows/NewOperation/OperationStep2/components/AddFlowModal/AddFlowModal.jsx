// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/AddFlowModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "../../../../../../Icons";
import SearchableSelect from "../../../../../../../../../../components/SearchBar/SearchableSelect";
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
  const [alignAll, setAlignAll] = useState(true);
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
      .filter(Boolean); // Removed the equalization filter here
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
          <button
            className="af-close"
            onClick={onClose}
            type="button"
            disabled={isSaving}
          >
            <CloseIcon />
          </button>
          <h3 className="af-title">Add new flow</h3>
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
            <SearchableSelect
              options={options}
              value={flowTypeId}
              onChange={(val) => {
                setFlowTypeId(val);
                const found = options.find(o => o.id === val);
                setFlowTypeName(found?.name || "");
              }}
              placeholder={isLoadingTypes ? "Loading types..." : "Choose flow type"}
              labelKey="name"
              valueKey="id"
              disabled={disabled}
              triggerClassName="af-input"
            />
          </div>

          <label className="af-checkbox">
            <input
              type="checkbox"
              checked={alignAll}
              onChange={(e) => setAlignAll(e.target.checked)}
              disabled={disabled}
            />
            <label className="af-label">Align all LPs</label>
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