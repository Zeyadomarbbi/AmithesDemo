import React, { useState } from "react";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import "./UploadModal.css";

function formatFileSize(size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(filename) {
  const parts = String(filename || "").split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
}

export default function UploadModal({ file, documentTypes, isSaving, onConfirm, onCancel }) {
  const [name, setName] = useState(file?.name || "");
  const [docTypeId, setDocTypeId] = useState(null);
  const [documentDate, setDocumentDate] = useState(new Date());

  const ext = getExtension(file?.name);
  const size = formatFileSize(file?.size);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({ file, name: name.trim(), docTypeId, documentDate });
  };

  return (
    <div className="um-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="um-modal">
        <div className="um-header">
          <span className="um-title">Upload document</span>
          <button className="um-close-btn" onClick={onCancel}><CloseIcon /></button>
        </div>

        <div className="um-file-preview">
          {ext && <span className={`um-ext dr-ext--${ext.toLowerCase()}`}>{ext}</span>}
          <div className="um-file-info">
            <span className="um-file-name">{file?.name}</span>
            {size && <span className="um-file-size">{size}</span>}
          </div>
        </div>

        <form className="um-form" onSubmit={handleSubmit}>
          <div className="um-field">
            <label className="um-label">Document name</label>
            <input
              className="um-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
              autoFocus
            />
          </div>

          <div className="um-field">
            <label className="um-label">Type</label>
            <SimpleDropdown
              options={documentTypes}
              value={docTypeId}
              onChange={setDocTypeId}
              placeholder="Select type"
              labelKey="name"
              valueKey="id"
              disabled={isSaving}
            />
          </div>

          <div className="um-field">
            <label className="um-label">Document date</label>
            <DateInputWithPicker
              initialDate={documentDate}
              onDateChange={setDocumentDate}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
          </div>

          <div className="um-footer">
            <button type="button" className="um-btn um-btn--cancel" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="um-btn um-btn--upload" disabled={isSaving || !name.trim()}>
              {isSaving ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
