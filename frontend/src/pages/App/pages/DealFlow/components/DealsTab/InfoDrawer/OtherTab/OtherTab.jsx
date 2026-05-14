import React, { useState } from "react";
import { useTableSort, SortableHeaderRenderer } from "/src/components/Sort/TableSort";
import { PlusIcon } from "/src/components/Icons/InteractiveIcons";
import "./OtherTab.css";

const VERSIONS = [
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

export default function OtherTab() {
  const [activeVersion, setActiveVersion] = useState(2);
  const { sorted, sortKey, toggleSort } = useTableSort(ROWS, "name");

  return (
    <div className="ot-wrapper">
      {/* Version bar + Add */}
      <div className="ot-versions-bar">
        <div className="ot-versions">
          {VERSIONS.map((v) => (
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
        <button className="ot-add-btn"><PlusIcon /> Add</button>
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
