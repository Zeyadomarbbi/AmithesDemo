import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import SearchBar from "/src/components/SearchBar/SearchBar";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import { PlusIcon, FileDownloadIcon, TrashIcon, EditLineIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useDealEventsBackend } from "../../Deals_backend_work";
import NewEventModal from "./components/NewEventModal";
import "./EventsTab.css";

function AutoResizeTextarea({ value, onChange, className, placeholder, readOnly }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} className={className} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />;
}

function createDraftMap(events) {
  return Object.fromEntries(
    events.map((event) => [
      event.id,
      {
        title: event.title || "",
        description: event.description || "",
        eventDate: event.eventDateObject || null,
        eventTypeId: event.eventTypeId || null,
        stageId: event.stageId || null,
      },
    ])
  );
}

function hasDraftChanges(event, draft) {
  if (!event || !draft) return false;
  const originalDate = event.eventDate || "";
  const draftDate = draft.eventDate instanceof Date && !Number.isNaN(draft.eventDate.getTime())
    ? draft.eventDate.toISOString().slice(0, 10)
    : "";

  return (
    String(event.title || "") !== String(draft.title || "") ||
    String(event.description || "") !== String(draft.description || "") ||
    String(event.eventTypeId || "") !== String(draft.eventTypeId || "") ||
    String(event.stageId || "") !== String(draft.stageId || "") ||
    String(originalDate) !== String(draftDate)
  );
}

function formatMetaDateTime(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-US");
}

function formatMetaDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US");
}

