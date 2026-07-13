import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon, CloseIcon, EditLineIcon, DoneIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useKpisBackend } from "../../Deals_backend_work";
import NewKPIModal from "./components/NewKPIModal";
import "./KPIsTab.css";

const DISPLAY_MODE_OPTIONS = [
  { id: "QUARTERLY", name: "Quarterly" },
  { id: "SEMI_ANNUALLY", name: "Semi-Annually" },
  { id: "ANNUALLY", name: "Annually" },
];

const lsDisplayModeKey = (id) => `amethis-kpi-display-mode-${id}`;

function loadDisplayMode(periodId) {
  try {
    return localStorage.getItem(lsDisplayModeKey(periodId)) || "QUARTERLY";
  } catch {
    return "QUARTERLY";
  }
}

function saveDisplayMode(periodId, value) {
  try {
    localStorage.setItem(lsDisplayModeKey(periodId), value);
  } catch {}
}

function normalizeNumberInput(value) {
  return String(value ?? "").replace(/[^\d.,-]/g, "");
}

function displayCellValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

function createEditableValues(entry, columns) {
  const values = {};
  columns.forEach((column) => {
    values[column.key] = entry?.rawValues?.[column.key] ?? "";
  });
  return values;
}

function canEditEntryInMode(entry, displayMode) {
  return String(entry?.periodType || "").toUpperCase() === String(displayMode || "").toUpperCase();
}

function createDraftEntry(entry, columns, displayMode) {
  return {
    ...entry,
    editableValues: canEditEntryInMode(entry, displayMode) ? createEditableValues(entry, columns) : {},
  };
}

function buildEntryPatchPayload(entry) {
  return {
    kpiName: entry.kpiName,
    periodType: entry.periodType,
    currencyId: entry.currencyId,
    unit: entry.unit,
    q1Value: entry.periodType === "QUARTERLY" ? entry.editableValues?.q1_value ?? null : entry.rawValues?.q1_value ?? null,
    q2Value: entry.periodType === "QUARTERLY" ? entry.editableValues?.q2_value ?? null : entry.rawValues?.q2_value ?? null,
    q3Value: entry.periodType === "QUARTERLY" ? entry.editableValues?.q3_value ?? null : entry.rawValues?.q3_value ?? null,
    q4Value: entry.periodType === "QUARTERLY" ? entry.editableValues?.q4_value ?? null : entry.rawValues?.q4_value ?? null,
    h1Value: entry.periodType === "SEMI_ANNUALLY" ? entry.editableValues?.h1_value ?? null : entry.rawValues?.h1_value ?? null,
    h2Value: entry.periodType === "SEMI_ANNUALLY" ? entry.editableValues?.h2_value ?? null : entry.rawValues?.h2_value ?? null,
    annualY1Value: entry.periodType === "ANNUALLY" ? entry.editableValues?.annual_y1_value ?? null : entry.rawValues?.annual_y1_value ?? null,
    annualY2Value: entry.periodType === "ANNUALLY" ? entry.editableValues?.annual_y2_value ?? null : entry.rawValues?.annual_y2_value ?? null,
    annualY3Value: entry.periodType === "ANNUALLY" ? entry.editableValues?.annual_y3_value ?? null : entry.rawValues?.annual_y3_value ?? null,
    annualY4Value: entry.periodType === "ANNUALLY" ? entry.editableValues?.annual_y4_value ?? null : entry.rawValues?.annual_y4_value ?? null,
  };
}

