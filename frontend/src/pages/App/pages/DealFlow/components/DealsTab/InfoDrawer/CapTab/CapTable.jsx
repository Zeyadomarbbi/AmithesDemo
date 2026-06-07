import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon, DuplicateIcon, EditLineIcon, DoneIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useCapTableBackend } from "../../Deals_backend_work";
import NewCapModal from "./components/NewCapModal";
import "./CapTable.css";

// Pool of backend-supported share column slots
const COLUMN_POOL = [
  { key: "seriesA", label: "Series A" },
  { key: "seriesB", label: "Series B" },
  { key: "common", label: "Common" },
  { key: "preferred", label: "Preferred" },
  { key: "seed", label: "Seed" },
  { key: "esop", label: "ESOP" },
];

const PERCENTAGE_COLUMNS = [
  { key: "nonFullyDilutedPercentage", label: "n.f.d (%)" },
  { key: "fullyDilutedPercentage", label: "f.d (%)" },
];

// Keys used in n.f.d and f.d formula (based on Excel: SUM(SeriesA:Seed) / total; f.d additionally includes ESOP)
const NFD_KEYS = ["seriesA", "seriesB", "common", "preferred", "seed"];
const FD_KEYS = [...NFD_KEYS, "esop"];

function loadColumnConfig(snapshotId) {
  try {
    const stored = localStorage.getItem(`ct_cols_${snapshotId}`);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.left)) return parsed;
    if (Array.isArray(parsed)) return { left: parsed, middle: [] }; // backward compat
    return null;
  } catch { return null; }
}

function saveColumnConfig(snapshotId, left, middle = []) {
  try {
    localStorage.setItem(`ct_cols_${snapshotId}`, JSON.stringify({ left, middle }));
  } catch {}
}

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_COLUMNS = COLUMN_POOL.slice(0, 3); // Series A, Series B, Common — leave room to add more

function createDraftSnapshot(snapshot) {
  const savedCols = loadColumnConfig(snapshot.id);
  return {
    id: snapshot.id,
    name: snapshot.name || "",
    snapshotDate: snapshot.snapshotDateObject || null,
    columns: savedCols?.left || DEFAULT_COLUMNS.map((c) => ({ ...c })),
    middleColumns: savedCols?.middle || [],
    entries: snapshot.entries.map((entry) => ({
      ...entry,
      seriesA: entry.seriesA ?? "",
      seriesB: entry.seriesB ?? "",
      common: entry.common ?? "",
      preferred: entry.preferred ?? "",
      seed: entry.seed ?? "",
      esop: entry.esop ?? "",
      nonFullyDilutedPercentage: entry.nonFullyDilutedPercentage ?? "",
      fullyDilutedPercentage: entry.fullyDilutedPercentage ?? "",
    })),
  };
}

function normalizeNumericInput(value) {
  return String(value ?? "").replace(/[^\d.,-]/g, "");
}

