import React, { useState } from "react";
import SearchBar from "/src/components/SearchBar/SearchBar";
import { useTableSort, SortableHeaderRenderer } from "/src/components/Sort/TableSort";
import { DownloadIcon, EditLineIcon, CloseIcon, DoneIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
import { ChevronDownIcon } from "/src/components/Icons/DirectionIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import FilterModal from "./components/FilterModal";
import "./Dataroom.css";

const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseDocDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDocDate(d) {
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

const INITIAL_DOCS = [
  { id: 1, ext: "PDF", name: "SPA.executed version",   type: "Transaction", docDate: "21 March 2024", uploader: "Jean Dupont", initials: "JD", uploadDate: "21 March 2024" },
  { id: 2, ext: "DOC", name: "SPA.draft12.05",         type: "Transaction", docDate: "04 April 2024", uploader: "Jean Dupont", initials: "JD", uploadDate: "04 April 2024" },
  { id: 3, ext: "XLS", name: "business.plan",          type: "Financial",   docDate: "15 May 2025",   uploader: "Jean Dupont", initials: "JD", uploadDate: "15 May 2025"   },
  { id: 4, ext: "XLS", name: "valuation Q2 2025",      type: "Financial",   docDate: "15 July 2025",  uploader: "Jean Dupont", initials: "JD", uploadDate: "15 July 2025"  },
  { id: 5, ext: "XLS", name: "valuation Q4 2025",      type: "Financial",   docDate: "15 Jan 2026",   uploader: "Jean Dupont", initials: "JD", uploadDate: "15 Jan 2026"   },
  { id: 6, ext: "DOC", name: "termsheet.vdraft02.03",  type: "Legal",       docDate: "08 April 2024", uploader: "Jean Dupont", initials: "JD", uploadDate: "08 April 2024" },
  { id: 7, ext: "PDF", name: "SHA.exe.verison",        type: "Transaction", docDate: "21 March 2025", uploader: "Jean Dupont", initials: "JD", uploadDate: "21 March 2025" },
];

const TYPE_OPTIONS = ["Transaction", "Financial", "Legal"];

const typeBadgeClass = (type) => {
  const map = { Transaction: "dr-badge--transaction", Financial: "dr-badge--financial", Legal: "dr-badge--legal" };
  return map[type] || "";
};

export default function Dataroom() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [activeTypes, setActiveTypes] = useState([]);

  const { sorted, sortKey, toggleSort } = useTableSort(docs, "name");

  const filtered = sorted.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchType = activeTypes.length === 0 || activeTypes.includes(d.type);
    return matchSearch && matchType;
  });

  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((d) => d.id));
  const toggleOne = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setEditDraft({ name: doc.name, type: doc.type, docDate: doc.docDate });
  };

  const saveEdit = (id) => {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, ...editDraft } : d));
    setEditingId(null);
    setEditDraft({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  return (
    <div className="dr-wrapper">
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={({ types }) => setActiveTypes(types)}
        />
      )}
      {/* Toolbar */}
      <div className="dr-toolbar">
        <SearchBar placeholder="Search a document" onSearch={setSearch} />
        <div className="dr-toolbar-right">
          <button className="dr-btn-outline"><DownloadIcon /> Download</button>
          <button className="dr-btn-outline"><TrashIcon /> Delete</button>
          <button className="dr-btn-filter" onClick={() => setShowFilter(true)}>Filter</button>
          <span className="dr-count">{filtered.length} / {docs.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="dr-table-container">
        <table className="dr-table">
          <thead>
            <tr>
              <th className="dr-th dr-th--checkbox">
                <input type="checkbox" className="dr-checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="dr-th dr-th--left">Extension</th>
              <th className="dr-th dr-th--left">
                <SortableHeaderRenderer label="Name" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} center={false} />
              </th>
              <th className="dr-th">
                <SortableHeaderRenderer label="Type" columnKey="type" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
              <th className="dr-th">
                <SortableHeaderRenderer label="Document date" columnKey="docDate" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
              <th className="dr-th">
                <SortableHeaderRenderer label="Uploaded by" columnKey="uploader" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
              <th className="dr-th">
                <SortableHeaderRenderer label="Upload date" columnKey="uploadDate" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
              <th className="dr-th dr-th--actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => {
              const isEditing = editingId === doc.id;
              return (
                <tr key={doc.id} className={`dr-row${isEditing ? " dr-row--editing" : ""}`}>
                  <td className="dr-td dr-td--checkbox">
                    <input type="checkbox" className="dr-checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleOne(doc.id)} />
                  </td>
                  <td className="dr-td dr-td--left">
                    <span className={`dr-ext dr-ext--${(doc.ext || "default").toLowerCase()}`}>{doc.ext}</span>
                  </td>
                  <td className="dr-td dr-td--left">
                    {isEditing
                      ? <input className="dr-inline-input" value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} />
                      : doc.name}
                  </td>
                  <td className="dr-td dr-td--center">
                    {isEditing
                      ? (
                        <div className="dr-select-wrap">
                          <select className="dr-inline-select" value={editDraft.type} onChange={(e) => setEditDraft((p) => ({ ...p, type: e.target.value }))}>
                            {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                          </select>
                          <span className="dr-select-chevron"><ChevronDownIcon /></span>
                        </div>
                      )
                      : <span className={`dr-badge ${typeBadgeClass(doc.type)}`}>{doc.type}</span>}
                  </td>
                  <td className="dr-td dr-td--center">
                    {isEditing
                      ? (
                        <DateInputWithPicker
                          initialDate={parseDocDate(editDraft.docDate) || new Date()}
                          onDateChange={(d) => setEditDraft((p) => ({ ...p, docDate: formatDocDate(d) }))}
                          isSingle={true}
                          dateFormat="DD/MM/YYYY"
                        />
                      )
                      : doc.docDate}
                  </td>
                  <td className="dr-td dr-td--center">
                    <div className="dr-uploader">
                      <span className="dr-avatar">{doc.initials}</span>
                      <span className="dr-uploader-name">{doc.uploader}</span>
                    </div>
                  </td>
                  <td className="dr-td dr-td--center">{doc.uploadDate}</td>
                  <td className="dr-td dr-td--actions">
                    {isEditing ? (
                      <div className="dr-edit-actions">
                        <button className="dr-edit-btn dr-edit-btn--save" onClick={() => saveEdit(doc.id)}><DoneIcon /></button>
                        <button className="dr-edit-btn dr-edit-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                      </div>
                    ) : (
                      <button className="dr-edit-btn" onClick={() => startEdit(doc)}><EditLineIcon /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="dr-total-row">
              <td colSpan={8} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
