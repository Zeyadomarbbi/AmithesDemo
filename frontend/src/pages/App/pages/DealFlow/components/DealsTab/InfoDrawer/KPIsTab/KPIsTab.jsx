import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useKpisBackend } from "../../Deals_backend_work";
import "./KPIsTab.css";

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDraftPeriod(period) {
  return {
    id: period.id,
    name: period.name || "",
    startDate: period.startDateObject || null,
    endDate: period.endDateObject || null,
    currencyId: period.currencyId || null,
    displayOrder: period.displayOrder ?? "",
    entries: period.entries.map((entry) => ({
      ...entry,
      value: entry.value ?? "",
      unit: entry.unit ?? "",
      displayOrder: entry.displayOrder ?? "",
    })),
  };
}

function normalizeNumericInput(value) {
  return String(value ?? "").replace(/[^\d.,-]/g, "");
}

function formatPeriodDate(date) {
  if (!date) return "";
  const source = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(source.getTime())) return "";
  return `${String(source.getDate()).padStart(2, "0")}/${String(source.getMonth() + 1).padStart(2, "0")}/${source.getFullYear()}`;
}

function periodHasChanges(period, draft) {
  if (!period || !draft) return false;
  const originalStart = period.startDate || "";
  const originalEnd = period.endDate || "";
  const draftStart = draft.startDate instanceof Date && !Number.isNaN(draft.startDate.getTime())
    ? draft.startDate.toISOString().slice(0, 10)
    : "";
  const draftEnd = draft.endDate instanceof Date && !Number.isNaN(draft.endDate.getTime())
    ? draft.endDate.toISOString().slice(0, 10)
    : "";

  const originalEntries = JSON.stringify(period.entries.map((entry) => ({
    id: entry.id,
    kpiName: entry.kpiName || "",
    kpiCategoryId: entry.kpiCategoryId || "",
    value: entry.value ?? "",
    unit: entry.unit ?? "",
    displayOrder: entry.displayOrder ?? "",
  })));
  const draftEntries = JSON.stringify(draft.entries.map((entry) => ({
    id: entry.id,
    kpiName: entry.kpiName || "",
    kpiCategoryId: entry.kpiCategoryId || "",
    value: entry.value ?? "",
    unit: entry.unit ?? "",
    displayOrder: entry.displayOrder ?? "",
  })));

  return (
    String(period.name || "") !== String(draft.name || "") ||
    String(period.currencyId || "") !== String(draft.currencyId || "") ||
    String(period.displayOrder ?? "") !== String(draft.displayOrder ?? "") ||
    String(originalStart) !== String(draftStart) ||
    String(originalEnd) !== String(draftEnd) ||
    originalEntries !== draftEntries
  );
}

