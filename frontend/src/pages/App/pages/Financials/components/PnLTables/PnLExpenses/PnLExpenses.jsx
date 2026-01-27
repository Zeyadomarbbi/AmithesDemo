import React, { useEffect, useRef, useState } from "react";
import {
  EditLineIcon,
  TrashBinIcon,
  KebabIcon,
} from "../../../../../components/Icons.jsx";
import "./PnLExpenses.css";

const PnLExpenses = ({
  fundId,
  showExpenses,
  setShowExpenses,

  expenseLines,
  setExpenseLines,

  expenseValues,
  setExpenseValues,

  totalExpensesCol1,
  totalExpensesCol2,

  onAddRow,
  onRemoveRow,
}) => {
  // ✅ same as Income: edit ONLY base line label
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

  useEffect(() => {
    if (!editingId) return;
    const line = expenseLines.find((l) => l.id === editingId);
    setDraftLabel(line?.label ?? "");
  }, [editingId, expenseLines]);

  const startEditLabel = (line) => {
    setEditingId(line.id);
    setDraftLabel(line.label ?? "");
  };

  const commitLabel = () => {
    if (!editingId) return;

    setExpenseLines((prev) =>
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
    // ✅ IMPORTANT wrapper for scoped .pnl-expenses CSS
    <div className="pnl-expenses">
      <div className="group-row group-row--band">
        <button
          className="group-toggle"
          type="button"
          onClick={() => setShowExpenses((v) => !v)}
        >
          <span className="sign">{showExpenses ? "−" : "+"}</span>
          Expenses
        </button>

        <div className="group-value">{totalExpensesCol1.toLocaleString()}</div>
        <div className="group-value">{totalExpensesCol2.toLocaleString()}</div>

        <div className="group-action-cell">
          <button className="pill-btn" type="button" onClick={onAddRow}>
            + Add expenses
          </button>
        </div>
      </div>

      {showExpenses &&
        expenseLines.map((line, index) => {
          const isEditingThis = editingId === line.id;

          return (
            <div className="detail-row" key={line.id}>
              {/* ✅ LABEL CELL (pen here, like Income) */}
              <div className="detail-label">
                {line.isCustom ? (
                  <input
                    className="pnl-label-input"
                    placeholder="Type here"
                    value={line.label}
                    onChange={(e) => {
                      const next = [...expenseLines];
                      next[index] = { ...next[index], label: e.target.value };
                      setExpenseLines(next);
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
                  placeholder="e.g 100"
                  value={expenseValues[index]?.col1 ?? ""}
                  onChange={(e) => {
                    const copy = [...expenseValues];
                    copy[index] = { ...copy[index], col1: e.target.value };
                    setExpenseValues(copy);
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
                  placeholder="e.g 100"
                  value={expenseValues[index]?.col2 ?? ""}
                  onChange={(e) => {
                    const copy = [...expenseValues];
                    copy[index] = { ...copy[index], col2: e.target.value };
                    setExpenseValues(copy);
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

export default PnLExpenses;
