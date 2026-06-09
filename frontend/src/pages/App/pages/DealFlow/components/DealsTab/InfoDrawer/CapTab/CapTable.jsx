import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon, DuplicateIcon, EditLineIcon, DoneIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useCapTableBackend } from "../../Deals_backend_work";
import NewCapModal from "./components/NewCapModal";
import AddColumnModal from "./components/AddColumnModal";
import ConfirmActionModal from "./components/ConfirmActionModal";
import "./CapTable.css";

const LEFT_SYSTEM_CODES = new Set(["SERIES_A", "SERIES_B", "COMMON", "PREFERRED", "SEED", "ESOP"]);
const SPECIAL_CODES = {
  nfd: "NFD_PERCENTAGE",
  fd: "FD_PERCENTAGE",
  comment: "COMMENT",
};

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeNumericInput(value) {
  return String(value ?? "").replace(/[^\d.,-]/g, "");
}

function normalizeTextInput(value) {
  return String(value ?? "");
}

function parseNumber(value) {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
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

function sortColumns(columns) {
  return [...(Array.isArray(columns) ? columns : [])].sort((a, b) => {
    const orderA = a?.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b?.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
}

function cloneEntryValues(values) {
  const next = {};
  Object.entries(values || {}).forEach(([columnId, value]) => {
    next[columnId] = {
      valueText: value?.valueText ?? "",
      valueNumber: value?.valueNumber ?? null,
    };
  });
  return next;
}

function createDraftSnapshot(snapshot) {
  return {
    id: snapshot.id,
    name: snapshot.name || "",
    snapshotDate: snapshot.snapshotDateObject || (snapshot.snapshotDate ? new Date(snapshot.snapshotDate) : null),
    columns: sortColumns(snapshot.columns).map((column) => ({ ...column })),
    entries: (snapshot.entries || []).map((entry) => ({
      ...entry,
      comment: entry.comment || "",
      values: cloneEntryValues(entry.values),
    })),
  };
}

function splitSnapshotColumns(columns) {
  const sorted = sortColumns(columns);
  const leftColumns = [];
  const middleColumns = [];
  let nfdColumn = null;
  let fdColumn = null;
  let commentColumn = null;

  sorted.forEach((column) => {
    const code = String(column?.code || "").trim().toUpperCase();
    if (code === SPECIAL_CODES.nfd) {
      nfdColumn = column;
      return;
    }
    if (code === SPECIAL_CODES.fd) {
      fdColumn = column;
      return;
    }
    if (code === SPECIAL_CODES.comment) {
      commentColumn = column;
      return;
    }
    if (LEFT_SYSTEM_CODES.has(code) || column?.isSystem) {
      leftColumns.push(column);
      return;
    }
    middleColumns.push(column);
  });

  return { leftColumns, middleColumns, nfdColumn, fdColumn, commentColumn };
}

function getEntryCellValue(entry, column) {
  const current = entry?.values?.[column?.id] || {};
  if (column?.columnType === "TEXT") return current.valueText ?? "";
  if (current.valueNumber === null || current.valueNumber === undefined) return current.valueText ?? "";
  return String(current.valueNumber);
}

function getEntryNumericValue(entry, column) {
  if (!entry || !column) return null;
  const current = entry?.values?.[column.id] || {};
  if (current.valueNumber !== null && current.valueNumber !== undefined) return Number(current.valueNumber);
  return parseNumber(current.valueText);
}

function withUpdatedEntryValue(entry, column, rawValue) {
  const values = cloneEntryValues(entry?.values);
  values[column.id] =
    column.columnType === "TEXT"
      ? { valueText: normalizeTextInput(rawValue), valueNumber: null }
      : { valueText: "", valueNumber: parseNumber(rawValue) };
  return { ...entry, values };
}

function serializeDraftForCompare(snapshot) {
  if (!snapshot) return "";
  return JSON.stringify({
    name: String(snapshot.name || ""),
    snapshotDate:
      snapshot.snapshotDate instanceof Date && !Number.isNaN(snapshot.snapshotDate.getTime())
        ? snapshot.snapshotDate.toISOString().slice(0, 10)
        : "",
    columns: sortColumns(snapshot.columns).map((column) => ({
      id: column.id,
      name: String(column.name || ""),
      code: String(column.code || ""),
      columnType: String(column.columnType || ""),
      isPercentage: Boolean(column.isPercentage),
      displayOrder: column.displayOrder ?? null,
    })),
    entries: (snapshot.entries || []).map((entry) => ({
      id: entry.id,
      shareholderName: String(entry.shareholderName || ""),
      comment: String(entry.comment || ""),
      values: Object.fromEntries(
        sortColumns(snapshot.columns).map((column) => [
          column.id,
          {
            valueText: String(entry?.values?.[column.id]?.valueText ?? ""),
            valueNumber: entry?.values?.[column.id]?.valueNumber ?? null,
          },
        ])
      ),
    })),
  });
}

function snapshotHasChanges(snapshot, draft) {
  if (!snapshot || !draft) return false;
  return serializeDraftForCompare(createDraftSnapshot(snapshot)) !== serializeDraftForCompare(draft);
}

function createEmptyEntry(columns) {
  const values = {};
  sortColumns(columns).forEach((column) => {
    values[column.id] =
      column.columnType === "TEXT"
        ? { valueText: "", valueNumber: null }
        : { valueText: "", valueNumber: null };
  });

  return {
    id: createTempId("entry"),
    shareholderName: "",
    comment: "",
    values,
  };
}

function computeEntryPercentages(entries, leftColumns, middleColumns) {
  const nfdColumns = leftColumns.filter((column) => column.columnType === "NUMBER");
  const fdColumns = [...leftColumns, ...middleColumns].filter((column) => column.columnType === "NUMBER");

  const nfdTotal = entries.reduce(
    (sum, entry) => sum + nfdColumns.reduce((inner, column) => inner + (getEntryNumericValue(entry, column) || 0), 0),
    0
  );
  const fdTotal = entries.reduce(
    (sum, entry) => sum + fdColumns.reduce((inner, column) => inner + (getEntryNumericValue(entry, column) || 0), 0),
    0
  );

  return Object.fromEntries(
    entries.map((entry) => {
      const nfdValue = nfdColumns.reduce((sum, column) => sum + (getEntryNumericValue(entry, column) || 0), 0);
      const fdValue = fdColumns.reduce((sum, column) => sum + (getEntryNumericValue(entry, column) || 0), 0);
      return [
        entry.id,
        {
          nonFullyDilutedPercentage: nfdTotal > 0 ? (nfdValue / nfdTotal) * 100 : null,
          fullyDilutedPercentage: fdTotal > 0 ? (fdValue / fdTotal) * 100 : null,
        },
      ];
    })
  );
}

function buildColumnTotal(entries, column) {
  if (!column || column.columnType !== "NUMBER") return null;
  const values = entries.map((entry) => getEntryNumericValue(entry, column)).filter((value) => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function roundPercentage(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Number(Number(value).toFixed(4));
}

function buildEntryPayload(entry, columns, percentagesByEntry) {
  const values = {};
  const percentages = percentagesByEntry?.[entry.id] || {};

  sortColumns(columns).forEach((column) => {
    const code = String(column?.code || "").trim().toUpperCase();
    if (code === SPECIAL_CODES.nfd) {
      values[column.id] = roundPercentage(percentages.nonFullyDilutedPercentage);
      return;
    }
    if (code === SPECIAL_CODES.fd) {
      values[column.id] = roundPercentage(percentages.fullyDilutedPercentage);
      return;
    }
    if (code === SPECIAL_CODES.comment) {
      values[column.id] = entry.comment || "";
      return;
    }
    if (column.columnType === "TEXT") {
      values[column.id] = entry?.values?.[column.id]?.valueText ?? "";
      return;
    }
    values[column.id] = entry?.values?.[column.id]?.valueNumber ?? null;
  });

  return {
    shareholderName: String(entry.shareholderName || "").trim(),
    comment: String(entry.comment || "").trim(),
    values,
  };
}

export default function CapTable({ dealId, onSaveStateChange }) {
  const [showModal, setShowModal] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
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
    loadCapTable,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    duplicateSnapshot,
    createColumn,
    updateColumn,
    deleteColumn,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useCapTableBackend(dealId);

  useEffect(() => {
    setDrafts((prev) => {
      const next = {};
      snapshots.forEach((snapshot) => {
        next[snapshot.id] = prev[snapshot.id] || createDraftSnapshot(snapshot);
      });
      return next;
    });

    if (snapshots.length > 0) {
      setActiveSnapshotId((prev) => (prev && snapshots.some((snapshot) => snapshot.id === prev) ? prev : snapshots[0].id));
      return;
    }

    setActiveSnapshotId(null);
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
  const { leftColumns, middleColumns } = useMemo(
    () => splitSnapshotColumns(activeDraft?.columns || activeSnapshot?.columns || []),
    [activeDraft, activeSnapshot]
  );
  const entryPercentages = useMemo(
    () => computeEntryPercentages(activeDraft?.entries || [], leftColumns, middleColumns),
    [activeDraft, leftColumns, middleColumns]
  );
  const isDirty = activeSnapshot && activeDraft ? snapshotHasChanges(activeSnapshot, activeDraft) : false;

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

  const updateDraftColumns = (updater) => {
    if (!activeSnapshotId) return;
    setDrafts((prev) => {
      const current = prev[activeSnapshotId] || { columns: [] };
      const nextColumns = typeof updater === "function" ? updater(current.columns || []) : updater;
      return {
        ...prev,
        [activeSnapshotId]: {
          ...current,
          columns: sortColumns(nextColumns),
        },
      };
    });
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

  const updateEntryColumnValue = (entryId, column, value) => {
    if (!activeSnapshotId) return;
    setDrafts((prev) => ({
      ...prev,
      [activeSnapshotId]: {
        ...(prev[activeSnapshotId] || {}),
        entries: (prev[activeSnapshotId]?.entries || []).map((entry) =>
          entry.id === entryId ? withUpdatedEntryValue(entry, column, value) : entry
        ),
      },
    }));
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
    if (!activeDraft || !activeSnapshot) return;
    try {
      const duplicated = await duplicateSnapshot(activeSnapshot.id, {
        name: `${activeDraft.name || activeSnapshot.name || "Cap table"} copy`,
        snapshotDate: activeDraft.snapshotDate,
      });
      setActiveSnapshotId(duplicated.id);
      showToast({ type: "success", title: "Snapshot duplicated", message: `"${duplicated.name}" has been created successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Duplicate failed", message: err.message || "Could not duplicate the snapshot." });
    }
  };

  const handleAddColumn = async ({ name, columnType }) => {
    if (!activeSnapshotId || !activeDraft) return;
    const normalizedName = String(name || "").trim();
    const normalizedType = String(columnType || "NUMBER").trim().toUpperCase();
    if (!normalizedName) return;
    if (!["TEXT", "NUMBER", "PERCENTAGE"].includes(normalizedType)) {
      showToast({ type: "error", title: "Invalid type", message: "Column type must be TEXT, NUMBER, or PERCENTAGE." });
      return;
    }

    try {
      const created = await createColumn(activeSnapshotId, {
        name: normalizedName,
        columnType: normalizedType,
        isPercentage: normalizedType === "PERCENTAGE",
        displayOrder: (activeDraft.columns || []).reduce((max, column) => Math.max(max, Number(column?.displayOrder) || 0), 0) + 1,
      });
      setDrafts((prev) => {
        const current = prev[activeSnapshotId] || activeDraft;
        const nextColumns = sortColumns([...(current?.columns || []), created]);
        return {
          ...prev,
          [activeSnapshotId]: {
            ...current,
            columns: nextColumns,
            entries: (current?.entries || []).map((entry) => ({
              ...entry,
              values: {
                ...(entry.values || {}),
                [created.id]: created.columnType === "TEXT"
                  ? { valueText: "", valueNumber: null }
                  : { valueText: "", valueNumber: null },
              },
            })),
          },
        };
      });
      setShowAddColumnModal(false);
      showToast({ type: "success", title: "Column added", message: `"${created.name}" has been added.` });
    } catch (err) {
      showToast({ type: "error", title: "Add failed", message: err.message || "Could not add the column." });
    }
  };

  const handleDeleteColumn = async (column) => {
    if (!activeSnapshotId || !column) return;
    if (column.isSystem) {
      showToast({ type: "error", title: "Delete failed", message: "System columns cannot be deleted." });
      return;
    }

    try {
      await deleteColumn(activeSnapshotId, column.id);
      setDrafts((prev) => {
        const current = prev[activeSnapshotId];
        if (!current) return prev;
        return {
          ...prev,
          [activeSnapshotId]: {
            ...current,
            columns: current.columns.filter((item) => item.id !== column.id),
            entries: current.entries.map((entry) => {
              const nextValues = cloneEntryValues(entry.values);
              delete nextValues[column.id];
              return { ...entry, values: nextValues };
            }),
          },
        };
      });
      setPendingDelete(null);
      showToast({ type: "success", title: "Column deleted", message: `"${column.name}" has been deleted.` });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the column." });
    }
  };

  const handleRenameColumn = (columnId, name) => {
    updateDraftColumns((columns) =>
      columns.map((column) => (column.id === columnId ? { ...column, name } : column))
    );
  };

  const handleAddRow = () => {
    if (!activeDraft) return;
    updateDraftField("entries", [...(activeDraft.entries || []), createEmptyEntry(activeDraft.columns || [])]);
  };

  const handleRemoveRow = (entryId) => {
    if (!activeDraft) return;
    updateDraftField("entries", (activeDraft.entries || []).filter((entry) => entry.id !== entryId));
  };

  const handleDeleteSnapshot = async () => {
    if (!activeSnapshot) return;
    try {
      await deleteSnapshot(activeSnapshot.id);
      setPendingDelete(null);
      showToast({ type: "success", title: "Snapshot deleted", message: `"${activeSnapshot.name}" has been deleted successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the snapshot." });
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === "column") {
      await handleDeleteColumn(pendingDelete.column);
      return;
    }
    if (pendingDelete.type === "snapshot") {
      await handleDeleteSnapshot();
    }
  };

  const handleSave = async () => {
    if (!activeSnapshot || !activeDraft) return;
    try {
      const originalColumns = sortColumns(activeSnapshot.columns || []);
      const draftColumns = sortColumns(activeDraft.columns || []);
      const originalColumnById = new Map(originalColumns.map((column) => [column.id, column]));

      await updateSnapshot(activeSnapshot.id, {
        name: activeDraft.name,
        snapshotDate: activeDraft.snapshotDate,
      });

      for (const column of draftColumns) {
        const original = originalColumnById.get(column.id);
        if (!original || original.isSystem) continue;
        const changed =
          String(original.name || "") !== String(column.name || "") ||
          String(original.code || "") !== String(column.code || "") ||
          String(original.columnType || "") !== String(column.columnType || "") ||
          Boolean(original.isPercentage) !== Boolean(column.isPercentage) ||
          Number(original.displayOrder ?? -1) !== Number(column.displayOrder ?? -1);
        if (!changed) continue;
        await updateColumn(activeSnapshot.id, column.id, {
          name: column.name,
          code: column.code,
          columnType: column.columnType,
          isPercentage: column.isPercentage,
          displayOrder: column.displayOrder,
        });
      }

      const originalEntries = activeSnapshot.entries || [];
      const draftEntries = activeDraft.entries || [];
      const originalIds = new Set(originalEntries.map((entry) => entry.id));
      const keptExistingIds = new Set();

      for (const entry of draftEntries) {
        const payload = buildEntryPayload(entry, draftColumns, entryPercentages);
        if (!payload.shareholderName) continue;
        if (String(entry.id).startsWith("entry-")) {
          await createEntry(activeSnapshot.id, payload);
          continue;
        }
        keptExistingIds.add(entry.id);
        await updateEntry(activeSnapshot.id, entry.id, payload);
      }

      for (const originalId of originalIds) {
        if (!keptExistingIds.has(originalId) && draftEntries.every((entry) => entry.id !== originalId)) {
          await deleteEntry(activeSnapshot.id, originalId);
        }
      }

      const reloadedSnapshots = await loadCapTable();
      setDrafts((prev) => {
        const next = { ...prev };
        reloadedSnapshots.forEach((snapshot) => {
          next[snapshot.id] = createDraftSnapshot(snapshot);
        });
        return next;
      });
      setEditingRowIds(new Set());
      setRowSnapshots({});
      setIsEditing(false);
      showToast({ type: "success", title: "Saved", message: `"${activeDraft.name || activeSnapshot.name}" has been updated successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Save failed", message: err.message || "Could not save the cap table." });
    }
  };

  const startRowEdit = (entry) => {
    setEditingRowIds((prev) => new Set([...prev, entry.id]));
    setRowSnapshots((prev) => ({ ...prev, [entry.id]: { ...entry, values: cloneEntryValues(entry.values) } }));
  };

  const confirmRowEdit = (id) => {
    setEditingRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setRowSnapshots((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const cancelRowEdit = (id) => {
    const snapshot = rowSnapshots[id];
    if (snapshot && activeSnapshotId) {
      setDrafts((prev) => ({
        ...prev,
        [activeSnapshotId]: {
          ...prev[activeSnapshotId],
          entries: prev[activeSnapshotId].entries.map((entry) => (entry.id === id ? snapshot : entry)),
        },
      }));
    }
    confirmRowEdit(id);
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

  const totalColSpan =
    1 +
    leftColumns.length +
    1 +
    middleColumns.length +
    (isEditing ? 1 : 0) +
    1 +
    1 +
    1;

  return (
    <div className="ct-wrapper">
      {showModal && <NewCapModal onClose={() => setShowModal(false)} onNext={handleCreateSnapshot} />}
      {showAddColumnModal && <AddColumnModal onClose={() => setShowAddColumnModal(false)} onCreate={handleAddColumn} />}
      {pendingDelete && (
        <ConfirmActionModal
          title={pendingDelete.type === "snapshot" ? "Delete cap table" : "Delete column"}
          message={
            pendingDelete.type === "snapshot"
              ? `Delete "${pendingDelete.name}"? This will remove the whole cap table snapshot.`
              : `Delete "${pendingDelete.name}"? This will remove the column and its saved values.`
          }
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

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
              <button
                className="ct-action-btn ct-action-btn--danger"
                onClick={() => setPendingDelete({ type: "snapshot", name: activeSnapshot.name })}
                disabled={isSaving}
              >
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

                  {leftColumns.map((column) => (
                    <th key={column.id} className="ct-th ct-th--col-editable">
                      <div className="ct-col-header">
                        <input
                          className="ct-col-label-input"
                          value={column.name}
                          onChange={(e) => handleRenameColumn(column.id, e.target.value)}
                          title={column.name}
                          readOnly={!isEditing || column.isSystem}
                        />
                        {isEditing && !column.isSystem && (
                          <button
                            className="ct-col-remove-btn"
                            onClick={() => setPendingDelete({ type: "column", name: column.name, column })}
                            disabled={isSaving}
                            aria-label={`Remove ${column.name}`}
                          >
                            x
                          </button>
                        )}
                      </div>
                    </th>
                  ))}

                  <th className="ct-th ct-th--highlight">n.f.d (%)</th>

                  {middleColumns.map((column) => (
                    <th key={column.id} className="ct-th ct-th--col-editable ct-th--highlight">
                      <div className="ct-col-header">
                        <input
                          className="ct-col-label-input"
                          value={column.name}
                          onChange={(e) => handleRenameColumn(column.id, e.target.value)}
                          title={column.name}
                          readOnly={!isEditing || column.isSystem}
                        />
                        {isEditing && !column.isSystem && (
                          <button
                            className="ct-col-remove-btn"
                            onClick={() => handleDeleteColumn(column)}
                            disabled={isSaving}
                            aria-label={`Remove ${column.name}`}
                          >
                            x
                          </button>
                        )}
                      </div>
                    </th>
                  ))}

                  {isEditing && (
                    <th
                      className="ct-th ct-th--add-col ct-th--highlight"
                      onClick={!isSaving ? () => setShowAddColumnModal(true) : undefined}
                      title="Add column"
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
                {(activeDraft.entries || []).length === 0 && (
                  <tr className="ct-row">
                    <td className="ct-td ct-td--center" colSpan={totalColSpan}>
                      No shareholder rows yet. Add the first row to start filling this snapshot.
                    </td>
                  </tr>
                )}

                {(activeDraft.entries || []).map((entry) => {
                  const canEditRow = isEditing || editingRowIds.has(entry.id);
                  return (
                    <tr key={entry.id} className={`ct-row${editingRowIds.has(entry.id) ? " ct-row--editing" : ""}`}>
                      <td className="ct-td ct-td--name">
                        <input
                          className="ct-cell-input ct-cell-input--text"
                          value={entry.shareholderName}
                          onChange={(e) => updateEntryField(entry.id, "shareholderName", e.target.value)}
                          placeholder="Shareholder name"
                          readOnly={!canEditRow}
                        />
                      </td>

                      {leftColumns.map((column) => (
                        <td key={column.id} className="ct-td ct-td--center">
                          <input
                            className="ct-cell-input"
                            value={getEntryCellValue(entry, column)}
                            onChange={(e) =>
                              updateEntryColumnValue(
                                entry.id,
                                column,
                                column.columnType === "TEXT" ? e.target.value : normalizeNumericInput(e.target.value)
                              )
                            }
                            placeholder="-"
                            readOnly={!canEditRow}
                          />
                        </td>
                      ))}

                      <td className="ct-td ct-td--center ct-td--highlight">
                        <span className="ct-pct-display">
                          {entryPercentages[entry.id]?.nonFullyDilutedPercentage != null
                            ? `${entryPercentages[entry.id].nonFullyDilutedPercentage.toFixed(2)}%`
                            : "-"}
                        </span>
                      </td>

                      {middleColumns.map((column) => (
                        <td key={column.id} className="ct-td ct-td--center ct-td--highlight">
                          <input
                            className="ct-cell-input ct-cell-input--highlight"
                            value={getEntryCellValue(entry, column)}
                            onChange={(e) =>
                              updateEntryColumnValue(
                                entry.id,
                                column,
                                column.columnType === "TEXT" ? e.target.value : normalizeNumericInput(e.target.value)
                              )
                            }
                            placeholder="-"
                            readOnly={!canEditRow}
                          />
                        </td>
                      ))}

                      {isEditing && <td className="ct-td ct-td--add-col-body ct-td--highlight" />}

                      <td className="ct-td ct-td--center ct-td--highlight">
                        <span className="ct-pct-display">
                          {entryPercentages[entry.id]?.fullyDilutedPercentage != null
                            ? `${entryPercentages[entry.id].fullyDilutedPercentage.toFixed(2)}%`
                            : "-"}
                        </span>
                      </td>

                      <td className="ct-td">
                        <input
                          className="ct-cell-input ct-cell-input--text"
                          value={entry.comment}
                          onChange={(e) => updateEntryField(entry.id, "comment", e.target.value)}
                          placeholder="Comment"
                          readOnly={!canEditRow}
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
                              x
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
                  );
                })}

                {isEditing && (
                  <tr className="ct-row ct-add-row-ghost" onClick={!isSaving ? handleAddRow : undefined} role="button" title="Add row">
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
                  {leftColumns.map((column) => (
                    <td key={column.id} className="ct-td--total-center">
                      {column.columnType === "TEXT" ? "-" : displayNumber(buildColumnTotal(activeDraft.entries || [], column))}
                    </td>
                  ))}
                  <td className="ct-td--total-center">
                    {Object.keys(entryPercentages).length > 0 ? "100.00%" : "-"}
                  </td>
                  {middleColumns.map((column) => (
                    <td key={column.id} className="ct-td--total-center">
                      {column.columnType === "TEXT" || column.columnType === "PERCENTAGE" ? "-" : displayNumber(buildColumnTotal(activeDraft.entries || [], column))}
                    </td>
                  ))}
                  {isEditing && <td />}
                  <td className="ct-td--total-center">
                    {Object.keys(entryPercentages).length > 0 ? "100.00%" : "-"}
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