function displayNumber(value, digits = 2) {
  if (value === "" || value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatTabDate(date) {
  if (!date) return "";
  const source = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(source.getTime())) return "";
  return `${String(source.getDate()).padStart(2, "0")}/${String(source.getMonth() + 1).padStart(2, "0")}/${source.getFullYear()}`;
}

function snapshotHasChanges(snapshot, draft) {
  if (!snapshot || !draft) return false;
  const originalDate = snapshot.snapshotDate || "";
  const draftDate = draft.snapshotDate instanceof Date && !Number.isNaN(draft.snapshotDate.getTime())
    ? draft.snapshotDate.toISOString().slice(0, 10)
    : "";

  const originalEntries = JSON.stringify(snapshot.entries.map((entry) => ({
    id: entry.id,
    shareholderName: entry.shareholderName || "",
    comment: entry.comment || "",
    seriesA: entry.seriesA ?? "",
    seriesB: entry.seriesB ?? "",
    common: entry.common ?? "",
    preferred: entry.preferred ?? "",
    seed: entry.seed ?? "",
    esop: entry.esop ?? "",
    nonFullyDilutedPercentage: entry.nonFullyDilutedPercentage ?? "",
    fullyDilutedPercentage: entry.fullyDilutedPercentage ?? "",
  })));

  const draftEntries = JSON.stringify(draft.entries.map((entry) => ({
    id: entry.id,
    shareholderName: entry.shareholderName || "",
    comment: entry.comment || "",
    seriesA: entry.seriesA ?? "",
    seriesB: entry.seriesB ?? "",
    common: entry.common ?? "",
    preferred: entry.preferred ?? "",
    seed: entry.seed ?? "",
    esop: entry.esop ?? "",
    nonFullyDilutedPercentage: entry.nonFullyDilutedPercentage ?? "",
    fullyDilutedPercentage: entry.fullyDilutedPercentage ?? "",
  })));

  return (
    String(snapshot.name || "") !== String(draft.name || "") ||
    String(originalDate) !== String(draftDate) ||
    originalEntries !== draftEntries
  );
}

function buildTotals(entries, columns) {
  const allKeys = [
    ...columns.map((c) => c.key),
    ...PERCENTAGE_COLUMNS.map((c) => c.key),
  ];
  return Object.fromEntries(
    allKeys.map((key) => [key, entries.reduce((sum, e) => sum + (Number(e[key]) || 0), 0)])
  );
}

export default function CapTable({ dealId, onSaveStateChange }) {
  const [showModal, setShowModal] = useState(false);
  const [activeSnapshotId, setActiveSnapshotId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingRowIds, setEditingRowIds] = useState(new Set());
  const [rowSnapshots, setRowSnapshots] = useState({});
  const { toast, showToast, closeToast } = useToast();

  const {
    snapshots,
    isLoading,
    isSaving,
    error,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useCapTableBackend(dealId);

  useEffect(() => {
    setDrafts(Object.fromEntries(snapshots.map((snapshot) => [snapshot.id, createDraftSnapshot(snapshot)])));
    if (snapshots.length > 0) {
      setActiveSnapshotId((prev) => (prev && snapshots.some((snapshot) => snapshot.id === prev) ? prev : snapshots[0].id));
    } else {
      setActiveSnapshotId(null);
    }
  }, [snapshots]);

  useEffect(() => {
    if (error) {
      showToast({ type: "error", title: "Cap table failed", message: error });
    }
  }, [error, showToast]);

  const activeSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === activeSnapshotId) || null,
    [snapshots, activeSnapshotId]
  );
  const activeDraft = activeSnapshotId ? drafts[activeSnapshotId] || null : null;
  const activeColumns = activeDraft?.columns || DEFAULT_COLUMNS;
  const middleColumns = activeDraft?.middleColumns || [];
  const totals = useMemo(
    () => buildTotals(activeDraft?.entries || [], [...(activeDraft?.columns || DEFAULT_COLUMNS), ...(activeDraft?.middleColumns || [])]),
    [activeDraft]
  );
  const isDirty = activeSnapshot && activeDraft ? snapshotHasChanges(activeSnapshot, activeDraft) : false;

  const entryPcts = useMemo(() => {
    const entries = activeDraft?.entries || [];
    const nfdKeys = activeColumns.map((c) => c.key);
    const fdKeys = [...nfdKeys, ...middleColumns.map((c) => c.key)];
    const nfdTotal = entries.reduce((sum, e) => sum + nfdKeys.reduce((s, k) => s + (Number(e[k]) || 0), 0), 0);
    const fdTotal = entries.reduce((sum, e) => sum + fdKeys.reduce((s, k) => s + (Number(e[k]) || 0), 0), 0);
    return Object.fromEntries(entries.map((e) => {
      const nfd = nfdKeys.reduce((s, k) => s + (Number(e[k]) || 0), 0);
      const fd = fdKeys.reduce((s, k) => s + (Number(e[k]) || 0), 0);
      return [e.id, {
        nonFullyDilutedPercentage: nfdTotal > 0 ? nfd / nfdTotal * 100 : null,
        fullyDilutedPercentage: fdTotal > 0 ? fd / fdTotal * 100 : null,
      }];
    }));
  }, [activeDraft, activeColumns, middleColumns]);

  const handleSaveRef = useRef(null);
  const handleCancelRef = useRef(null);
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: () => handleSaveRef.current?.(), cancelFn: () => handleCancelRef.current?.(), isDirty, isSaving, isEditing });
  }, [isDirty, isSaving, isEditing, onSaveStateChange]);

  const updateDraftField = (field, value) => {
    if (!activeSnapshotId) return;
    setDrafts((prev) => ({
      ...prev,
      [activeSnapshotId]: { ...(prev[activeSnapshotId] || {}), [field]: value },
    }));
  };

  const updateEntryField = (entryId, field, value) => {
    if (!activeSnapshotId) return;
    setDrafts((prev) => ({
      ...prev,
      [activeSnapshotId]: {
        ...(prev[activeSnapshotId] || {}),
        entries: (prev[activeSnapshotId]?.entries || []).map((entry) =>
          entry.id === entryId ? { ...entry, [field]: value } : entry
        ),
      },
    }));
  };

  const updateActiveColumns = (newColumns) => {
    if (!activeSnapshotId) return;
    saveColumnConfig(activeSnapshotId, newColumns, middleColumns);
    updateDraftField("columns", newColumns);
  };

  const updateMiddleColumns = (newMiddleColumns) => {
    if (!activeSnapshotId) return;
    saveColumnConfig(activeSnapshotId, activeColumns, newMiddleColumns);
    updateDraftField("middleColumns", newMiddleColumns);
  };

  const allUsedKeys = new Set([...activeColumns.map((c) => c.key), ...middleColumns.map((c) => c.key)]);

  const handleAddColumn = () => {
    const next = COLUMN_POOL.find((c) => !allUsedKeys.has(c.key));
    if (!next) return;
    updateActiveColumns([...activeColumns, { ...next }]);
  };

  const handleDeleteColumn = (key) => {
    updateActiveColumns(activeColumns.filter((c) => c.key !== key));
  };

  const handleRenameColumn = (key, label) => {
    updateActiveColumns(activeColumns.map((c) => (c.key === key ? { ...c, label } : c)));
  };

  const handleAddMiddleColumn = () => {
    const next = COLUMN_POOL.find((c) => !allUsedKeys.has(c.key));
    if (!next) return;
    updateMiddleColumns([...middleColumns, { ...next }]);
  };

  const handleDeleteMiddleColumn = (key) => {
    updateMiddleColumns(middleColumns.filter((c) => c.key !== key));
  };

  const handleRenameMiddleColumn = (key, label) => {
    updateMiddleColumns(middleColumns.map((c) => (c.key === key ? { ...c, label } : c)));
  };

  const handleCreateSnapshot = async ({ name, date }) => {
    try {
      const created = await createSnapshot({ name, snapshotDate: date });
      setActiveSnapshotId(created.id);
      setShowModal(false);
      showToast({ type: "success", title: "Snapshot created", message: `"${created.name}" has been created successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Create failed", message: err.message || "Could not create the cap table snapshot." });
    }
  };

  const handleDuplicate = async () => {
    if (!activeSnapshot || !activeDraft) return;
    try {
      const created = await createSnapshot({
        name: activeDraft.name,
        snapshotDate: activeDraft.snapshotDate,
      });
      saveColumnConfig(created.id, activeColumns, middleColumns);
      for (const entry of activeDraft.entries) {
        if (!String(entry.shareholderName || "").trim()) continue;
        await createEntry(created.id, entry);
      }
      setActiveSnapshotId(created.id);
      showToast({ type: "success", title: "Snapshot duplicated", message: `"${created.name}" created from "${activeDraft.name}".` });
    } catch (err) {
      showToast({ type: "error", title: "Duplicate failed", message: err.message || "Could not duplicate the snapshot." });
    }
  };

  const handleAddRow = () => {
    if (!activeSnapshotId) return;
    const newRow = {
      id: createTempId("entry"),
      shareholderName: "",
      comment: "",
      ...Object.fromEntries(COLUMN_POOL.map((c) => [c.key, ""])),
      nonFullyDilutedPercentage: "",
      fullyDilutedPercentage: "",
    };
    updateDraftField("entries", [...(activeDraft?.entries || []), newRow]);
  };

  const handleRemoveRow = (entryId) => {
    if (!activeSnapshotId) return;
    updateDraftField("entries", (activeDraft?.entries || []).filter((entry) => entry.id !== entryId));
  };

  const handleDeleteSnapshot = async () => {
    if (!activeSnapshot) return;
    if (!window.confirm(`Delete snapshot "${activeSnapshot.name}"?`)) return;
    try {
      await deleteSnapshot(activeSnapshot.id);
      showToast({ type: "success", title: "Snapshot deleted", message: `"${activeSnapshot.name}" has been deleted successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the snapshot." });
    }
  };

  const handleSave = async () => {
    if (!activeSnapshot || !activeDraft) return;
    try {
      const updatedSnapshot = await updateSnapshot(activeSnapshot.id, {
        name: activeDraft.name,
        snapshotDate: activeDraft.snapshotDate,
      });

      const originalEntries = activeSnapshot.entries;
      const draftEntries = activeDraft.entries;
      const originalIds = new Set(originalEntries.map((entry) => entry.id));
      const draftIds = new Set(draftEntries.filter((entry) => !String(entry.id).startsWith("entry-")).map((entry) => entry.id));

      for (const entry of draftEntries) {
        if (!String(entry.shareholderName || "").trim()) continue;
        const pct = entryPcts[entry.id] || {};
        const entryWithPct = {
          ...entry,
          nonFullyDilutedPercentage: pct.nonFullyDilutedPercentage != null ? Number(pct.nonFullyDilutedPercentage.toFixed(4)) : "",
          fullyDilutedPercentage: pct.fullyDilutedPercentage != null ? Number(pct.fullyDilutedPercentage.toFixed(4)) : "",
        };
        if (String(entry.id).startsWith("entry-")) {
          await createEntry(activeSnapshot.id, entryWithPct);
        } else {
          await updateEntry(entry.id, entryWithPct);
        }
      }

      for (const originalId of originalIds) {
        if (!draftIds.has(originalId)) {
          await deleteEntry(originalId);
        }
      }

      setEditingRowIds(new Set());
      setRowSnapshots({});
      setIsEditing(false);
      showToast({ type: "success", title: "Saved", message: `"${updatedSnapshot.name}" has been updated successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Save failed", message: err.message || "Could not save the cap table." });
    }
  };

  const startRowEdit = (entry) => {
    setEditingRowIds((prev) => new Set([...prev, entry.id]));
    setRowSnapshots((prev) => ({ ...prev, [entry.id]: { ...entry } }));
  };

  const confirmRowEdit = (id) => {
    setEditingRowIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setRowSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const cancelRowEdit = (id) => {
    const snapshot = rowSnapshots[id];
    if (snapshot && activeSnapshotId) {
      setDrafts((prev) => ({
        ...prev,
        [activeSnapshotId]: {
          ...prev[activeSnapshotId],
          entries: prev[activeSnapshotId].entries.map((e) => e.id === id ? snapshot : e),
        },
      }));
    }
    setEditingRowIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setRowSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleCancelEdit = () => {
    if (activeSnapshot) {
      setDrafts((prev) => ({
        ...prev,
        [activeSnapshot.id]: createDraftSnapshot(activeSnapshot),
      }));
    }
    setEditingRowIds(new Set());
    setRowSnapshots({});
    setIsEditing(false);
  };

  handleSaveRef.current = handleSave;
  handleCancelRef.current = handleCancelEdit;

  const canAddColumn = allUsedKeys.size < COLUMN_POOL.length;
  const canAddMiddleColumn = allUsedKeys.size < COLUMN_POOL.length;
  const totalColSpan =
    1 + // Shareholder
    activeColumns.length +
    1 + // nfd%
    middleColumns.length +
    (isEditing && canAddMiddleColumn ? 1 : 0) +
    1 + // fd%
    1 + // Comment
    1; // Actions (always visible)

  return (
    <div className="ct-wrapper">
      {showModal && <NewCapModal onClose={() => setShowModal(false)} onNext={handleCreateSnapshot} />}

      <div className="ct-versions-bar">
        <div className="ct-versions">
          {snapshots.map((snapshot) => (
            <button
              key={snapshot.id}
              className={`ct-version-btn${activeSnapshotId === snapshot.id ? " ct-version-btn--active" : ""}`}
              onClick={() => setActiveSnapshotId(snapshot.id)}
            >
              <span className="ct-version-label">{snapshot.name}</span>
              <span className="ct-version-date">{formatTabDate(snapshot.snapshotDateObject || snapshot.snapshotDate)}</span>
            </button>
          ))}
        </div>
        <div className="ct-top-actions">
          {activeSnapshot && !isEditing && (
            <button className="ct-action-btn ct-action-btn--ghost" onClick={() => setIsEditing(true)}>
              <EditLineIcon /> Edit
            </button>
          )}
          {activeSnapshot && isEditing && (
            <>
              <button className="ct-action-btn ct-action-btn--ghost" onClick={handleDuplicate} disabled={isSaving}>
                <DuplicateIcon /> Duplicate
              </button>
              <button className="ct-action-btn ct-action-btn--danger" onClick={handleDeleteSnapshot} disabled={isSaving}>
                <TrashIcon /> Delete
              </button>
            </>
          )}
          <button className="ct-action-btn ct-action-btn--primary" onClick={() => setShowModal(true)} disabled={isSaving}>
            <PlusIcon /> New cap table
          </button>
        </div>
      </div>

      {isLoading && <div className="ct-empty-state">Loading cap table...</div>}

      {!isLoading && snapshots.length === 0 && (
        <div className="ct-empty-state">
          No cap table snapshots yet. Create the first one to start adding rounds and shareholders.
        </div>
      )}

      {!isLoading && activeDraft && (
        <>
          <div className="ct-snapshot-editor">
            <div className="ct-editor-field">
              <label className="ct-editor-label">Snapshot name</label>
              <input
                className="ct-editor-input"
                value={activeDraft.name}
                onChange={(e) => updateDraftField("name", e.target.value)}
                placeholder="Enter snapshot name"
                readOnly={!isEditing}
              />
            </div>
            <div className="ct-editor-field ct-editor-field--date">
              <label className="ct-editor-label">Snapshot date</label>
              <DateInputWithPicker
                initialDate={activeDraft.snapshotDate}
                onDateChange={(date) => updateDraftField("snapshotDate", date)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="ct-table-container">
            <table className="ct-table">
              <thead>
                <tr>
                  <th className="ct-th ct-th--left">Shareholder</th>

                  {activeColumns.map((col) => (
                    <th key={col.key} className="ct-th ct-th--col-editable">
                      <div className="ct-col-header">
                        <input
                          className="ct-col-label-input"
                          value={col.label}
                          onChange={(e) => handleRenameColumn(col.key, e.target.value)}
                          title={isEditing ? "Click to rename" : col.label}
                          readOnly={!isEditing}
                        />
                        {isEditing && (
                          <button
                            className="ct-col-remove-btn"
                            onClick={() => handleDeleteColumn(col.key)}
                            disabled={isSaving}
                            aria-label={`Remove ${col.label}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}

                  <th className="ct-th ct-th--highlight">n.f.d (%)</th>

                  {middleColumns.map((col) => (
                    <th key={col.key} className="ct-th ct-th--col-editable ct-th--highlight">
                      <div className="ct-col-header">
                        <input
                          className="ct-col-label-input"
                          value={col.label}
                          onChange={(e) => handleRenameMiddleColumn(col.key, e.target.value)}
                          title={isEditing ? "Click to rename" : col.label}
                          readOnly={!isEditing}
                        />
                        {isEditing && (
                          <button
                            className="ct-col-remove-btn"
                            onClick={() => handleDeleteMiddleColumn(col.key)}
                            disabled={isSaving}
                            aria-label={`Remove ${col.label}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}

                  {isEditing && canAddMiddleColumn && (
                    <th
                      className="ct-th ct-th--add-col ct-th--highlight"
                      onClick={!isSaving ? handleAddMiddleColumn : undefined}
                      title="Add column between n.f.d and f.d"
                    >
                      <span className="ct-add-col-icon">+</span>
                    </th>
                  )}

                  <th className="ct-th ct-th--highlight">f.d (%)</th>
                  <th className="ct-th ct-th--left">Comment</th>
                  <th className="ct-th"></th>
                </tr>
              </thead>

              <tbody>
                {activeDraft.entries.length === 0 && (
                  <tr className="ct-row">
                    <td className="ct-td ct-td--center" colSpan={totalColSpan}>
                      No shareholder rows yet. Add the first row to start filling this snapshot.
                    </td>
                  </tr>
                )}
                {activeDraft.entries.map((entry) => (
                  <tr key={entry.id} className={`ct-row${editingRowIds.has(entry.id) ? " ct-row--editing" : ""}`}>
                    <td className="ct-td ct-td--name">
                      <input
                        className="ct-cell-input ct-cell-input--text"
                        value={entry.shareholderName}
                        onChange={(e) => updateEntryField(entry.id, "shareholderName", e.target.value)}
                        placeholder="Shareholder name"
                        readOnly={!editingRowIds.has(entry.id) && !isEditing}
                      />
                    </td>
                    {activeColumns.map((column) => (
                      <td key={column.key} className="ct-td ct-td--center">
                        <input
                          className="ct-cell-input"
                          value={entry[column.key]}
                          onChange={(e) => updateEntryField(entry.id, column.key, normalizeNumericInput(e.target.value))}
                          placeholder="-"
                          readOnly={!editingRowIds.has(entry.id) && !isEditing}
                        />
                      </td>
                    ))}
                    <td className="ct-td ct-td--center ct-td--highlight">
                      <span className="ct-pct-display">
                        {entryPcts[entry.id]?.nonFullyDilutedPercentage != null
                          ? `${entryPcts[entry.id].nonFullyDilutedPercentage.toFixed(2)}%`
                          : "-"}
                      </span>
                    </td>

                    {middleColumns.map((column) => (
                      <td key={column.key} className="ct-td ct-td--center ct-td--highlight">
                        <input
                          className="ct-cell-input ct-cell-input--highlight"
                          value={entry[column.key] ?? ""}
                          onChange={(e) => updateEntryField(entry.id, column.key, normalizeNumericInput(e.target.value))}
                          placeholder="-"
                          readOnly={!editingRowIds.has(entry.id) && !isEditing}
                        />
                      </td>
                    ))}
                    {isEditing && canAddMiddleColumn && <td className="ct-td ct-td--add-col-body ct-td--highlight" />}

                    <td className="ct-td ct-td--center ct-td--highlight">
                      <span className="ct-pct-display">
                        {entryPcts[entry.id]?.fullyDilutedPercentage != null
                          ? `${entryPcts[entry.id].fullyDilutedPercentage.toFixed(2)}%`
                          : "-"}
                      </span>
                    </td>
                    <td className="ct-td">
                      <input
                        className="ct-cell-input ct-cell-input--text"
                        value={entry.comment}
                        onChange={(e) => updateEntryField(entry.id, "comment", e.target.value)}
                        placeholder="Comment"
                        readOnly={!editingRowIds.has(entry.id) && !isEditing}
                      />
                    </td>
                    <td className="ct-td ct-td--center">
                      {isEditing ? (
                        <button className="ct-row-delete-btn" onClick={() => handleRemoveRow(entry.id)} disabled={isSaving}>
                          <TrashIcon />
                        </button>
                      ) : editingRowIds.has(entry.id) ? (
                        <div className="ct-row-actions">
                          <button className="ct-row-action-btn ct-row-action-btn--save" onClick={() => confirmRowEdit(entry.id)} title="Confirm" disabled={isSaving}>
                            <DoneIcon />
                          </button>
                          <button className="ct-row-action-btn ct-row-action-btn--cancel" onClick={() => cancelRowEdit(entry.id)} title="Cancel" disabled={isSaving}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="ct-row-actions">
                          <button className="ct-row-action-btn" onClick={() => startRowEdit(entry)} title="Edit row" disabled={isSaving}>
                            <EditLineIcon />
                          </button>
                          <button className="ct-row-action-btn ct-row-action-btn--delete" onClick={() => handleRemoveRow(entry.id)} title="Delete row" disabled={isSaving}>
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {isEditing && (
                  <tr
                    className="ct-row ct-add-row-ghost"
                    onClick={!isSaving ? handleAddRow : undefined}
                    role="button"
                    title="Add row"
                  >
                    <td colSpan={totalColSpan} className="ct-add-row-ghost-cell">
                      <span className="ct-add-row-ghost-inner">
                        <PlusIcon /> Add row
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className="ct-total-row">
                  <td className="ct-td--total-label">Total</td>
                  {activeColumns.map((col) => (
                    <td key={col.key} className="ct-td--total-center">{displayNumber(totals[col.key])}</td>
                  ))}
                  <td className="ct-td--total-center">
                    {(() => {
                      const s = Object.values(entryPcts).reduce((sum, v) => sum + (v.nonFullyDilutedPercentage || 0), 0);
                      return s > 0 ? `${s.toFixed(2)}%` : "-";
                    })()}
                  </td>
                  {middleColumns.map((col) => (
                    <td key={col.key} className="ct-td--total-center">{displayNumber(totals[col.key])}</td>
                  ))}
                  {isEditing && canAddMiddleColumn && <td />}
                  <td className="ct-td--total-center">
                    {(() => {
                      const s = Object.values(entryPcts).reduce((sum, v) => sum + (v.fullyDilutedPercentage || 0), 0);
                      return s > 0 ? `${s.toFixed(2)}%` : "-";
                    })()}
                  </td>
                  <td className="ct-td--total-label">-</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
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
