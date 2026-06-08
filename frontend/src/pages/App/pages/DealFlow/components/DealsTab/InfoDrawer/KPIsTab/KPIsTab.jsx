import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon, CloseIcon, EditLineIcon, DoneIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
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

const lsVtKey = (id) => `amethis-kpi-vt-${id}`;
function saveViewType(id, vt) { try { if (vt) localStorage.setItem(lsVtKey(id), vt); } catch {} }
function loadViewType(id) { try { return localStorage.getItem(lsVtKey(id)) || null; } catch { return null; } }

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function parseEntryValue(raw) {
  if (raw && typeof raw === "object") return raw;
  if (typeof raw === "string") { try { return JSON.parse(raw || "{}"); } catch { return {}; } }
  return {};
}

function inferViewType(period) {
  if (period.viewType) return period.viewType;
  const stored = loadViewType(period.id);
  if (stored) return stored;
  const entries = toSafeArray(period.entries);
  for (const entry of entries) {
    const vals = entry.values && typeof entry.values === "object" ? entry.values : parseEntryValue(entry.value);
    const keys = Object.keys(vals);
    if (keys.some((k) => /^H\d/.test(k))) return "semi-annually";
    if (keys.some((k) => /^Q\d/.test(k))) return "quarterly";
    if (keys.some((k) => /^\d{4}$/.test(k))) return "annually";
  }
  return null;
}

function createDraftPeriod(period) {
  const viewType = inferViewType(period);
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
    startYear: period.startYear || year,
    viewType,
    currencyId: period.currencyId || null,
    displayOrder: period.displayOrder ?? "",
    entries: period.entries.map((entry) => {
      const parsed = parseEntryValue(entry.value);
      const values = typeof parsed === "object" && parsed !== null ? { ...parsed } : {};
      cols.forEach((col) => { if (!(col in values)) values[col] = ""; });
      return { ...entry, values, unit: entry.unit ?? "", displayOrder: entry.displayOrder ?? "" };
    }),
  };
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