function displayNumber(value) {
  if (value === "" || value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function KPIsTab({ dealId, onSaveStateChange }) {
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [showCreator, setShowCreator] = useState(false);
  const [creator, setCreator] = useState({
    name: "",
    startDate: null,
    endDate: null,
    currencyId: null,
    displayOrder: "",
  });
  const { toast, showToast, closeToast } = useToast();

  const {
    periods,
    kpiCategories,
    currencies,
    isLoading,
    isSaving,
    error,
    createPeriod,
    updatePeriod,
    deletePeriod,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useKpisBackend(dealId);

  useEffect(() => {
    setDrafts(Object.fromEntries(periods.map((period) => [period.id, createDraftPeriod(period)])));
    if (periods.length > 0) {
      setActivePeriodId((prev) => (prev && periods.some((period) => period.id === prev) ? prev : periods[0].id));
    } else {
      setActivePeriodId(null);
    }
  }, [periods]);

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        title: "KPIs failed",
        message: error,
      });
    }
  }, [error, showToast]);

  const activePeriod = useMemo(
    () => periods.find((period) => period.id === activePeriodId) || null,
    [periods, activePeriodId]
  );
  const activeDraft = activePeriodId ? drafts[activePeriodId] || null : null;
  const isDirty = activePeriod && activeDraft ? periodHasChanges(activePeriod, activeDraft) : false;

  const handleSaveRef = useRef(null);
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: () => handleSaveRef.current?.(), isDirty, isSaving });
  }, [isDirty, isSaving, onSaveStateChange]);

  const updateDraftField = (field, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...(prev[activePeriodId] || {}),
        [field]: value,
      },
    }));
  };

  const updateEntryField = (entryId, field, value) => {
    if (!activePeriodId) return;
    setDrafts((prev) => ({
      ...prev,
      [activePeriodId]: {
        ...(prev[activePeriodId] || {}),
        entries: (prev[activePeriodId]?.entries || []).map((entry) =>
          entry.id === entryId ? { ...entry, [field]: value } : entry
        ),
      },
    }));
  };

  const handleCreatePeriod = async () => {
    try {
      const created = await createPeriod(creator);
      setCreator({ name: "", startDate: null, endDate: null, currencyId: null, displayOrder: "" });
      setShowCreator(false);
      setActivePeriodId(created.id);
      showToast({
        type: "success",
        title: "Period created",
        message: `"${created.name}" has been created successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Create failed",
        message: err.message || "Could not create the KPI period.",
      });
    }
  };

  const handleDeletePeriod = async () => {
    if (!activePeriod) return;
    if (!window.confirm(`Delete KPI period "${activePeriod.name}"?`)) return;
    try {
      await deletePeriod(activePeriod.id);
      showToast({
        type: "success",
        title: "Period deleted",
        message: `"${activePeriod.name}" has been deleted successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the KPI period.",
      });
    }
  };

  const handleAddRow = () => {
    if (!activePeriodId) return;
    const newRow = {
      id: createTempId("kpi"),
      kpiName: "",
      kpiCategoryId: null,
      value: "",
      unit: "",
      displayOrder: "",
    };
    updateDraftField("entries", [...(activeDraft?.entries || []), newRow]);
  };

  const handleRemoveRow = (entryId) => {
    updateDraftField(
      "entries",
      (activeDraft?.entries || []).filter((entry) => entry.id !== entryId)
    );
  };

  const handleSave = async () => {
    if (!activePeriod || !activeDraft) return;
    try {
      await updatePeriod(activePeriod.id, activeDraft);

      const originalEntries = activePeriod.entries;
      const draftEntries = activeDraft.entries;
      const originalIds = new Set(originalEntries.map((entry) => entry.id));
      const draftIds = new Set(draftEntries.filter((entry) => !String(entry.id).startsWith("kpi-")).map((entry) => entry.id));

      for (const entry of draftEntries) {
        if (!String(entry.kpiName || "").trim()) continue;
        if (String(entry.id).startsWith("kpi-")) {
          await createEntry(activePeriod.id, entry);
        } else {
          await updateEntry(entry.id, entry);
        }
      }

      for (const originalId of originalIds) {
        if (!draftIds.has(originalId)) {
          await deleteEntry(originalId);
        }
      }

      showToast({
        type: "success",
        title: "Saved",
        message: `"${activeDraft.name}" has been updated successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Save failed",
        message: err.message || "Could not save KPI changes.",
      });
    }
  };

  handleSaveRef.current = handleSave;

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
                {formatPeriodDate(period.startDateObject || period.startDate)}
                {(period.endDateObject || period.endDate) ? ` - ${formatPeriodDate(period.endDateObject || period.endDate)}` : ""}
              </span>
            </button>
          ))}
        </div>
        <div className="kpi-toolbar-right">
          {activePeriod && (
            <button className="kpi-btn-danger" onClick={handleDeletePeriod} disabled={isSaving}>
              <TrashIcon /> Delete period
            </button>
          )}
          <button className="kpi-btn-primary" onClick={() => setShowCreator((prev) => !prev)} disabled={isSaving}>
            <PlusIcon /> New period
          </button>
        </div>
      </div>

      {showCreator && (
        <div className="kpi-creator-card">
          <div className="kpi-creator-grid">
            <input
              className="kpi-editor-input"
              value={creator.name}
              onChange={(e) => setCreator((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Period name"
            />
            <DateInputWithPicker
              initialDate={creator.startDate}
              onDateChange={(date) => setCreator((prev) => ({ ...prev, startDate: date }))}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
            <DateInputWithPicker
              initialDate={creator.endDate}
              onDateChange={(date) => setCreator((prev) => ({ ...prev, endDate: date }))}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
            <SimpleDropdown
              options={currencies}
              value={creator.currencyId}
              onChange={(value) => setCreator((prev) => ({ ...prev, currencyId: value }))}
              placeholder="Select currency"
              labelKey="name"
              valueKey="id"
              disabled={isSaving}
            />
            <input
              className="kpi-editor-input"
              value={creator.displayOrder}
              onChange={(e) => setCreator((prev) => ({ ...prev, displayOrder: normalizeNumericInput(e.target.value) }))}
              placeholder="Display order"
            />
            <button className="kpi-btn-primary" onClick={handleCreatePeriod} disabled={isSaving}>
              {isSaving ? "Saving..." : "Create"}
            </button>
          </div>
        </div>
      )}

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
              <label className="kpi-editor-label">Start date</label>
              <DateInputWithPicker
                initialDate={activeDraft.startDate}
                onDateChange={(date) => updateDraftField("startDate", date)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
            <div className="kpi-editor-field">
              <label className="kpi-editor-label">End date</label>
              <DateInputWithPicker
                initialDate={activeDraft.endDate}
                onDateChange={(date) => updateDraftField("endDate", date)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
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
                  <th className="kpi-th">Category</th>
                  <th className="kpi-th">Value</th>
                  <th className="kpi-th">Unit</th>
                  <th className="kpi-th">Order</th>
                  <th className="kpi-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDraft.entries.length === 0 && (
                  <tr className="kpi-row">
                    <td className="kpi-td kpi-td--value" colSpan={6}>No KPI rows yet. Add the first KPI for this period.</td>
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
                    <td className="kpi-td kpi-td--value">
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
                    <td className="kpi-td kpi-td--value">
                      <input
                        className="kpi-cell-input"
                        value={entry.value}
                        onChange={(e) => updateEntryField(entry.id, "value", normalizeNumericInput(e.target.value))}
                        placeholder="-"
                      />
                    </td>
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
                  <td className="kpi-total-value">
                    {displayNumber(
                      activeDraft.entries.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)
                    )}
                  </td>
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
