import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useKpisBackend } from "../../Deals_backend_work";
import "./KPIsTab.css";

const VIEW_OPTIONS = [
  { id: "quarterly",      name: "Quarterly" },
  { id: "semi-annually",  name: "Semi-Annually" },
  { id: "annually",       name: "Annually" },
];

const VIEW_COLUMNS = {
  quarterly:       ["Q1", "Q2", "Q3", "Q4"],
  "semi-annually": ["H1", "H2"],
};

function getColumns(viewType, year) {
  if (viewType === "annually") {
    const y = Number(year) || new Date().getFullYear();
    return [String(y - 3), String(y - 2), String(y - 1), String(y)];
  }
  return VIEW_COLUMNS[viewType] || VIEW_COLUMNS.quarterly;
}

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDraftPeriod(period) {
  const viewType = period.viewType || "quarterly";
  const year =
    period.year ||
    (period.startDate
      ? new Date(period.startDate + "T00:00:00").getFullYear()
      : new Date().getFullYear());
  const cols = getColumns(viewType, year);

  return {
    id: period.id,
    name: period.name || "",
    year,
    viewType,
    currencyId: period.currencyId || null,
    displayOrder: period.displayOrder ?? "",
    entries: period.entries.map((entry) => {
      let values = {};
      try {
        const parsed = JSON.parse(entry.value || "{}");
        if (typeof parsed === "object" && parsed !== null) values = parsed;
      } catch {
        if (entry.value !== null && entry.value !== undefined && entry.value !== "")
          values[cols[0]] = entry.value;
      }
      cols.forEach((col) => { if (!(col in values)) values[col] = ""; });
      return { ...entry, values, unit: entry.unit ?? "", displayOrder: entry.displayOrder ?? "" };
    }),
  };
}

function normalizeNumericInput(value) {
  return String(value ?? "").replace(/[^\d.,-]/g, "");
}

function periodHasChanges(period, draft) {
  if (!period || !draft) return false;
  const originalEntries = JSON.stringify(
    period.entries.map((e) => ({ id: e.id, kpiName: e.kpiName || "", kpiCategoryId: e.kpiCategoryId || "", value: e.value ?? "", unit: e.unit ?? "", displayOrder: e.displayOrder ?? "" }))
  );
  const draftEntries = JSON.stringify(
    draft.entries.map((e) => ({ id: e.id, kpiName: e.kpiName || "", kpiCategoryId: e.kpiCategoryId || "", values: e.values || {}, unit: e.unit ?? "", displayOrder: e.displayOrder ?? "" }))
  );
  return (
    String(period.name || "") !== String(draft.name || "") ||
    String(period.currencyId || "") !== String(draft.currencyId || "") ||
    String(period.displayOrder ?? "") !== String(draft.displayOrder ?? "") ||
    originalEntries !== draftEntries
  );
}