function NewPeriodModal({ currencies, isSaving, onClose, onSubmit }) {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState("");
  const [year, setYear] = useState(currentYear);
  const [currencyId, setCurrencyId] = useState(null);
  const canSubmit = name.trim() !== "" && Number(year) > 1900;
  return (
    <div className="kpi-modal-overlay" onClick={onClose}>
      <div className="kpi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kpi-modal-header">
          <span className="kpi-modal-title">New KPI Period</span>
          <button className="kpi-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="kpi-modal-body">
          <div className="kpi-modal-field">
            <label className="kpi-modal-label">Period name *</label>
            <input
              className="kpi-modal-input"
              placeholder="e.g. 2024 KPIs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="kpi-modal-row">
            <div className="kpi-modal-field">
              <label className="kpi-modal-label">Year *</label>
              <input
                className="kpi-modal-input"
                type="number"
                placeholder={String(currentYear)}
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
          <button className="kpi-modal-btn-create" onClick={() => canSubmit && onSubmit({ name: name.trim(), startDate: `${year}-01-01`, currencyId })} disabled={!canSubmit || isSaving}>
            {isSaving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KPIsTab({ dealId, onSaveStateChange }) {
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [showNewKPI, setShowNewKPI] = useState(false);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [editingRowIds, setEditingRowIds] = useState(new Set());
  const [rowSnapshots, setRowSnapshots] = useState({});
  const { toast, showToast, closeToast } = useToast();

  const { periods, kpiCategories, currencies, isLoading, isSaving, error, createPeriod, updatePeriod, deletePeriod, createEntry, updateEntry, deleteEntry } = useKpisBackend(dealId);

  useEffect(() => {
    setDrafts((prevDrafts) =>
      Object.fromEntries(
        periods.map((p) => {
          const draft = createDraftPeriod(p);
          if (!p.viewType && prevDrafts[p.id]?.viewType) {
            draft.viewType = prevDrafts[p.id].viewType;
          }
          // Merge modal values that the backend may not have stored yet
          const pending = pendingEntryValues.current;
          if (Object.keys(pending).length > 0) {
            draft.entries = draft.entries.map((entry) => {
              const pv = pending[entry.id];
              if (!pv) return entry;
              const merged = { ...entry.values };
              Object.entries(pv).forEach(([col, val]) => {
                if (val !== "" && (merged[col] === "" || merged[col] === undefined)) merged[col] = val;
              });
              return { ...entry, values: merged };
            });
          }
          return [p.id, draft];
        })
      )
    );
    if (periods.length > 0)
      setActivePeriodId((prev) => (prev && periods.some((p) => p.id === prev) ? prev : periods[0].id));
    else setActivePeriodId(null);
    setEditingRowIds(new Set());
    setRowSnapshots({});
  }, [periods]);

  useEffect(() => {
    if (error) showToast({ type: "error", title: "KPIs failed", message: error });
  }, [error, showToast]);

  const activePeriod = useMemo(() => periods.find((p) => p.id === activePeriodId) || null, [periods, activePeriodId]);
  const activeDraft = activePeriodId ? drafts[activePeriodId] || null : null;
  const isDirty = activePeriod && activeDraft ? periodHasChanges(activePeriod, activeDraft) : false;

  const handleSaveRef = useRef(null);
  const pendingEntryValues = useRef({});
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: () => handleSaveRef.current?.(), isDirty, isSaving });
  }, [isDirty, isSaving, onSaveStateChange]);

  const updateDraftField = (field, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({ ...prev, [activePeriodId]: { ...(prev[activePeriodId] || {}), [field]: value } }));
  };

  const updateDraftEntry = (entryId, field, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...prev[activePeriodId],
        entries: prev[activePeriodId].entries.map((e) =>
          e.id === entryId ? { ...e, [field]: value } : e
        ),
      },
    }));
  };

  const updateDraftEntryValue = (entryId, col, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...prev[activePeriodId],
        entries: prev[activePeriodId].entries.map((e) =>
          e.id === entryId ? { ...e, values: { ...e.values, [col]: value.replace(/[^\d.,-]/g, "") } } : e
        ),
      },
    }));
  };

  const startRowEdit = (entry) => {
    setEditingRowIds((prev) => new Set([...prev, entry.id]));
    setRowSnapshots((prev) => ({ ...prev, [entry.id]: { ...entry, values: { ...entry.values } } }));
  };

  const confirmRowEdit = (id) => {
    setEditingRowIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setRowSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const cancelRowEdit = (id) => {
    const snapshot = rowSnapshots[id];
    if (snapshot && activePeriodId) {
      setDrafts((prev) => ({
        ...prev,
        [activePeriodId]: {
          ...prev[activePeriodId],
          entries: prev[activePeriodId].entries.map((e) => e.id === id ? snapshot : e),
        },
      }));
    }
    setEditingRowIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setRowSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleCreatePeriod = async (payload) => {
    try {
      await createPeriod(payload);
      setShowNewPeriod(false);
      showToast({ type: "success", title: "Period created", message: `"${payload.name}" has been created.` });
    } catch (err) {
      showToast({ type: "error", title: "Create failed", message: err.message || "Could not create the period." });
    }
  };

  const handleDeletePeriod = async () => {
    if (!activePeriod) return;
    if (!window.confirm(`Delete period "${activePeriod.name}"?`)) return;
    try {
      await deletePeriod(activePeriod.id);
      showToast({ type: "success", title: "Period deleted", message: `"${activePeriod.name}" has been removed.` });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the period." });
    }
  };

  const handleCreateKPI = async ({ kpiName, kpiCategoryId, viewType, currencyId, unit, order, displayOrder, year, values }) => {
    if (!activePeriodId) return;
    try {
      const created = await createEntry(activePeriodId, { kpiName, kpiCategoryId, viewType, currencyId, unit, order, displayOrder, year, value: JSON.stringify(values || {}) });
      if (viewType) {
        updateDraftField("viewType", viewType);
        saveViewType(activePeriodId, viewType);
      }
      // Store modal values in ref so the useEffect can merge them even if backend returns empty
      if (created?.id && values && Object.keys(values).length > 0) {
        pendingEntryValues.current[created.id] = values;
      }
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

  const isAnyRowEditing = editingRowIds.size > 0;
  const activeViewType = activeDraft?.viewType || null;
  const activeCols = activeViewType ? getColumns(activeViewType, activeDraft?.year) : [];
  const toYear   = Number(activeDraft?.year)      || new Date().getFullYear();
  const fromYear = activeViewType === "annually"
    ? toYear - 3
    : (Number(activeDraft?.startYear) || toYear);

  const [fromYearRaw, setFromYearRaw] = useState(String(fromYear));
  const [toYearRaw, setToYearRaw]     = useState(String(toYear));

  useEffect(() => { setFromYearRaw(String(fromYear)); }, [fromYear]);
  useEffect(() => { setToYearRaw(String(toYear)); }, [toYear]);

  const commitFromYear = () => {
    const v = parseInt(fromYearRaw);
    if (!isNaN(v) && v >= 1900) {
      if (activeViewType === "annually") {
        updateDraftField("year", v + 3);
      } else {
        updateDraftField("startYear", v);
      }
    } else {
      setFromYearRaw(String(fromYear));
    }
  };

  const commitToYear = () => {
    const v = parseInt(toYearRaw);
    if (!isNaN(v) && v >= 1900) updateDraftField("year", v);
    else setToYearRaw(String(toYear));
  };

  const viewTypeBadgeLabel = activeViewType === "quarterly" ? "Quarterly"
    : activeViewType === "semi-annually" ? "Semi-Annual"
    : activeViewType === "annually" ? "Annual"
    : null;

  return (
    <div className="kpi-wrapper">
      {showNewKPI && (
        <NewKPIModal
          kpiCategories={kpiCategories}
          currencies={currencies}
          year={activeDraft?.year}
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
              <span className="kpi-period-label">{period.name}</span>
              <span className="kpi-period-date">
                {period.year || (period.startDate ? new Date(period.startDate + "T00:00:00").getFullYear() : "")}
              </span>
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

      {!isLoading && activeDraft && (
        <div className="kpi-section">
          <div className="kpi-table-header">
            <button className="kpi-btn-primary" onClick={() => setShowNewKPI(true)} disabled={isSaving}>
              <PlusIcon /> New KPI
            </button>
          </div>

          <div className="kpi-year-row">
            <span className="kpi-year-row-label">Year</span>
            <div className="kpi-year-row-inputs">
              <input
                className="kpi-year-input"
                type="number"
                value={fromYearRaw}
                onChange={(e) => setFromYearRaw(e.target.value)}
                onBlur={commitFromYear}
                onKeyDown={(e) => e.key === "Enter" && commitFromYear()}
                disabled={isSaving}
              />
              <span className="kpi-year-row-sep">–</span>
              <input
                className="kpi-year-input"
                type="number"
                value={toYearRaw}
                onChange={(e) => setToYearRaw(e.target.value)}
                onBlur={commitToYear}
                onKeyDown={(e) => e.key === "Enter" && commitToYear()}
                disabled={isSaving}
              />
            </div>
            {viewTypeBadgeLabel && (
              <span className="kpi-year-viewtype-badge">{viewTypeBadgeLabel}</span>
            )}
          </div>

          <div className="kpi-table-container">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th className="kpi-th kpi-th--label">KPI</th>
                  {isAnyRowEditing && <th className="kpi-th kpi-th--category">Category</th>}
                  {activeCols.map((col) => (
                    <th key={col} className="kpi-th kpi-th--period-col">{col}</th>
                  ))}
                  {isAnyRowEditing && <th className="kpi-th">Unit</th>}
                  {isAnyRowEditing && <th className="kpi-th">Order</th>}
                  <th className="kpi-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDraft.entries.length === 0 && (
                  <tr className="kpi-row">
                    <td className="kpi-td kpi-td--value" colSpan={2 + activeCols.length}>
                      {activeViewType
                        ? "No KPI rows yet. Add the first KPI for this period."
                        : "No KPIs yet. Click \"+ New KPI\" and select a period type (Quarterly, Semi-Annual, or Annual)."}
                    </td>
                  </tr>
                )}
                {activeDraft.entries.map((entry) => {
                  const isRowEditing = editingRowIds.has(entry.id);
                  return (
                  <tr key={entry.id} className={`kpi-row${isRowEditing ? " kpi-row--editing" : ""}`}>
                    <td className="kpi-td kpi-td--label">
                      <input
                        className="kpi-cell-input kpi-cell-input--text"
                        value={entry.kpiName || ""}
                        onChange={(e) => updateDraftEntry(entry.id, "kpiName", e.target.value)}
                        placeholder="KPI item"
                        readOnly={!isRowEditing}
                        disabled={isSaving}
                      />
                    </td>
                    {isAnyRowEditing && (
                      <td className="kpi-td kpi-td--category">
                        <SimpleDropdown
                          options={kpiCategories}
                          value={entry.kpiCategoryId}
                          onChange={(val) => updateDraftEntry(entry.id, "kpiCategoryId", val)}
                          placeholder="—"
                          labelKey="name"
                          valueKey="id"
                          disabled={!isRowEditing || isSaving}
                        />
                      </td>
                    )}
                    {activeCols.map((col) => (
                      <td key={col} className="kpi-td kpi-td--value">
                        <input
                          className="kpi-cell-input"
                          value={entry.values?.[col] ?? ""}
                          onChange={(e) => updateDraftEntryValue(entry.id, col, e.target.value)}
                          placeholder="0"
                          readOnly={!isRowEditing}
                          disabled={isSaving}
                        />
                      </td>
                    ))}
                    {isAnyRowEditing && (
                      <td className="kpi-td kpi-td--value">
                        <input
                          className="kpi-cell-input"
                          value={entry.unit || ""}
                          onChange={(e) => updateDraftEntry(entry.id, "unit", e.target.value)}
                          placeholder="—"
                          readOnly={!isRowEditing}
                          disabled={isSaving}
                        />
                      </td>
                    )}
                    {isAnyRowEditing && (
                      <td className="kpi-td kpi-td--value">
                        <input
                          className="kpi-cell-input"
                          type="number"
                          value={entry.displayOrder || ""}
                          onChange={(e) => updateDraftEntry(entry.id, "displayOrder", e.target.value)}
                          placeholder="—"
                          readOnly={!isRowEditing}
                          disabled={isSaving}
                        />
                      </td>
                    )}
                    <td className="kpi-td kpi-td--value">
                      {isRowEditing ? (
                        <div className="kpi-row-actions">
                          <button className="kpi-row-action-btn kpi-row-action-btn--save" onClick={() => confirmRowEdit(entry.id)} title="Confirm" disabled={isSaving}>
                            <DoneIcon />
                          </button>
                          <button className="kpi-row-action-btn kpi-row-action-btn--cancel" onClick={() => cancelRowEdit(entry.id)} title="Cancel" disabled={isSaving}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="kpi-row-actions">
                          <button className="kpi-row-action-btn" onClick={() => startRowEdit(entry)} title="Edit row" disabled={isSaving}>
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
                  <td colSpan={isAnyRowEditing ? 5 + activeCols.length : 2 + activeCols.length} />
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