function NewPeriodModal({ currencies, isSaving, onClose, onSubmit }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [currencyId, setCurrencyId] = useState(null);
  const canSubmit = Number(year) > 1900;

  return (
    <div className="kpi-modal-overlay" onClick={onClose}>
      <div className="kpi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kpi-modal-header">
          <span className="kpi-modal-title">New KPI Period</span>
          <button className="kpi-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="kpi-modal-body">
          <div className="kpi-modal-row">
            <div className="kpi-modal-field">
              <label className="kpi-modal-label">Year *</label>
              <input
                className="kpi-modal-input"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="kpi-modal-field">
              <label className="kpi-modal-label">Currency</label>
              <SimpleDropdown
                options={currencies}
                value={currencyId}
                onChange={setCurrencyId}
                placeholder="Select currency"
                labelKey="name"
                valueKey="id"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
        <div className="kpi-modal-footer">
          <button className="kpi-modal-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button
            className="kpi-modal-btn-create"
            onClick={() => canSubmit && onSubmit({ name: String(year), year, currencyId })}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KPIsTab({ dealId, onSaveStateChange }) {
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [displayModeByPeriod, setDisplayModeByPeriod] = useState({});
  const [draftEntriesByPeriod, setDraftEntriesByPeriod] = useState({});
  const [editingRowIds, setEditingRowIds] = useState(new Set());
  const [rowSnapshots, setRowSnapshots] = useState({});
  const [showNewKPI, setShowNewKPI] = useState(false);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const {
    periods,
    periodEntries,
    currencies,
    periodTypes,
    isLoading,
    isSaving,
    error,
    loadPeriodEntries,
    createPeriod,
    deletePeriod,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useKpisBackend(dealId);

  useEffect(() => {
    if (periods.length > 0) {
      setActivePeriodId((prev) => (prev && periods.some((period) => period.id === prev) ? prev : periods[0].id));
      setDisplayModeByPeriod((prev) => {
        const next = { ...prev };
        periods.forEach((period) => {
          if (!next[period.id]) next[period.id] = loadDisplayMode(period.id);
        });
        return next;
      });
      return;
    }
    setActivePeriodId(null);
  }, [periods]);

  useEffect(() => {
    if (error) {
      showToast({ type: "error", title: "KPIs failed", message: error });
    }
  }, [error, showToast]);

  const activePeriod = useMemo(
    () => periods.find((period) => period.id === activePeriodId) || null,
    [periods, activePeriodId]
  );
  const activeDisplayMode = activePeriodId ? displayModeByPeriod[activePeriodId] || "QUARTERLY" : "QUARTERLY";
  const activeEntriesPayload = activePeriodId ? periodEntries[activePeriodId] || null : null;
  const activeColumns = activeEntriesPayload?.columns || [];
  const activeDraftEntries = activePeriodId ? draftEntriesByPeriod[activePeriodId] || [] : [];

  useEffect(() => {
    if (!activePeriodId) return;
    loadPeriodEntries(activePeriodId, activeDisplayMode).catch(() => {});
  }, [activePeriodId, activeDisplayMode, loadPeriodEntries]);

  useEffect(() => {
    if (!activePeriodId || !activeEntriesPayload) return;
    setDraftEntriesByPeriod((prev) => ({
      ...prev,
      [activePeriodId]: activeEntriesPayload.entries.map((entry) =>
        createDraftEntry(entry, activeEntriesPayload.columns || [], activeDisplayMode)
      ),
    }));
    setEditingRowIds(new Set());
    setRowSnapshots({});
  }, [activePeriodId, activeEntriesPayload, activeDisplayMode]);

  const handleSaveRef = useRef(null);
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: () => handleSaveRef.current?.(), cancelFn: null, isDirty: false, isSaving, isEditing: false });
  }, [isSaving, onSaveStateChange]);

  const setDisplayMode = (periodId, value) => {
    setDisplayModeByPeriod((prev) => ({ ...prev, [periodId]: value }));
    saveDisplayMode(periodId, value);
  };

  const updateDraftEntry = (entryId, field, value) => {
    if (!activePeriodId) return;
    setDraftEntriesByPeriod((prev) => ({
      ...prev,
      [activePeriodId]: (prev[activePeriodId] || []).map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const updateDraftEntryValue = (entryId, key, value) => {
    if (!activePeriodId) return;
    setDraftEntriesByPeriod((prev) => ({
      ...prev,
      [activePeriodId]: (prev[activePeriodId] || []).map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              editableValues: {
                ...(entry.editableValues || {}),
                [key]: normalizeNumberInput(value),
              },
            }
          : entry
      ),
    }));
  };

  const startRowEdit = (entry) => {
    setEditingRowIds((prev) => new Set([...prev, entry.id]));
    setRowSnapshots((prev) => ({ ...prev, [entry.id]: JSON.parse(JSON.stringify(entry)) }));
  };

  const confirmRowEdit = async (entryId) => {
    if (!activePeriodId) return;
    const draftEntry = (draftEntriesByPeriod[activePeriodId] || []).find((entry) => entry.id === entryId);
    if (!draftEntry) return;
    try {
      await updateEntry(activePeriodId, entryId, buildEntryPatchPayload(draftEntry));
      setEditingRowIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
      setRowSnapshots((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      await loadPeriodEntries(activePeriodId, activeDisplayMode);
    } catch (err) {
      showToast({ type: "error", title: "Save failed", message: err.message || "Could not update the KPI row." });
    }
  };

  const cancelRowEdit = (entryId) => {
    const snapshot = rowSnapshots[entryId];
    if (snapshot && activePeriodId) {
      setDraftEntriesByPeriod((prev) => ({
        ...prev,
        [activePeriodId]: (prev[activePeriodId] || []).map((entry) => (entry.id === entryId ? snapshot : entry)),
      }));
    }
    setEditingRowIds((prev) => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
    setRowSnapshots((prev) => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  };

  const handleCreatePeriod = async (payload) => {
    try {
      await createPeriod(payload);
      setShowNewPeriod(false);
      showToast({ type: "success", title: "Period created", message: `"${payload.year}" has been created.` });
    } catch (err) {
      showToast({ type: "error", title: "Create failed", message: err.message || "Could not create the period." });
    }
  };

  const handleDeletePeriod = async () => {
    if (!activePeriod) return;
    if (!window.confirm(`Delete period "${activePeriod.year || activePeriod.name}"?`)) return;
    try {
      await deletePeriod(activePeriod.id);
      showToast({ type: "success", title: "Period deleted", message: `"${activePeriod.year || activePeriod.name}" has been removed.` });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the period." });
    }
  };

  const handleCreateKPI = async (payload) => {
    if (!activePeriodId) return;
    try {
      await createEntry(activePeriodId, payload);
      setShowNewKPI(false);
      await loadPeriodEntries(activePeriodId, activeDisplayMode);
      showToast({ type: "success", title: "KPI created", message: `"${payload.kpiName}" has been added successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Create failed", message: err.message || "Could not create the KPI." });
    }
  };

  const handleRemoveRow = async (entryId) => {
    if (!activePeriodId) return;
    try {
      await deleteEntry(activePeriodId, entryId);
      await loadPeriodEntries(activePeriodId, activeDisplayMode);
      showToast({ type: "success", title: "Deleted", message: "KPI row removed." });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not remove KPI row." });
    }
  };

  handleSaveRef.current = () => {};

  const periodYear = activePeriod?.year || new Date().getFullYear();
  const yearRangeLabel = activeDisplayMode === "ANNUALLY" ? `${periodYear - 3} - ${periodYear}` : String(periodYear);
  const totalColSpan = 2 + activeColumns.length;

  return (
    <div className="kpi-wrapper">
      {showNewKPI && (
        <NewKPIModal
          currencies={currencies}
          periodTypes={periodTypes.length > 0 ? periodTypes : DISPLAY_MODE_OPTIONS}
          year={periodYear}
          isSaving={isSaving}
          onClose={() => setShowNewKPI(false)}
          onSubmit={handleCreateKPI}
        />
      )}

      {showNewPeriod && (
        <NewPeriodModal
          currencies={currencies}
          isSaving={isSaving}
          onClose={() => setShowNewPeriod(false)}
          onSubmit={handleCreatePeriod}
        />
      )}

      <div className="kpi-periods-bar">
        <div className="kpi-periods">
          {periods.map((period) => (
            <button
              key={period.id}
              className={`kpi-period-btn${activePeriodId === period.id ? " kpi-period-btn--active" : ""}`}
              onClick={() => setActivePeriodId(period.id)}
            >
              <span className="kpi-period-label">{period.year || period.name}</span>
            </button>
          ))}
        </div>
        <div className="kpi-periods-actions">
          {activePeriod && (
            <button className="kpi-btn-outline kpi-btn-danger" onClick={handleDeletePeriod} disabled={isSaving}>
              <TrashIcon /> Delete period
            </button>
          )}
          <button className="kpi-btn-primary" onClick={() => setShowNewPeriod(true)} disabled={isSaving}>
            <PlusIcon /> New period
          </button>
        </div>
      </div>

      {isLoading && <div className="kpi-empty-state">Loading KPI periods...</div>}

      {!isLoading && periods.length === 0 && (
        <div className="kpi-empty-state">No KPI periods yet. Click "New period" to create the first one.</div>
      )}

      {!isLoading && activePeriod && (
        <div className="kpi-section">
          <div className="kpi-table-header">
            <div className="kpi-toolbar-right">
              <div style={{ minWidth: 180 }}>
                <SimpleDropdown
                  options={DISPLAY_MODE_OPTIONS}
                  value={activeDisplayMode}
                  onChange={(value) => setDisplayMode(activePeriod.id, value)}
                  placeholder="Display mode"
                  labelKey="name"
                  valueKey="id"
                  disabled={isSaving}
                />
              </div>
              <button className="kpi-btn-primary" onClick={() => setShowNewKPI(true)} disabled={isSaving}>
                <PlusIcon /> New KPI
              </button>
            </div>
          </div>

          <div className="kpi-year-row">
            <span className="kpi-year-row-label">Year</span>
            <div className="kpi-year-row-inputs">
              <span className="kpi-year-input" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {yearRangeLabel}
              </span>
            </div>
            <span className="kpi-year-viewtype-badge">
              {DISPLAY_MODE_OPTIONS.find((option) => option.id === activeDisplayMode)?.name || "Quarterly"}
            </span>
          </div>

          <div className="kpi-table-container">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th className="kpi-th kpi-th--label">KPI</th>
                  {activeColumns.map((column) => (
                    <th key={column.key} className="kpi-th kpi-th--period-col">{column.label}</th>
                  ))}
                  <th className="kpi-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDraftEntries.length === 0 && (
                  <tr className="kpi-row">
                    <td className="kpi-td kpi-td--value" colSpan={totalColSpan}>
                      No KPI rows yet. Add the first KPI for this period.
                    </td>
                  </tr>
                )}

                {activeDraftEntries.map((entry) => {
                  const isRowEditing = editingRowIds.has(entry.id);
                  const canEditValues = canEditEntryInMode(entry, activeDisplayMode);
                  return (
                    <tr key={entry.id} className={`kpi-row${isRowEditing ? " kpi-row--editing" : ""}`}>
                      <td className="kpi-td kpi-td--label">
                        <input
                          className="kpi-cell-input kpi-cell-input--text"
                          value={entry.kpiName || ""}
                          onChange={(e) => updateDraftEntry(entry.id, "kpiName", e.target.value)}
                          readOnly={!isRowEditing}
                          disabled={isSaving}
                        />
                      </td>
                      {activeColumns.map((column) => (
                        <td key={column.key} className="kpi-td kpi-td--value">
                          {isRowEditing && canEditValues ? (
                            <input
                              className="kpi-cell-input"
                              value={entry.editableValues?.[column.key] ?? ""}
                              onChange={(e) => updateDraftEntryValue(entry.id, column.key, e.target.value)}
                              disabled={isSaving}
                            />
                          ) : (
                            <span className="kpi-cell-text">{displayCellValue(entry.displayValues?.[column.key])}</span>
                          )}
                        </td>
                      ))}
                      <td className="kpi-td kpi-td--value">
                        {isRowEditing ? (
                          <div className="kpi-row-actions">
                            <button className="kpi-row-action-btn kpi-row-action-btn--save" onClick={() => confirmRowEdit(entry.id)} title="Confirm" disabled={isSaving}>
                              <DoneIcon />
                            </button>
                            <button className="kpi-row-action-btn kpi-row-action-btn--cancel" onClick={() => cancelRowEdit(entry.id)} title="Cancel" disabled={isSaving}>
                              x
                            </button>
                          </div>
                        ) : (
                          <div className="kpi-row-actions">
                            <button
                              className="kpi-row-action-btn"
                              onClick={() => startRowEdit(entry)}
                              title={canEditValues ? "Edit row" : "Switch display mode to edit this KPI frequency"}
                              disabled={isSaving || !canEditValues}
                            >
                              <EditLineIcon />
                            </button>
                            <button className="kpi-row-action-btn kpi-row-action-btn--delete" onClick={() => handleRemoveRow(entry.id)} title="Delete row" disabled={isSaving}>
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="kpi-total-row">
                  <td className="kpi-td" />
                  {activeColumns.map((column) => (
                    <td key={column.key} className="kpi-td kpi-td--value">
                      <span className="kpi-cell-text">{displayCellValue(activeEntriesPayload?.totals?.[column.key])}</span>
                    </td>
                  ))}
                  <td className="kpi-td" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          key={toast.key}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </div>
  );
}
