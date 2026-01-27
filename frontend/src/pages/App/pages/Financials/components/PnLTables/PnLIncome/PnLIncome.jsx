// frontend/src/pages/App/pages/Financials/components/PnLTables/PnLIncome.jsx
import React, { useEffect, useRef, useState } from "react";
import {MinusIcon,PlusIcon,EditLineIcon, TrashBinIcon, KebabIcon,} from "../../../../../components/Icons.jsx";
import "./PnLIncome.css";

const PnLIncome = ({
  fundId,
  showIncome,
  setShowIncome,

  incomeLines,
  setIncomeLines,

  incomeValues,
  setIncomeValues,

  totalIncomeCol1,
  totalIncomeCol2,

  onAddRow,
  onRemoveRow,
}) => {
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
    const line = incomeLines.find((l) => l.id === editingId);
    setDraftLabel(line?.label ?? "");
  }, [editingId, incomeLines]);

  const startEditLabel = (line) => {
    setEditingId(line.id);
    setDraftLabel(line.label ?? "");
  };

  const commitLabel = () => {
    if (!editingId) return;

    setIncomeLines((prev) =>
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
    <div className="pnl-income">
      {/* ===== INCOME HEADER (DO NOT TOUCH COLOR) ===== */}
      <div className="group-row group-row--band">
        <button
          className="group-toggle"
          type="button"
          onClick={() => setShowIncome((v) => !v)}
        >
         
         <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
  {showIncome ? <MinusIcon /> : <PlusIcon />}
</span>
Income
        </button>

        <div className="group-value">{totalIncomeCol1.toLocaleString()}</div>
        <div className="group-value">{totalIncomeCol2.toLocaleString()}</div>

        <div className="group-action-cell">
         <button className="pill-btn" type="button" onClick={onAddRow}>
         <PlusIcon /> Add income
         </button>

        </div>
      </div>

      {/* ===== INCOME ROWS ===== */}
      {showIncome &&
        incomeLines.map((line, index) => {
          const isEditingThis = editingId === line.id;

          const rowClass =
            index % 2 === 0 ? "detail-row--grey" : "detail-row--white";

          return (
            <div className={`detail-row ${rowClass}`} key={line.id}>
              {/* LABEL */}
              <div className="detail-label">
                {line.isCustom ? (
                  <input
                    className="pnl-label-input"
                    placeholder="Type here"
                    value={line.label}
                    onChange={(e) => {
                      const next = [...incomeLines];
                      next[index] = { ...next[index], label: e.target.value };
                      setIncomeLines(next);
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

              {/* COL 1 */}
              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  
                  value={incomeValues[index]?.col1 ?? ""}
                  onChange={(e) => {
                    const copy = [...incomeValues];
                    copy[index] = { ...copy[index], col1: e.target.value };
                    setIncomeValues(copy);
                  }}
                />
              </div>

              {/* COL 2 */}
              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  
                  value={incomeValues[index]?.col2 ?? ""}
                  onChange={(e) => {
                    const copy = [...incomeValues];
                    copy[index] = { ...copy[index], col2: e.target.value };
                    setIncomeValues(copy);
                  }}
                />
              </div>

              {/* ACTIONS */}
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

export default PnLIncome;
