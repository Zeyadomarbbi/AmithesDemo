import React, { useEffect, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useBoardBackend } from "../../Deals_backend_work";
import NewBoardModal from "./components/NewBoardModal";
import "./OtherTab.css";

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDraftSnapshot(snapshot) {
  return {
    id: snapshot.id,
    name: snapshot.name || "",
    snapshotDate: snapshot.snapshotDateObject || null,
    members: snapshot.members.map((member) => ({
      ...member,
      numberOfSeats: member.numberOfSeats ?? "",
    })),
  };
}

function formatTabDate(date) {
  if (!date) return "";
  const source = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(source.getTime())) return "";
  return `${String(source.getDate()).padStart(2, "0")}/${String(source.getMonth() + 1).padStart(2, "0")}/${source.getFullYear()}`;
}

function normalizeIntegerInput(value) {
  return String(value ?? "").replace(/[^\d-]/g, "");
}

function snapshotHasChanges(snapshot, draft) {
  if (!snapshot || !draft) return false;
  const originalDate = snapshot.snapshotDate || "";
  const draftDate = draft.snapshotDate instanceof Date && !Number.isNaN(draft.snapshotDate.getTime())
    ? draft.snapshotDate.toISOString().slice(0, 10)
    : "";

  const originalMembers = JSON.stringify(snapshot.members.map((member) => ({
    id: member.id,
    name: member.name || "",
    numberOfSeats: member.numberOfSeats ?? "",
    dateIn: member.dateIn || "",
    dateOut: member.dateOut || "",
  })));
  const draftMembers = JSON.stringify(draft.members.map((member) => ({
    id: member.id,
    name: member.name || "",
    numberOfSeats: member.numberOfSeats ?? "",
    dateIn: member.dateIn instanceof Date ? member.dateIn.toISOString().slice(0, 10) : member.dateIn || "",
    dateOut: member.dateOut instanceof Date ? member.dateOut.toISOString().slice(0, 10) : member.dateOut || "",
  })));

  return (
    String(snapshot.name || "") !== String(draft.name || "") ||
    String(originalDate) !== String(draftDate) ||
    originalMembers !== draftMembers
  );
}

