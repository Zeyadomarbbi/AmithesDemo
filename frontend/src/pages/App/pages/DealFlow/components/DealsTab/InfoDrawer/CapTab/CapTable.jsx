import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useCapTableBackend } from "../../Deals_backend_work";
import NewCapModal from "./components/NewCapModal";
import "./CapTable.css";

const SHARE_COLUMNS = [
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

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDraftSnapshot(snapshot) {
  return {
    id: snapshot.id,
    name: snapshot.name || "",
    snapshotDate: snapshot.snapshotDateObject || null,
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

function buildTotals(entries) {
  const sumKey = (key) =>
    entries.reduce((total, entry) => total + (Number(entry[key]) || 0), 0);

  return {
    seriesA: sumKey("seriesA"),
    seriesB: sumKey("seriesB"),
    common: sumKey("common"),
    preferred: sumKey("preferred"),
    seed: sumKey("seed"),
    esop: sumKey("esop"),
    nonFullyDilutedPercentage: sumKey("nonFullyDilutedPercentage"),
    fullyDilutedPercentage: sumKey("fullyDilutedPercentage"),
  };
}

export default function CapTable({ dealId, onSaveStateChange }) {
  const [showModal, setShowModal] = useState(false);
  const [activeSnapshotId, setActiveSnapshotId] = useState(null);
  const [drafts, setDrafts] = useState({});
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
      showToast({
        type: "error",
        title: "Cap table failed",
        message: error,
      });
    }
  }, [error, showToast]);

  const activeSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === activeSnapshotId) || null,
    [snapshots, activeSnapshotId]
  );
  const activeDraft = activeSnapshotId ? drafts[activeSnapshotId] || null : null;
  const totals = useMemo(() => buildTotals(activeDraft?.entries || []), [activeDraft]);
  const isDirty = activeSnapshot && activeDraft ? snapshotHasChanges(activeSnapshot, activeDraft) : false;

  const handleSaveRef = useRef(null);
  useEffect(() => {
    if (!onSaveStateChange) return;
    onSaveStateChange({ fn: () => handleSaveRef.current?.(), isDirty, isSaving });
  }, [isDirty, isSaving, onSaveStateChange]);

  const updateDraftField = (field, value) => {
    if (!activeSnapshotId) return;
    setDrafts((prev) => ({
      ...prev,
      [activeSnapshotId]: {
        ...(prev[activeSnapshotId] || {}),
        [field]: value,
      },
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

  const handleCreateSnapshot = async ({ name, date }) => {
    try {
      const created = await createSnapshot({ name, snapshotDate: date });
      setActiveSnapshotId(created.id);
      setShowModal(false);
      showToast({
        type: "success",
        title: "Snapshot created",
        message: `"${created.name}" has been created successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Create failed",
        message: err.message || "Could not create the cap table snapshot.",
      });
    }
  };

  const handleAddRow = () => {
    if (!activeSnapshotId) return;
    const newRow = {
      id: createTempId("entry"),
      shareholderName: "",
      comment: "",
      seriesA: "",
      seriesB: "",
      common: "",
      preferred: "",
      seed: "",
      esop: "",
      nonFullyDilutedPercentage: "",
      fullyDilutedPercentage: "",
    };
    updateDraftField("entries", [...(activeDraft?.entries || []), newRow]);
  };

  const handleRemoveRow = (entryId) => {
    if (!activeSnapshotId) return;
    updateDraftField(
      "entries",
      (activeDraft?.entries || []).filter((entry) => entry.id !== entryId)
    );
  };

  const handleDeleteSnapshot = async () => {
    if (!activeSnapshot) return;
    if (!window.confirm(`Delete snapshot "${activeSnapshot.name}"?`)) return;
    try {
      await deleteSnapshot(activeSnapshot.id);
      showToast({
        type: "success",
        title: "Snapshot deleted",
        message: `"${activeSnapshot.name}" has been deleted successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the snapshot.",
      });
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
        if (String(entry.id).startsWith("entry-")) {
          await createEntry(activeSnapshot.id, entry);
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
        message: `"${updatedSnapshot.name}" has been updated successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Save failed",
        message: err.message || "Could not save the cap table.",
      });
    }
  };

  handleSaveRef.current = handleSave;

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
          {activeSnapshot && (
            <button className="ct-delete-snapshot-btn" onClick={handleDeleteSnapshot} disabled={isSaving}>
              <TrashIcon /> Delete snapshot
            </button>
          )}
          <button className="ct-new-btn" onClick={() => setShowModal(true)} disabled={isSaving}>
            <PlusIcon /> New cap table
          </button>
        </div>
      </div>

      {isLoading && <div className="ct-empty-state">Loading cap table...</div>}

      {!isLoading && snapshots.length === 0 && (
        <div className="ct-empty-state">No cap table snapshots yet. Create the first one to start adding rounds and shareholders.</div>
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
              />
            </div>
            <div className="ct-editor-field ct-editor-field--date">
              <label className="ct-editor-label">Snapshot date</label>
              <DateInputWithPicker
                initialDate={activeDraft.snapshotDate}
                onDateChange={(date) => updateDraftField("snapshotDate", date)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="ct-table-header">
            <button className="ct-add-row-btn" onClick={handleAddRow} disabled={isSaving}>
              <PlusIcon /> Add row
            </button>
          </div>

          <div className="ct-table-container">
            <table className="ct-table">
              <thead>
                <tr>
                  <th className="ct-th ct-th--left">Shareholder</th>
                  {SHARE_COLUMNS.map((column) => (
                    <th key={column.key} className="ct-th">{column.label}</th>
                  ))}
                  {PERCENTAGE_COLUMNS.map((column) => (
                    <th key={column.key} className="ct-th ct-th--highlight">{column.label}</th>
                  ))}
                  <th className="ct-th ct-th--left">Comment</th>
                  <th className="ct-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDraft.entries.length === 0 && (
                  <tr className="ct-row">
                    <td className="ct-td ct-td--center" colSpan={SHARE_COLUMNS.length + PERCENTAGE_COLUMNS.length + 3}>
                      No shareholder rows yet. Add the first row to start filling this snapshot.
                    </td>
                  </tr>
                )}
                {activeDraft.entries.map((entry) => (
                  <tr key={entry.id} className="ct-row">
                    <td className="ct-td ct-td--name">
                      <input
                        className="ct-cell-input ct-cell-input--text"
                        value={entry.shareholderName}
                        onChange={(e) => updateEntryField(entry.id, "shareholderName", e.target.value)}
                        placeholder="Shareholder name"
                      />
                    </td>
                    {SHARE_COLUMNS.map((column) => (
                      <td key={column.key} className="ct-td ct-td--center">
                        <input
                          className="ct-cell-input"
                          value={entry[column.key]}
                          onChange={(e) => updateEntryField(entry.id, column.key, normalizeNumericInput(e.target.value))}
                          placeholder="-"
                        />
                      </td>
                    ))}
                    {PERCENTAGE_COLUMNS.map((column) => (
                      <td key={column.key} className="ct-td ct-td--center ct-td--highlight">
                        <input
                          className="ct-cell-input ct-cell-input--highlight"
                          value={entry[column.key]}
                          onChange={(e) => updateEntryField(entry.id, column.key, normalizeNumericInput(e.target.value))}
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td className="ct-td">
                      <input
                        className="ct-cell-input ct-cell-input--text"
                        value={entry.comment}
                        onChange={(e) => updateEntryField(entry.id, "comment", e.target.value)}
                        placeholder="Comment"
                      />
                    </td>
                    <td className="ct-td ct-td--center">
                      <button className="ct-row-delete-btn" onClick={() => handleRemoveRow(entry.id)} disabled={isSaving}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="ct-total-row">
                  <td className="ct-td--total-label">Total</td>
                  {SHARE_COLUMNS.map((column) => (
                    <td key={column.key} className="ct-td--total-center">{displayNumber(totals[column.key])}</td>
                  ))}
                  {PERCENTAGE_COLUMNS.map((column) => (
                    <td key={column.key} className="ct-td--total-center">{displayNumber(totals[column.key], 4)}</td>
                  ))}
                  <td className="ct-td--total-label">-</td>
                  <td className="ct-td--total-center">-</td>
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
