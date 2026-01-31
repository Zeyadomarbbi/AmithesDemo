// frontend/src/pages/App/pages/Financials/components/PnLTables/PnLTax/PnLTax.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  EditLineIcon,
  MinusIcon,
  PlusIcon,
  TrashBinIcon,
  KebabIcon,
} from "../../../../../components/Icons.jsx";
import "../FinancialTables.css";

const PnLTax = ({
  fundId,
  headerPeriods = [],

  showTax,
  setShowTax,

  taxLines,
  setTaxLines,

  taxValues,
  setTaxValues,

  totalTaxByPeriod = {},

  onAddRow,
  onRemoveRow,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");

  // kebab dropdown open row id
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

  const periods = Array.isArray(headerPeriods) ? headerPeriods : [];

  return (
    <div className="pnl-tax">
      {/* ===== TAX ROWS ===== */}
      {showTax &&
        taxLines.map((line, index) => {
          const isEditingThis = editingId === line.id;

          // ✅ restore zebra striping (match Income/Expenses)
          const rowClass =
            index % 2 === 0 ? "detail-row--grey" : "detail-row--white";

          // ✅ ONLY the custom "Type here" row gets this marker class
          const typeHereClass = line.isCustom ? "detail-row--typehere" : "";

          return (
            <div
              className={`detail-row ${rowClass} ${typeHereClass}`}
              key={line.id}
            >
              {/* LABEL */}
              <div className="detail-label">
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
                const pid = String(p.id);
                const value = taxValues[index]?.byPeriod?.[pid] ?? "";

                return (
                  <div key={pid} className="detail-input-wrapper">
                    <input
                      className="amount-input"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={value}
                      onChange={(e) => {
                        const copy = [...taxValues];
                        const row = copy[index] || { byPeriod: {} };

                        copy[index] = {
                          ...row,
                          byPeriod: {
                            ...(row.byPeriod || {}),
                            [pid]: e.target.value,
                          },
                        };

                        setTaxValues(copy);
                      }}
                    />
                  </div>
                );
              })}

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
                      <div
                        className={`pnl-kebab-menu ${
                          periods.length === 0 ? "pnl-kebab-menu--below" : ""
                        }`}
                        role="menu"
                      >
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

      {/* ===== TAX HEADER (BLUE BAND) (MOVED TO BOTTOM) ===== */}
      <div className="group-row group-row--band">
        <div className="group-left">
          <button
            className="group-toggle"
            type="button"
            onClick={() => setShowTax((v) => !v)}
          >
            {showTax ? <MinusIcon /> : <PlusIcon />}
            Tax
          </button>
        </div>

        {periods.map((p) => (
          <div key={p.id} className="group-value">
            {Number(totalTaxByPeriod?.[p.id] || 0).toLocaleString()}
          </div>
        ))}

        {/* ✅ keep last column empty (Add button is in header row now) */}
        <div className="group-action-cell" />
      </div>
    </div>
  );
};

export default PnLTax;
