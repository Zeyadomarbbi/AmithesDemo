import React, { useState } from "react";
import { useTableSort, SortableHeaderRenderer } from "/src/components/Sort/TableSort";
import { PlusIcon } from "/src/components/Icons/InteractiveIcons";
import NewCapModal from "./components/NewCapModal";
import "./CapTable.css";

const INITIAL_VERSIONS = [
  { id: 1, label: "Before investment", date: "01/08/2024" },
  { id: 2, label: "After investment",  date: "05/04/2025" },
  { id: 3, label: "Round 3",           date: "02/03/2026" },
  { id: 4, label: "Round 4",           date: "02/03/2027" },
];

const SHARE_COLS = ["Series A", "Series B", "Common", "Preferred", "Seed"];

const ROWS = [
  { id: 1, name: "Shareholder X", comment: "Comment", seriesA: 10000, seriesB: 250,  common: 548,  preferred: null, seed: null, esop: null,  nfd: 15.54, fd: 14.87 },
  { id: 2, name: "Shareholder X", comment: "Comment", seriesA: null,  seriesB: null,  common: 201,  preferred: 1587, seed: 540,  esop: null,  nfd: 5.54,  fd: 5.12  },
  { id: 3, name: "Shareholder X", comment: "Comment", seriesA: 5000,  seriesB: null,  common: 6541, preferred: 873,  seed: null, esop: null,  nfd: 30.45, fd: 29.89 },
  { id: 4, name: "Shareholder X", comment: "Comment", seriesA: 1548,  seriesB: 254,   common: null, preferred: null, seed: null, esop: 254,   nfd: 24.25, fd: 25.54 },
  { id: 5, name: "Shareholder X", comment: "Comment", seriesA: 6254,  seriesB: 987,   common: null, preferred: 1547, seed: null, esop: 254,   nfd: 7.68,  fd: 8.01  },
];

const KEY_MAP = {
  "Series A":  "seriesA",
  "Series B":  "seriesB",
  "Common":    "common",
  "Preferred": "preferred",
  "Seed":      "seed",
};

function fmt(val) {
  if (val === null || val === undefined || !Number.isFinite(val)) return "-";
  return val.toLocaleString();
}

function fmtPct(val) {
  if (val === null || val === undefined || !Number.isFinite(val)) return "-";
  return val.toFixed(2) + "%";
}

function totCol(key) {
  return ROWS.reduce((s, r) => s + (r[key] ?? 0), 0);
}

function formatDate(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export default function CapTable() {
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [activeVersion, setActiveVersion] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const sort = useTableSort(ROWS, "name");

  const handleAddVersion = ({ name, date }) => {
    if (!name) return;
    const nextId = versions.reduce((m, v) => Math.max(m, v.id), 0) + 1;
    const newVersion = { id: nextId, label: name, date: formatDate(date) };
    setVersions((prev) => [...prev, newVersion]);
    setActiveVersion(nextId);
    setShowModal(false);
  };

  return (
    <div className="ct-wrapper">
      {showModal && (
        <NewCapModal
          onClose={() => setShowModal(false)}
          onNext={handleAddVersion}
        />
      )}
      {/* Version sub-tabs + New cap table */}
      <div className="ct-versions-bar">
        <div className="ct-versions">
          {versions.map((v) => (
            <button
              key={v.id}
              className={`ct-version-btn${activeVersion === v.id ? " ct-version-btn--active" : ""}`}
              onClick={() => setActiveVersion(v.id)}
            >
              <span className="ct-version-label">{v.label}</span>
              <span className="ct-version-date">{v.date}</span>
            </button>
          ))}
        </div>
        <button className="ct-new-btn" onClick={() => setShowModal(true)}>
          <PlusIcon /> New cap table
        </button>
      </div>

      {/* Table */}
      <div className="ct-table-container">
        <table className="ct-table">
          <thead>
            <tr>
              <th className="ct-th ct-th--left">
                <SortableHeaderRenderer
                  label="Name"
                  columnKey="name"
                  currentSortKey={sort.sortKey}
                  toggleSort={sort.toggleSort}
                  center={false}
                />
              </th>
              {SHARE_COLS.map((col) => (
                <th key={col} className="ct-th">
                  <SortableHeaderRenderer
                    label={col}
                    columnKey={KEY_MAP[col]}
                    currentSortKey={sort.sortKey}
                    toggleSort={sort.toggleSort}
                    center={true}
                  />
                </th>
              ))}
              <th className="ct-th ct-th--highlight">n.f.d (%)</th>
              <th className="ct-th">
                <SortableHeaderRenderer
                  label="ESOP"
                  columnKey="esop"
                  currentSortKey={sort.sortKey}
                  toggleSort={sort.toggleSort}
                  center={true}
                />
              </th>
              <th className="ct-th ct-th--highlight">f.d (%)</th>
            </tr>
          </thead>
          <tbody>
            {sort.sorted.map((row) => (
              <tr key={row.id} className="ct-row">
                <td className="ct-td ct-td--name">
                  <span className="ct-name">{row.name}</span>
                  <span className="ct-comment">{row.comment}</span>
                </td>
                {SHARE_COLS.map((col) => (
                  <td key={col} className="ct-td ct-td--center">{fmt(row[KEY_MAP[col]])}</td>
                ))}
                <td className="ct-td ct-td--center ct-td--highlight">{fmtPct(row.nfd)}</td>
                <td className="ct-td ct-td--center">{fmt(row.esop)}</td>
                <td className="ct-td ct-td--center ct-td--highlight">{fmtPct(row.fd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="ct-total-row">
              <td className="ct-td--total-label">Total</td>
              {SHARE_COLS.map((col) => (
                <td key={col} className="ct-td--total-center">{fmt(totCol(KEY_MAP[col]))}</td>
              ))}
              <td className="ct-td--total-center">{fmtPct(ROWS.reduce((s, r) => s + (r.nfd ?? 0), 0))}</td>
              <td className="ct-td--total-center">{fmt(totCol("esop"))}</td>
              <td className="ct-td--total-center">{fmtPct(ROWS.reduce((s, r) => s + (r.fd ?? 0), 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
