import React, { useState } from "react";
import { useTableSort, SortableHeaderRenderer } from "/src/components/Sort/TableSort";
import { PlusIcon } from "/src/components/Icons/InteractiveIcons";
import NewBoardModal from "./components/NewBoardModal";
import "./OtherTab.css";

const INITIAL_VERSIONS = [
  { id: 1, label: "Board of Directors", date: "01/08/2024" },
  { id: 2, label: "Board of Directors", date: "05/04/2025" },
];

const ROWS = [
  { id: 1, name: "Gibril",   seats: 1, dateIn: "21/01/2024", dateOut: null         },
  { id: 2, name: "Léa",     seats: 1, dateIn: "21/01/2024", dateOut: null         },
  { id: 3, name: "Thomas",  seats: 1, dateIn: "21/01/2024", dateOut: null         },
  { id: 4, name: "Antonella", seats: 1, dateIn: "21/01/2024", dateOut: null       },
  { id: 5, name: "Amethis", seats: 3, dateIn: "21/01/2024", dateOut: null         },
  { id: 6, name: "Chafik",  seats: 1, dateIn: "21/01/2024", dateOut: null         },
  { id: 7, name: "Xxx",     seats: 1, dateIn: "21/01/2024", dateOut: "21/04/2025" },
];

function formatDate(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export default function OtherTab() {
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [activeVersion, setActiveVersion] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const { sorted, sortKey, toggleSort } = useTableSort(ROWS, "name");

  const handleAddVersion = ({ name, date }) => {
    if (!name) return;
    const nextId = versions.reduce((m, v) => Math.max(m, v.id), 0) + 1;
    setVersions((prev) => [...prev, { id: nextId, label: name, date: formatDate(date) }]);
    setActiveVersion(nextId);
    setShowModal(false);
  };

  return (
    <div className="ot-wrapper">
      {showModal && (
        <NewBoardModal
          onClose={() => setShowModal(false)}
          onNext={handleAddVersion}
        />
      )}
      {/* Version bar + Add */}
      <div className="ot-versions-bar">
        <div className="ot-versions">
          {versions.map((v) => (
            <button
              key={v.id}
              className={`ot-version-btn${activeVersion === v.id ? " ot-version-btn--active" : ""}`}
              onClick={() => setActiveVersion(v.id)}
            >
              <span className="ot-version-label">{v.label}</span>
              <span className="ot-version-date">{v.date}</span>
            </button>
          ))}
        </div>
        <button className="ot-add-btn" onClick={() => setShowModal(true)}><PlusIcon /> Add</button>
      </div>

      {/* Table */}
      <div className="ot-table-container">
        <table className="ot-table">
          <thead>
            <tr>
              <th className="ot-th ot-th--left">
                <SortableHeaderRenderer label="Name" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} center={false} />
              </th>
              <th className="ot-th">
                <SortableHeaderRenderer label="# of seats" columnKey="seats" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
              <th className="ot-th">
                <SortableHeaderRenderer label="Date In" columnKey="dateIn" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
              <th className="ot-th">
                <SortableHeaderRenderer label="Date Out" columnKey="dateOut" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="ot-row">
                <td className="ot-td ot-td--left">{row.name}</td>
                <td className="ot-td ot-td--center">{row.seats}</td>
                <td className="ot-td ot-td--center">
                  {row.dateIn && <span className="ot-badge ot-badge--in">{row.dateIn}</span>}
                </td>
                <td className="ot-td ot-td--center">
                  {row.dateOut && <span className="ot-badge ot-badge--out">{row.dateOut}</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="ot-total-row">
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
