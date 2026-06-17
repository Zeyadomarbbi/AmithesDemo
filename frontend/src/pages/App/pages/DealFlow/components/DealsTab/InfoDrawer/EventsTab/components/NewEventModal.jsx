import React, { useState, useRef } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import "./NewEventModal.css";

function NewEventModal({ onClose, onSubmit, eventTypes = [], stages = [], isSaving = false }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(null);
  const [description, setDescription] = useState("");
  const [eventTypeId, setEventTypeId] = useState(null);
  const [stageId, setStageId] = useState(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleSubmit = () => {
    onSubmit?.({ title, eventDate: date, description, eventTypeId, stageId, file });
  };

  return (
    <div className="nem-overlay" onClick={onClose}>
      <div className="nem-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="nem-header">
          <button className="nem-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="nem-body">
          <h2 className="nem-title">Create an event</h2>

          {/* Title + Date row */}
          <div className="nem-row">
            <div className="nem-field">
              <label className="nem-label">Title*</label>
              <input
                type="text"
                className="nem-input"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="nem-field nem-field--date">
              <label className="nem-label">Date*</label>
              <div className="nem-date-wrap">
                <DateInputWithPicker
                  initialDate={date}
                  onDateChange={(d) => setDate(d)}
                  isSingle={true}
                  dateFormat="DD/MM/YYYY"
                />
              </div>
            </div>
          </div>

          <div className="nem-field">
            <label className="nem-label">Event type</label>
            <SimpleDropdown
              options={eventTypes}
              value={eventTypeId}
              onChange={setEventTypeId}
              placeholder="Please select an event type"
              labelKey="name"
              valueKey="id"
              disabled={isSaving}
            />
          </div>

          <div className="nem-field">
            <label className="nem-label">Stage</label>
            <SimpleDropdown
              options={stages}
              value={stageId}
              onChange={setStageId}
              placeholder="Optional stage"
              labelKey="name"
              valueKey="id"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="nem-field">
            <label className="nem-label">Description of the event</label>
            <textarea
              className="nem-textarea"
              placeholder="Enter the event description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Document */}
          <div className="nem-field">
            <label className="nem-label">Document</label>
            <div
              className={`nem-dropzone${dragging ? " nem-dropzone--drag" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <span className="nem-file-name">{file.name}</span>
              ) : (
                <>
                  <span className="nem-drop-text">Drag & Drop Here</span>
                  <span className="nem-plus-btn" aria-hidden="true">+</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onClick={(e) => { e.target.value = ""; }}
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="nem-footer">
          <button className="nem-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="nem-btn-next" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Create"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default NewEventModal;