function displayNumber(value) {
  if (value === "" || value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function KPIsTab({ dealId, onSaveStateChange }) {
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const { toast, showToast, closeToast } = useToast();

  const { periods, kpiCategories, currencies, isLoading, isSaving, error, updatePeriod, createEntry, updateEntry, deleteEntry } = useKpisBackend(dealId);

  useEffect(() => {
    setDrafts(Object.fromEntries(periods.map((p) => [p.id, createDraftPeriod(p)])));
    if (periods.length > 0)
      setActivePeriodId((prev) => (prev && periods.some((p) => p.id === prev) ? prev : periods[0].id));
    else setActivePeriodId(null);
  }, [periods]);

  useEffect(() => {
    if (error) showToast({ type: "error", title: "KPIs failed", message: error });
  }, [error, showToast]);

  const activePeriod = useMemo(() => periods.find((p) => p.id === activePeriodId) || null, [periods, activePeriodId]);
  const activeDraft = activePeriodId ? drafts[activePeriodId] || null : null;
  const isDirty = activePeriod && activeDraft ? periodHasChanges(activePeriod, activeDraft) : false;

  const handleSaveRef = useRef(null);
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: () => handleSaveRef.current?.(), isDirty, isSaving });
  }, [isDirty, isSaving, onSaveStateChange]);

  const updateDraftField = (field, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({ ...prev, [activePeriodId]: { ...(prev[activePeriodId] || {}), [field]: value } }));
  };

  const updateEntryField = (entryId, field, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...(prev[activePeriodId] || {}),
        entries: (prev[activePeriodId]?.entries || []).map((e) => (e.id === entryId ? { ...e, [field]: value } : e)),
      },
    }));
  };

  const updateEntryValue = (entryId, col, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...(prev[activePeriodId] || {}),
        entries: (prev[activePeriodId]?.entries || []).map((e) =>
          e.id === entryId ? { ...e, values: { ...e.values, [col]: normalizeNumericInput(value) } } : e
        ),
      },
    }));
  };

  const handleViewTypeChange = (newViewType) => {
    if (!activePeriodId) return;
    const cols = getColumns(newViewType, activeDraft?.year);
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...(prev[activePeriodId] || {}),
        viewType: newViewType,
        entries: (prev[activePeriodId]?.entries || []).map((e) => {
          const values = {};
          cols.forEach((col) => { values[col] = e.values?.[col] ?? ""; });
          return { ...e, values };
        }),
      },
    }));
  };

  const handleAddRow = () => {
    if (!activePeriodId) return;
    const cols = getColumns(activeDraft?.viewType || "quarterly", activeDraft?.year);
    const values = Object.fromEntries(cols.map((col) => [col, ""]));
    const newRow = { id: createTempId("kpi"), kpiName: "", kpiCategoryId: null, values, unit: "", displayOrder: "" };
    updateDraftField("entries", [...(activeDraft?.entries || []), newRow]);
  };

  const handleRemoveRow = (entryId) => {
    updateDraftField("entries", (activeDraft?.entries || []).filter((e) => e.id !== entryId));
  };

  const handleSave = async () => {
    if (!activePeriod || !activeDraft) return;
    try {
      await updatePeriod(activePeriod.id, activeDraft);
      const originalIds = new Set(activePeriod.entries.map((e) => e.id));
      const draftIds = new Set(activeDraft.entries.filter((e) => !String(e.id).startsWith("kpi-")).map((e) => e.id));
      for (const entry of activeDraft.entries) {
        if (!String(entry.kpiName || "").trim()) continue;
        const entryForApi = { ...entry, value: JSON.stringify(entry.values || {}) };
        if (String(entry.id).startsWith("kpi-")) await createEntry(activePeriod.id, entryForApi);
        else await updateEntry(entry.id, entryForApi);
      }
      for (const id of originalIds) {
        if (!draftIds.has(id)) await deleteEntry(id);
      }
      showToast({ type: "success", title: "Saved", message: `"${activeDraft.name}" has been updated successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Save failed", message: err.message || "Could not save KPI changes." });
    }
  };

  handleSaveRef.current = handleSave;

  const activeCols = getColumns(activeDraft?.viewType || "quarterly", activeDraft?.year);

  return (
    <div className="kpi-wrapper">
      <div className="kpi-periods-bar">
        <div className="kpi-periods">
          {periods.map((period) => (
            <button
              key={period.id}
              className={`kpi-period-btn${activePeriodId === period.id ? " kpi-period-btn--active" : ""}`}
              onClick={() => setActivePeriodId(period.id)}
            >
              <span className="kpi-period-label">{period.name}</span>
              <span className="kpi-period-date">
                {period.year || (period.startDate ? new Date(period.startDate + "T00:00:00").getFullYear() : "")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="kpi-empty-state">Loading KPI periods...</div>}

      {!isLoading && periods.length === 0 && (
        <div className="kpi-empty-state">No KPI periods yet. Create the first period to start adding KPI rows.</div>
      )}

      {!isLoading && activeDraft && (
        <div className="kpi-section">
          <div className="kpi-editor-grid">
            <div className="kpi-editor-field">
              <label className="kpi-editor-label">Period name</label>
              <input
                className="kpi-editor-input"
                value={activeDraft.name}
                onChange={(e) => updateDraftField("name", e.target.value)}
                placeholder="Enter period name"
              />
            </div>
            <div className="kpi-editor-field">
              <label className="kpi-editor-label">Year</label>
              <input
                className="kpi-editor-input"
                type="number"
                value={activeDraft.year}
                onChange={(e) => updateDraftField("year", Number(e.target.value))}
                placeholder="2024"
              />
            </div>
            <div className="kpi-editor-field">
              <label className="kpi-editor-label">Period</label>
              <SimpleDropdown
                options={VIEW_OPTIONS}
                value={activeDraft.viewType}
                onChange={handleViewTypeChange}
                placeholder="Select period"
                labelKey="name"
                valueKey="id"
                disabled={isSaving}
              />
            </div>
            <div className="kpi-editor-field">
              <label className="kpi-editor-label">Currency</label>
              <SimpleDropdown
                options={currencies}
                value={activeDraft.currencyId}
                onChange={(value) => updateDraftField("currencyId", value)}
                placeholder="Select currency"
                labelKey="name"
                valueKey="id"
                disabled={isSaving}
              />
            </div>
            <div className="kpi-editor-field">
              <label className="kpi-editor-label">Display order</label>
              <input
                className="kpi-editor-input"
                value={activeDraft.displayOrder}
                onChange={(e) => updateDraftField("displayOrder", normalizeNumericInput(e.target.value))}
                placeholder="Order"
              />
            </div>
          </div>

          <div className="kpi-table-header">
            <button className="kpi-btn-primary" onClick={handleAddRow} disabled={isSaving}>
              <PlusIcon /> New KPI
            </button>
          </div>

          <div className="kpi-table-container">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th className="kpi-th kpi-th--label">KPI</th>
                  <th className="kpi-th kpi-th--category">Category</th>
                  {activeCols.map((col) => (
                    <th key={col} className="kpi-th kpi-th--period-col">{col}</th>
                  ))}
                  <th className="kpi-th">Unit</th>
                  <th className="kpi-th">Order</th>
                  <th className="kpi-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDraft.entries.length === 0 && (
                  <tr className="kpi-row">
                    <td className="kpi-td kpi-td--value" colSpan={4 + activeCols.length}>
                      No KPI rows yet. Add the first KPI for this period.
                    </td>
                  </tr>
                )}
                {activeDraft.entries.map((entry) => (
                  <tr key={entry.id} className="kpi-row">
                    <td className="kpi-td kpi-td--label">
                      <input
                        className="kpi-cell-input kpi-cell-input--text"
                        value={entry.kpiName}
                        onChange={(e) => updateEntryField(entry.id, "kpiName", e.target.value)}
                        placeholder="KPI name"
                      />
                    </td>
                    <td className="kpi-td kpi-td--category">
                      <SimpleDropdown
                        options={kpiCategories}
                        value={entry.kpiCategoryId}
                        onChange={(value) => updateEntryField(entry.id, "kpiCategoryId", value)}
                        placeholder="Select category"
                        labelKey="name"
                        valueKey="id"
                        disabled={isSaving}
                      />
                    </td>
                    {activeCols.map((col) => (
                      <td key={col} className="kpi-td kpi-td--value">
                        <input
                          className="kpi-cell-input"
                          value={entry.values?.[col] ?? ""}
                          onChange={(e) => updateEntryValue(entry.id, col, e.target.value)}
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td className="kpi-td kpi-td--value">
                      <input
                        className="kpi-cell-input"
                        value={entry.unit}
                        onChange={(e) => updateEntryField(entry.id, "unit", e.target.value)}
                        placeholder="EUR, %, count..."
                      />
                    </td>
                    <td className="kpi-td kpi-td--value">
                      <input
                        className="kpi-cell-input"
                        value={entry.displayOrder}
                        onChange={(e) => updateEntryField(entry.id, "displayOrder", normalizeNumericInput(e.target.value))}
                        placeholder="-"
                      />
                    </td>
                    <td className="kpi-td kpi-td--value">
                      <button className="kpi-row-delete-btn" onClick={() => handleRemoveRow(entry.id)} disabled={isSaving}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="kpi-total-row">
                  <td className="kpi-total-label">Total</td>
                  <td />
                  {activeCols.map((col) => (
                    <td key={col} className="kpi-total-value">
                      {displayNumber(activeDraft.entries.reduce((sum, e) => sum + (Number(e.values?.[col]) || 0), 0))}
                    </td>
                  ))}
                  <td className="kpi-total-value">-</td>
                  <td className="kpi-total-value">-</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <Toast key={toast.key} title={toast.title} message={toast.message} type={toast.type} duration={toast.duration} onClose={closeToast} />
      )}
    </div>
  );
}
