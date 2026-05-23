import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useKpisBackend } from "../../Deals_backend_work";
import NewKPIModal from "./components/NewKPIModal";
import "./KPIsTab.css";

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
  const [showNewKPI, setShowNewKPI] = useState(false);
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

  const handleCreateKPI = async ({ kpiName, kpiCategoryId, viewType, currencyId, unit, order, displayOrder, year, values }) => {
    if (!activePeriodId) return;
    try {
      await createEntry(activePeriodId, { kpiName, kpiCategoryId, viewType, currencyId, unit, order, displayOrder, year, value: JSON.stringify(values || {}) });
      setShowNewKPI(false);
      showToast({ type: "success", title: "KPI created", message: `"${kpiName}" has been added successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Create failed", message: err.message || "Could not create the KPI." });
    }
  };

  const handleRemoveRow = async (entryId) => {
    try {
      await deleteEntry(entryId);
      showToast({ type: "success", title: "Deleted", message: "KPI row removed." });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not remove KPI row." });
    }
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
      {showNewKPI && (
        <NewKPIModal
          kpiCategories={kpiCategories}
          currencies={currencies}
          isSaving={isSaving}
          onClose={() => setShowNewKPI(false)}
          onSubmit={handleCreateKPI}
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
          <div className="kpi-table-header">
            <button className="kpi-btn-primary" onClick={() => setShowNewKPI(true)} disabled={isSaving}>
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
                      <span className="kpi-cell-text">{entry.kpiName || "—"}</span>
                    </td>
                    <td className="kpi-td kpi-td--category">
                      <span className="kpi-cell-text">
                        {kpiCategories.find((c) => String(c.id) === String(entry.kpiCategoryId))?.name || "—"}
                      </span>
                    </td>
                    {activeCols.map((col) => (
                      <td key={col} className="kpi-td kpi-td--value">
                        <span className="kpi-cell-text">{displayNumber(entry.values?.[col])}</span>
                      </td>
                    ))}
                    <td className="kpi-td kpi-td--value">
                      <span className="kpi-cell-text">{entry.unit || "—"}</span>
                    </td>
                    <td className="kpi-td kpi-td--value">
                      <span className="kpi-cell-text">{entry.displayOrder || "—"}</span>
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
