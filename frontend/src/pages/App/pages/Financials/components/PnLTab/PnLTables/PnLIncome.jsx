// frontend/src/pages/App/pages/Financials/components/PnLTables/PnLIncome/PnLIncome.jsx
import React, { useEffect, useRef, useState } from "react";
import { MinusIcon, EditLineIcon, TrashBinIcon, KebabIcon, PlusIconWhite } from '/src/components/Icons/InteractiveIcons';
import { noScroll } from '../../../../../../../components/disableNumberScroll'

import "./FinancialTables.css";

const PnLIncome = ({
  headerPeriods = [],

  showIncome,
  setShowIncome,

  incomeLines,
  setIncomeLines,

  incomeValues,
  setIncomeValues,

  totalIncomeByPeriod = {},

  onAddRow,
  onRemoveRow,

  // Passed from PnLTab
  onUpdateLineItem,
  onDeleteLineItem,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuWrapRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;
    const onDocMouseDown = (e) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target)) setOpenMenuId(null);
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setOpenMenuId(null); };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!editingId) return;
    const line = incomeLines.find((l) => l.id === editingId);
    setDraftLabel(line?.label ?? "");
  }, [editingId, incomeLines]);

  const startEditLabel = (line) => {
    setEditingId(line.id);
    setDraftLabel(line.label ?? "");
  };

  const commitLabel = async () => {
    if (!editingId) return;
    const line = incomeLines.find((l) => l.id === editingId);
    const newLabel = draftLabel;

    setIncomeLines((prev) =>
      prev.map((l) => (l.id === editingId ? { ...l, label: newLabel } : l))
    );
    setEditingId(null);
    setDraftLabel("");

    if (line && !line.isCustom && Number.isFinite(Number(line.id))) {
      try {
        await onUpdateLineItem({ lineItemId: Number(line.id), name: newLabel });
      } catch {
        setIncomeLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, label: line.label } : l))
        );
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftLabel("");
  };

  const handleDeleteRow = (line, index) => {
    setOpenMenuId(null);
    onDeleteLineItem({ lineItemId: line.id, isCustom: line.isCustom, index });
  };

  const periods = Array.isArray(headerPeriods) ? headerPeriods : [];

  return (
    <div className="pnl-income">
      {showIncome &&
        incomeLines.map((line, index) => {
          const isEditingThis = editingId === line.id;
          const rowClass      = index % 2 === 0 ? "detail-row--grey" : "detail-row--white";
          const typeHereClass = line.isCustom ? "detail-row--typehere" : "";

          return (
            <div className={`detail-row ${rowClass} ${typeHereClass}`} key={line.id}>

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

              {/* PERIOD INPUTS */}
              {periods.map((p) => {
                const pid   = String(p.id);
                const value = incomeValues[index]?.byPeriod?.[pid] ?? "";
                return (
                  <div key={pid} className="detail-input-wrapper">
                    <input
                      className="amount-input"
                      type="number"
                      onWheel={noScroll}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={value}
                      onChange={(e) => {
                        const copy = [...incomeValues];
                        const row  = copy[index] || { byPeriod: {} };
                        copy[index] = {
                          ...row,
                          byPeriod: { ...(row.byPeriod || {}), [pid]: e.target.value },
                        };
                        setIncomeValues(copy);
                      }}
                    />
                  </div>
                );
              })}

              {/* ACTIONS — kebab always far right */}
              <div className="pnl-row-actions">
                <div
                  className="pnl-kebab-wrap"
                  ref={(el) => { if (openMenuId === line.id) menuWrapRef.current = el; }}
                >
                  <button
                    className="pnl-kebab"
                    type="button"
                    aria-label="Row actions"
                    onClick={() => setOpenMenuId((prev) => prev === line.id ? null : line.id)}
                  >
                    <KebabIcon />
                  </button>

                  {openMenuId === line.id && (
                    <div
                      className={`pnl-kebab-menu ${periods.length === 0 ? "pnl-kebab-menu--below" : ""}`}
                      role="menu"
                    >
                      <button
                        type="button"
                        className="pnl-kebab-item pnl-kebab-delete"
                        role="menuitem"
                        onClick={() => handleDeleteRow(line, index)}
                      >
                        <TrashBinIcon />
                        Delete row
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}

      {/* BLUE BAND */}
      <div className="group-row group-row--band">
        <div className="group-left">
          <button
            className="group-toggle"
            type="button"
            onClick={() => setShowIncome((v) => !v)}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {showIncome ? <MinusIcon /> : <PlusIconWhite />}
            </span>
            Income
          </button>
        </div>

        {periods.map((p) => (
          <div key={p.id} className="group-value">
            {Number(totalIncomeByPeriod?.[p.id] || 0).toLocaleString()}
          </div>
        ))}

        <div className="group-action-cell" />
      </div>
    </div>
  );
};

export default PnLIncome;