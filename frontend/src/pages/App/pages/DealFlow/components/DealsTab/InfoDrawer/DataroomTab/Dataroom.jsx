import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "/src/components/SearchBar/SearchBar";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import { DownloadIcon, EditLineIcon, CloseIcon, DoneIcon, TrashIcon, PlusIcon } from "/src/components/Icons/InteractiveIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useDataroomBackend } from "../../Deals_backend_work";
import { exportRowsToExcel } from "../../exportUtils";
import FilterModal from "./components/FilterModal";
import "./Dataroom.css";

function formatDocumentDate(date) {
  if (!date) return "";
  const source = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(source.getTime())) return "";
  return `${String(source.getDate()).padStart(2, "0")}/${String(source.getMonth() + 1).padStart(2, "0")}/${source.getFullYear()}`;
}

function formatUploadDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB");
}

function formatFileSize(size) {
  const numeric = Number(size);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (numeric < 1024) return `${numeric} B`;
  if (numeric < 1024 * 1024) return `${(numeric / 1024).toFixed(1)} KB`;
  return `${(numeric / (1024 * 1024)).toFixed(1)} MB`;
}

function typeBadgeStyle(color) {
  return color ? { backgroundColor: `${color}22`, color } : undefined;
}

export default function Dataroom({ dealId }) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [activeTypes, setActiveTypes] = useState([]);
  const fileInputRef = useRef(null);
  const { toast, showToast, closeToast } = useToast();

  const {
    documents,
    documentTypes,
    isLoading,
    isSaving,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
  } = useDataroomBackend(dealId);

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        title: "Dataroom failed",
        message: error,
      });
    }
  }, [error, showToast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchSearch =
        !query ||
        [doc.name, doc.fileName, doc.docTypeName, doc.eventTitle]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchType = activeTypes.length === 0 || activeTypes.includes(doc.docTypeName);
      return matchSearch && matchType;
    });
  }, [documents, search, activeTypes]);

  const allSelected = filtered.length > 0 && filtered.every((doc) => selectedIds.includes(doc.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((doc) => doc.id));
  const toggleOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setEditDraft({
      name: doc.name,
      docTypeId: doc.docTypeId,
      documentDate: doc.documentDateObject || null,
    });
  };

  const saveEdit = async (doc) => {
    try {
      await updateDocument(doc.id, editDraft);
      setEditingId(null);
      setEditDraft({});
      showToast({
        type: "success",
        title: "Document updated",
        message: `"${editDraft.name}" has been updated successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Save failed",
        message: err.message || "Could not update the document.",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await createDocument({
        file,
        name: file.name,
        docTypeId: null,
        documentDate: new Date(),
      });
      showToast({
        type: "success",
        title: "Document added",
        message: `"${file.name}" has been added to the dataroom.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Upload failed",
        message: err.message || "Could not add the document.",
      });
    }
  };

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(doc.id);
      showToast({
        type: "success",
        title: "Document deleted",
        message: `"${doc.name}" has been removed successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the document.",
      });
    }
  };

  const handleDeleteSelected = async () => {
    const selectedDocs = filtered.filter((doc) => selectedIds.includes(doc.id));
    if (selectedDocs.length === 0) return;
    if (!window.confirm(`Delete ${selectedDocs.length} selected document${selectedDocs.length === 1 ? "" : "s"}?`)) return;
    try {
      for (const doc of selectedDocs) {
        await deleteDocument(doc.id);
      }
      setSelectedIds((prev) => prev.filter((id) => !selectedDocs.some((doc) => doc.id === id)));
      showToast({
        type: "success",
        title: "Documents deleted",
        message: `${selectedDocs.length} document${selectedDocs.length === 1 ? "" : "s"} deleted successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the selected documents.",
      });
    }
  };

  const handleDownload = () => {
    try {
      const selectedRows = filtered.filter((doc) => selectedIds.includes(doc.id));
      const exportRows = selectedRows.length > 0 ? selectedRows : filtered;
      if (exportRows.length === 0) {
        showToast({
          type: "error",
          title: "Nothing to export",
          message: "There are no documents available to download.",
        });
        return;
      }

      exportRowsToExcel({
        rows: exportRows,
        sheetName: "Dataroom",
        fileName: `dealflow_dataroom_${new Date().toISOString().slice(0, 10)}`,
        columns: [
          { header: "Extension", value: (row) => row.fileExtension || "" },
          { header: "Name", value: (row) => row.name || "" },
          { header: "File Name", value: (row) => row.fileName || "" },
          { header: "Type", value: (row) => row.docTypeName || "" },
          { header: "Document Date", value: (row) => formatDocumentDate(row.documentDateObject || row.documentDate) },
          { header: "Uploaded By", value: (row) => row.uploadedByName || "" },
          { header: "Upload Date", value: (row) => formatUploadDate(row.uploadedAt) },
          { header: "Linked Event", value: (row) => row.eventTitle || "" },
          { header: "File Size", value: (row) => formatFileSize(row.fileSize) },
          { header: "File URL", value: (row) => row.fileUrl || "" },
        ],
      });

      showToast({
        type: "success",
        title: "Download started",
        message: `${exportRows.length} document${exportRows.length === 1 ? "" : "s"} exported to Excel.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Download failed",
        message: err.message || "Could not export documents.",
      });
    }
  };

  return (
    <div className="dr-wrapper">
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={({ types }) => setActiveTypes(types)}
          typeOptions={documentTypes.map((type) => type.name)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <div className="dr-toolbar">
        <SearchBar placeholder="Search a document" onSearch={setSearch} />
        <div className="dr-toolbar-right">
          <button className="dr-btn-outline" onClick={handleDownload} disabled={isLoading || filtered.length === 0}>
            <DownloadIcon /> Download
          </button>
          <button className="dr-btn-outline" onClick={handleDeleteSelected} disabled={selectedIds.length === 0 || isSaving}>
            <TrashIcon /> {isSaving ? "Deleting..." : "Delete"}
          </button>
          <button className="dr-btn-filter" onClick={() => setShowFilter(true)}>Filter</button>
          <button className="dr-btn-upload" onClick={handleUploadClick} disabled={isSaving || !dealId}>
            <PlusIcon /> Upload
          </button>
          <span className="dr-count">{filtered.length} / {documents.length}</span>
        </div>
      </div>

      {!isLoading && filtered.length === 0 ? (
        <div className="dr-empty-state">
          {documents.length === 0 ? "No dataroom documents yet. Upload the first document for this deal." : "No documents match the current filters."}
        </div>
      ) : (
        <div className="dr-table-container">
          <table className="dr-table">
            <thead>
              <tr>
                <th className="dr-th dr-th--checkbox">
                  <input type="checkbox" className="dr-checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="dr-th dr-th--left">Extension</th>
                <th className="dr-th dr-th--left">Name</th>
                <th className="dr-th">Type</th>
                <th className="dr-th">Document date</th>
                <th className="dr-th">Uploaded by</th>
                <th className="dr-th">Upload date</th>
                <th className="dr-th dr-th--left">Linked event</th>
                <th className="dr-th dr-th--actions" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr className="dr-row">
                  <td className="dr-td dr-td--center" colSpan={9}>Loading documents...</td>
                </tr>
              )}
              {!isLoading && filtered.map((doc) => {
                const isEditing = editingId === doc.id;
                const selectedType = documentTypes.find((type) => String(type.id) === String(editDraft.docTypeId));

                return (
                  <tr key={doc.id} className={`dr-row${isEditing ? " dr-row--editing" : ""}`}>
                    <td className="dr-td dr-td--checkbox">
                      <input type="checkbox" className="dr-checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleOne(doc.id)} />
                    </td>
                    <td className="dr-td dr-td--left">
                      <span className={`dr-ext dr-ext--${(doc.fileExtension || "default").toLowerCase()}`}>{doc.fileExtension || "-"}</span>
                    </td>
                    <td className="dr-td dr-td--left">
                      {isEditing ? (
                        <input className="dr-inline-input" value={editDraft.name} onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))} />
                      ) : (
                        <div className="dr-doc-main">
                          <span>{doc.name}</span>
                          <span className="dr-doc-sub">{doc.fileName}{formatFileSize(doc.fileSize) ? ` • ${formatFileSize(doc.fileSize)}` : ""}</span>
                        </div>
                      )}
                    </td>
                    <td className="dr-td dr-td--center">
                      {isEditing ? (
                        <SimpleDropdown
                          options={documentTypes}
                          value={editDraft.docTypeId}
                          onChange={(value) => setEditDraft((prev) => ({ ...prev, docTypeId: value }))}
                          placeholder="Select type"
                          labelKey="name"
                          valueKey="id"
                          disabled={isSaving}
                        />
                      ) : (
                        <span className="dr-badge" style={typeBadgeStyle(doc.docTypeColor)}>{doc.docTypeName || "-"}</span>
                      )}
                    </td>
                    <td className="dr-td dr-td--center">
                      {isEditing ? (
                        <DateInputWithPicker
                          initialDate={editDraft.documentDate}
                          onDateChange={(date) => setEditDraft((prev) => ({ ...prev, documentDate: date }))}
                          isSingle={true}
                          dateFormat="DD/MM/YYYY"
                        />
                      ) : (
                        formatDocumentDate(doc.documentDateObject || doc.documentDate)
                      )}
                    </td>
                    <td className="dr-td dr-td--center">{doc.uploadedByName || "-"}</td>
                    <td className="dr-td dr-td--center">{formatUploadDate(doc.uploadedAt)}</td>
                    <td className="dr-td dr-td--left">{doc.eventTitle || "-"}</td>
                    <td className="dr-td dr-td--actions">
                      {isEditing ? (
                        <div className="dr-edit-actions">
                          <button className="dr-edit-btn dr-edit-btn--save" onClick={() => saveEdit(doc)}><DoneIcon /></button>
                          <button className="dr-edit-btn dr-edit-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                        </div>
                      ) : (
                        <div className="dr-edit-actions">
                          <button className="dr-edit-btn" onClick={() => startEdit(doc)}><EditLineIcon /></button>
                          <button className="dr-edit-btn dr-edit-btn--cancel" onClick={() => handleDelete(doc)}><TrashIcon /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="dr-total-row">
                <td colSpan={9} />
              </tr>
            </tfoot>
          </table>
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