export default function EventsTab({ dealId, onSaved }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [editingIds, setEditingIds] = useState(new Set());
  const { toast, showToast, closeToast } = useToast();

  const {
    events,
    eventTypes,
    stages,
    isLoading,
    isSaving,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useDealEventsBackend(dealId);

  useEffect(() => {
    setDrafts(createDraftMap(events));
  }, [events]);

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        title: "Events failed",
        message: error,
      });
    }
  }, [error, showToast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) =>
      [event.title, event.description, event.eventTypeName, event.stageName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [events, search]);

  const updateDraft = (eventId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {}),
        [field]: value,
      },
    }));
  };

  const startEdit = (eventId) => {
    setEditingIds((prev) => new Set([...prev, eventId]));
  };

  const cancelEdit = (event) => {
    setDrafts((prev) => ({
      ...prev,
      [event.id]: {
        title: event.title || "",
        description: event.description || "",
        eventDate: event.eventDateObject || null,
        eventTypeId: event.eventTypeId || null,
        stageId: event.stageId || null,
      },
    }));
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(event.id);
      return next;
    });
  };

  const handleCreate = async (data) => {
    try {
      const created = await createEvent(data);
      setShowModal(false);
      await onSaved?.(created);
      showToast({
        type: "success",
        title: "Event created",
        message: `"${data.title}" has been added successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Create failed",
        message: err.message || "Could not create the event.",
      });
    }
  };

  const handleSave = async (event) => {
    const draft = drafts[event.id];
    if (!draft) return;
    try {
      const updated = await updateEvent(event.id, draft);
      setEditingIds((prev) => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
      await onSaved?.(updated);
      showToast({
        type: "success",
        title: "Event updated",
        message: `"${draft.title}" has been saved successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Save failed",
        message: err.message || "Could not update the event.",
      });
    }
  };

  const handleDelete = async (event) => {
    try {
      await deleteEvent(event.id);
      await onSaved?.(event);
      showToast({
        type: "success",
        title: "Event deleted",
        message: `"${event.title}" has been removed successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the event.",
      });
    }
  };

  return (
    <div className="et-wrapper">
      {showModal && (
        <NewEventModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          eventTypes={eventTypes}
          stages={stages}
          isSaving={isSaving}
        />
      )}

      <div className="et-toolbar">
        <SearchBar placeholder="Search an event..." onSearch={setSearch} />
        <div className="et-toolbar-right">
          <span className="et-count">{filtered.length} events</span>
          <button className="et-new-btn" onClick={() => setShowModal(true)} disabled={!dealId || isSaving}>
            <PlusIcon /> New event
          </button>
        </div>
      </div>

      <div className="et-list">
        {isLoading && <div className="et-empty-state">Loading events...</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="et-empty-state">
            {search.trim() ? "No events match your search." : "No events yet. Add the first event for this deal."}
          </div>
        )}

        {!isLoading &&
          filtered.map((event) => {
            const draft = drafts[event.id] || {
              title: event.title,
              description: event.description,
              eventDate: event.eventDateObject,
              eventTypeId: event.eventTypeId,
              stageId: event.stageId || null,
            };
            const isDirty = hasDraftChanges(event, draft);
            const isCardEditing = editingIds.has(event.id);
            const isStageChangeEvent = event.sourceType === "STAGE_LOG";

            return (
              <div key={event.id} className="et-card">
                <div className="et-left">
                  <span className="et-meta-label">Date</span>
                  <DateInputWithPicker
                    initialDate={draft.eventDate || new Date()}
                    onDateChange={(date) => updateDraft(event.id, "eventDate", date)}
                    isSingle={true}
                    dateFormat="DD/MM/YYYY"
                    disabled={!isCardEditing || isStageChangeEvent}
                  />

                  <span className="et-meta-label et-docs-label">Type</span>
                  <div className="et-type-wrap">
                    <SimpleDropdown
                      options={eventTypes}
                      value={draft.eventTypeId}
                      onChange={(value) => updateDraft(event.id, "eventTypeId", value)}
                      placeholder="Select type"
                      labelKey="name"
                      valueKey="id"
                      disabled={isSaving || !isCardEditing || isStageChangeEvent}
                    />
                  </div>

                  <span className="et-meta-label et-docs-label">Stage</span>
                  <div className="et-type-wrap">
                    <SimpleDropdown
                      options={stages}
                      value={draft.stageId}
                      onChange={(value) => updateDraft(event.id, "stageId", value)}
                      placeholder="No stage"
                      labelKey="name"
                      valueKey="id"
                      disabled={isSaving || !isCardEditing || isStageChangeEvent}
                    />
                  </div>

                  <span className="et-meta-label et-docs-label">Documents</span>
                  <div className="et-docs">
                    {event.documents.length === 0 && <div className="et-docs-empty">No attachments</div>}
                    {event.documents.map((doc) => (
                      <a
                        key={doc.id || doc.name}
                        className="et-doc-item"
                        href={doc.fileUrl || "#"}
                        target={doc.fileUrl ? "_blank" : undefined}
                        rel={doc.fileUrl ? "noreferrer" : undefined}
                        onClick={(e) => {
                          if (!doc.fileUrl) e.preventDefault();
                        }}
                      >
                        <span className="et-doc-name">{doc.name}</span>
                        <span className="et-doc-icon"><FileDownloadIcon /></span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="et-right">
                  <div className="et-right-header">
                    <input
                      className="et-title-input"
                      value={draft.title}
                      onChange={(e) => updateDraft(event.id, "title", e.target.value)}
                      placeholder="Event title"
                      readOnly={!isCardEditing || isStageChangeEvent}
                    />
                    {!isCardEditing && !isStageChangeEvent && (
                      <button className="et-edit-btn" onClick={() => startEdit(event.id)}>
                        <EditLineIcon /> Edit
                      </button>
                    )}
                    {isCardEditing && !isStageChangeEvent && (
                      <button className="et-delete-btn" onClick={() => handleDelete(event)} disabled={isSaving}>
                        <TrashIcon />
                      </button>
                    )}
                  </div>

                  <div className="et-secondary-meta">
                    <span className={`et-source-badge ${isStageChangeEvent ? "et-source-badge--stage" : "et-source-badge--manual"}`}>
                      {isStageChangeEvent ? "Stage Change" : "Manual"}
                    </span>
                    {event.createdByName && <span>Created by {event.createdByName}</span>}
                    {event.createdAt && <span>Created at {formatMetaDateTime(event.createdAt)}</span>}
                    {event.effectiveDate && <span>Effective date {formatMetaDate(event.effectiveDate)}</span>}
                    {event.stageName && <span>Stage {event.stageName}</span>}
                    <span>{event.documentsCount} document{event.documentsCount === 1 ? "" : "s"}</span>
                  </div>

                  <AutoResizeTextarea
                    className="et-description-input"
                    value={draft.description}
                    onChange={(e) => updateDraft(event.id, "description", e.target.value)}
                    placeholder="Event description"
                    readOnly={!isCardEditing || isStageChangeEvent}
                  />

                  {isCardEditing && !isStageChangeEvent && (
                    <div className="et-actions">
                      <button className="et-cancel-btn" onClick={() => cancelEdit(event)}>
                        Cancel
                      </button>
                      <button
                        className="et-save-btn"
                        onClick={() => handleSave(event)}
                        disabled={isSaving || !isDirty}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

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