export default function OtherTab({ dealId }) {
  const [activeSnapshotId, setActiveSnapshotId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const {
    snapshots,
    isLoading,
    isSaving,
    error,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    createMember,
    updateMember,
    deleteMember,
  } = useBoardBackend(dealId);

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
        title: "Board failed",
        message: error,
      });
    }
  }, [error, showToast]);

  const activeSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === activeSnapshotId) || null,
    [snapshots, activeSnapshotId]
  );
  const activeDraft = activeSnapshotId ? drafts[activeSnapshotId] || null : null;
  const isDirty = activeSnapshot && activeDraft ? snapshotHasChanges(activeSnapshot, activeDraft) : false;

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

  const updateMemberField = (memberId, field, value) => {
    if (!activeSnapshotId) return;
    setDrafts((prev) => ({
      ...prev,
      [activeSnapshotId]: {
        ...(prev[activeSnapshotId] || {}),
        members: (prev[activeSnapshotId]?.members || []).map((member) =>
          member.id === memberId ? { ...member, [field]: value } : member
        ),
      },
    }));
  };

  const handleCreateSnapshot = async ({ name, date }) => {
    try {
      const created = await createSnapshot({ name, snapshotDate: date });
      setShowModal(false);
      setActiveSnapshotId(created.id);
      showToast({
        type: "success",
        title: "Snapshot created",
        message: `"${created.name}" has been created successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Create failed",
        message: err.message || "Could not create the board snapshot.",
      });
    }
  };

  const handleDeleteSnapshot = async () => {
    if (!activeSnapshot) return;
    if (!window.confirm(`Delete board snapshot "${activeSnapshot.name}"?`)) return;
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
        message: err.message || "Could not delete the board snapshot.",
      });
    }
  };

  const handleAddMember = () => {
    if (!activeSnapshotId) return;
    const newMember = {
      id: createTempId("board"),
      name: "",
      numberOfSeats: "",
      dateIn: null,
      dateOut: null,
    };
    updateDraftField("members", [...(activeDraft?.members || []), newMember]);
  };

  const handleRemoveMember = (memberId) => {
    updateDraftField(
      "members",
      (activeDraft?.members || []).filter((member) => member.id !== memberId)
    );
  };

  const handleSave = async () => {
    if (!activeSnapshot || !activeDraft) return;
    try {
      await updateSnapshot(activeSnapshot.id, activeDraft);

      const originalMembers = activeSnapshot.members;
      const draftMembers = activeDraft.members;
      const originalIds = new Set(originalMembers.map((member) => member.id));
      const draftIds = new Set(draftMembers.filter((member) => !String(member.id).startsWith("board-")).map((member) => member.id));

      for (const member of draftMembers) {
        if (!String(member.name || "").trim()) continue;
        if (String(member.id).startsWith("board-")) {
          await createMember(activeSnapshot.id, member);
        } else {
          await updateMember(member.id, member);
        }
      }

      for (const originalId of originalIds) {
        if (!draftIds.has(originalId)) {
          await deleteMember(originalId);
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
        message: err.message || "Could not save board changes.",
      });
    }
  };

  return (
    <div className="ot-wrapper">
      {showModal && <NewBoardModal onClose={() => setShowModal(false)} onNext={handleCreateSnapshot} />}

      <div className="ot-versions-bar">
        <div className="ot-versions">
          {snapshots.map((snapshot) => (
            <button
              key={snapshot.id}
              className={`ot-version-btn${activeSnapshotId === snapshot.id ? " ot-version-btn--active" : ""}`}
              onClick={() => setActiveSnapshotId(snapshot.id)}
            >
              <span className="ot-version-label">{snapshot.name}</span>
              <span className="ot-version-date">{formatTabDate(snapshot.snapshotDateObject || snapshot.snapshotDate)}</span>
            </button>
          ))}
        </div>
        <div className="ot-actions">
          {activeSnapshot && (
            <button className="ot-delete-btn" onClick={handleDeleteSnapshot} disabled={isSaving}>
              <TrashIcon /> Delete snapshot
            </button>
          )}
          <button className="ot-add-btn" onClick={() => setShowModal(true)} disabled={isSaving}>
            <PlusIcon /> Add
          </button>
        </div>
      </div>

      {isLoading && <div className="ot-empty-state">Loading board snapshots...</div>}

      {!isLoading && snapshots.length === 0 && (
        <div className="ot-empty-state">No board snapshots yet. Create the first board snapshot to start adding members.</div>
      )}

      {!isLoading && activeDraft && (
        <>
          <div className="ot-editor">
            <div className="ot-editor-field">
              <label className="ot-editor-label">Snapshot name</label>
              <input
                className="ot-editor-input"
                value={activeDraft.name}
                onChange={(e) => updateDraftField("name", e.target.value)}
                placeholder="Enter snapshot name"
              />
            </div>
            <div className="ot-editor-field">
              <label className="ot-editor-label">Snapshot date</label>
              <DateInputWithPicker
                initialDate={activeDraft.snapshotDate}
                onDateChange={(date) => updateDraftField("snapshotDate", date)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
            <div className="ot-editor-actions">
              <button className="ot-add-row-btn" onClick={handleAddMember} disabled={isSaving}>
                <PlusIcon /> Add member
              </button>
              <button className="ot-save-btn" onClick={handleSave} disabled={isSaving || !isDirty}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="ot-table-container">
            <table className="ot-table">
              <thead>
                <tr>
                  <th className="ot-th ot-th--left">Name</th>
                  <th className="ot-th"># of seats</th>
                  <th className="ot-th">Date In</th>
                  <th className="ot-th">Date Out</th>
                  <th className="ot-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDraft.members.length === 0 && (
                  <tr className="ot-row">
                    <td className="ot-td ot-td--center" colSpan={5}>No board members yet. Add the first member to this snapshot.</td>
                  </tr>
                )}
                {activeDraft.members.map((member) => (
                  <tr key={member.id} className="ot-row">
                    <td className="ot-td ot-td--left">
                      <input
                        className="ot-cell-input ot-cell-input--text"
                        value={member.name}
                        onChange={(e) => updateMemberField(member.id, "name", e.target.value)}
                        placeholder="Member name"
                      />
                    </td>
                    <td className="ot-td ot-td--center">
                      <input
                        className="ot-cell-input"
                        value={member.numberOfSeats}
                        onChange={(e) => updateMemberField(member.id, "numberOfSeats", normalizeIntegerInput(e.target.value))}
                        placeholder="-"
                      />
                    </td>
                    <td className="ot-td ot-td--center">
                      <DateInputWithPicker
                        initialDate={member.dateInObject || member.dateIn}
                        onDateChange={(date) => updateMemberField(member.id, "dateIn", date)}
                        isSingle={true}
                        dateFormat="DD/MM/YYYY"
                      />
                    </td>
                    <td className="ot-td ot-td--center">
                      <DateInputWithPicker
                        initialDate={member.dateOutObject || member.dateOut}
                        onDateChange={(date) => updateMemberField(member.id, "dateOut", date)}
                        isSingle={true}
                        dateFormat="DD/MM/YYYY"
                      />
                    </td>
                    <td className="ot-td ot-td--center">
                      <button className="ot-row-delete-btn" onClick={() => handleRemoveMember(member.id)} disabled={isSaving}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="ot-total-row">
                  <td colSpan={5} />
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
