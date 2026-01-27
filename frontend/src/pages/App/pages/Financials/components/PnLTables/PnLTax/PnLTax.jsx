import React, { useEffect, useRef, useState } from "react";
import { EditLineIcon,MinusIcon,PlusIcon, TrashBinIcon, KebabIcon,} from "../../../../../components/Icons.jsx";
import "./PnLTax.css";

const PnLTax = ({
  fundId,
  showTax,
  setShowTax,

  taxLines,
  setTaxLines,

  taxValues,
  setTaxValues,

  totalTaxCol1,
  totalTaxCol2,

  onAddRow,
  onRemoveRow,
}) => {
  // ✅ which base line label is being edited (by id)
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");

  // ✅ kebab dropdown open row id
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuWrapRef = useRef(null);

  // close menu on outside click / Esc
  useEffect(() => {
    if (!openMenuId) return;

    const onDocMouseDown = (e) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target)) setOpenMenuId(null);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenuId]);

  // keep draft synced when you switch rows
  useEffect(() => {
    if (!editingId) return;
    const line = taxLines.find((l) => l.id === editingId);
    setDraftLabel(line?.label ?? "");
  }, [editingId, taxLines]);

  const startEditLabel = (line) => {
    setEditingId(line.id);
    setDraftLabel(line.label ?? "");
  };

  const commitLabel = () => {
    if (!editingId) return;

    setTaxLines((prev) =>
      prev.map((l) => (l.id === editingId ? { ...l, label: draftLabel } : l))
    );

    setEditingId(null);
    setDraftLabel("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftLabel("");
  };

  return (
    // ✅ IMPORTANT: wrapper so .pnl-tax ... CSS works
    <div className="pnl-tax">
      <div className="group-row group-row--band">
        <button
          className="group-toggle"
          type="button"
          onClick={() => setShowTax((v) => !v)}
        >
         {showTax ? <MinusIcon /> : <PlusIcon />}
         Tax
        </button>

        <div className="group-value">{totalTaxCol1.toLocaleString()}</div>
        <div className="group-value">{totalTaxCol2.toLocaleString()}</div>

        <div className="group-action-cell">
          <button className="pill-btn" type="button" onClick={onAddRow}>
          <PlusIcon />
          Add tax
         </button>

        </div>
      </div>

      {showTax &&
        taxLines.map((line, index) => {
          const isEditingThis = editingId === line.id;

          return (
            <div className="detail-row" key={line.id}>
              {/* ✅ LABEL CELL (pen must be here) */}
              <div className="detail-label">
                {/* custom row: always editable input */}
                {line.isCustom ? (
                  <input
                    className="pnl-label-input"
                    placeholder="Type here"
                    value={line.label}
                    onChange={(e) => {
                      const next = [...taxLines];
                      next[index] = { ...next[index], label: e.target.value };
                      setTaxLines(next);
                    }}
                  />
                ) : isEditingThis ? (
                  <input
                    className="pnl-label-input"
                    value={draftLabel}
                    autoFocus
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onBlur={commitLabel}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitLabel();
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                ) : (
                  <>
                    <span className="detail-label-text">{line.label}</span>

                    {/* ✅ clickable pen (NO BOX) */}
                    <button
                      type="button"
                      className="pnl-edit-btn"
                      onClick={() => startEditLabel(line)}
                      aria-label="Edit label"
                      title="Edit label"
                    >
                      <EditLineIcon />
                    </button>
                  </>
                )}
              </div>

              {/* ✅ COL 1 */}
              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  
                  value={taxValues[index]?.col1 ?? ""}
                  onChange={(e) => {
                    const copy = [...taxValues];
                    copy[index] = { ...copy[index], col1: e.target.value };
                    setTaxValues(copy);
                  }}
                />
              </div>

              {/* ✅ COL 2 */}
              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                
                  value={taxValues[index]?.col2 ?? ""}
                  onChange={(e) => {
                    const copy = [...taxValues];
                    copy[index] = { ...copy[index], col2: e.target.value };
                    setTaxValues(copy);
                  }}
                />
              </div>

              {/* ✅ ACTIONS */}
              <div className="pnl-row-actions">
                {line.isCustom ? (
                  <div className="pnl-kebab-wrap" ref={menuWrapRef}>
                    <button
                      className="pnl-kebab"
                      type="button"
                      aria-label="Row actions"
                      title="Actions"
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === line.id ? null : line.id
                        )
                      }
                    >
                      <KebabIcon />
                    </button>

                    {openMenuId === line.id && (
                      <div className="pnl-kebab-menu" role="menu">
                        <button
                          type="button"
                          className="pnl-kebab-item pnl-kebab-delete"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onRemoveRow(index);
                          }}
                        >
                          <TrashBinIcon />
                          Delete row
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span />
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default PnLTax;
