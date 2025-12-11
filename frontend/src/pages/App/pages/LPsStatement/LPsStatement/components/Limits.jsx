// frontend/src/pages/App/pages/LPsStatement/components/Limits.jsx
import React, { useState } from "react";
import "./Limits.css";
import NewLimitDrawer from "./NewLimitDrawer.jsx";

const PERIODS = [
  { id: "q1-2024", label: "Q1 2024", date: "08/03/26" },
  { id: "q2-2024", label: "Q2 2024", date: "08/07/26" },
];

const INITIAL_LIMITS = [
  {
    name: "Shares A",
    article: "Art 12.7",
    description: "Shares A shall represent 99.00% of the total commitment",
    limit: "99.00%",
    q4: "13.15%",
  },
  {
    name: "Shares B",
    article: "Art 12.8",
    description: "Shares B shall represent 1.00% of the total commitment",
    limit: "1.00%",
    q4: "1.00%",
  },
];

/* ---------- SVG sort icon used in table headers ---------- */
const SortIcon = () => (
  <span className="limits-sort-icon">
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5286 0.195262C3.78894 -0.0650874 4.21106 -0.0650874 4.4714 0.195262L7.80474 3.5286C8.06509 3.78894 8.06509 4.21106 7.80474 4.4714C7.54439 4.73175 7.12228 4.73175 6.86193 4.4714L4 1.60948L1.13807 4.4714C0.877722 4.73175 0.455612 4.73175 0.195262 4.4714C-0.0650874 4.21106 -0.0650874 3.78894 0.195262 3.5286L3.5286 0.195262ZM0.195262 7.5286C0.455612 7.26825 0.877722 7.26825 1.13807 7.5286L4 10.3905L6.86193 7.5286C7.12228 7.26825 7.54439 7.26825 7.80474 7.5286C8.06509 7.78895 8.06509 8.21106 7.80474 8.47141L4.4714 11.8047C4.21106 12.0651 3.78894 12.0651 3.5286 11.8047L0.195262 8.47141C-0.0650874 8.21106 -0.0650874 7.78895 0.195262 7.5286Z"
        fill="#375A89"
      />
    </svg>
  </span>
);

export default function Limits() {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1]); // Q2 2024
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  // 🔹 limits state (table data)
  const [limits, setLimits] = useState(INITIAL_LIMITS);

  const toggleDropdown = () => setOpenDropdown((prev) => !prev);

  const handleSelect = (period) => {
    setSelectedPeriod(period);
    setOpenDropdown(false);
  };

  // 🔹 called when drawer clicks "Save"
  const handleSaveNewLimit = (newLimit) => {
    if (!newLimit) return;

    setLimits((prev) => [...prev, newLimit]);
    setIsNewLimitOpen(false);
  };

  return (
    <>
      <div className="limits-root">
        {/* Top controls: period dropdown + New limit button */}
        <div className="limits-top-row">
          <div className="limits-period-wrapper">
            <button
              type="button"
              className="limits-period-button"
              onClick={toggleDropdown}
            >
              <span>{selectedPeriod.label}</span>
              <span className="limits-period-chevron" />
            </button>

            {openDropdown && (
              <div className="limits-period-menu">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={
                      "limits-period-item" +
                      (p.id === selectedPeriod.id
                        ? " limits-period-item-active"
                        : "")
                    }
                    onClick={() => handleSelect(p)}
                  >
                    <span className="limits-period-item-label">{p.label}</span>
                    <span className="limits-period-item-date">{p.date}</span>
                  </button>
                ))}

                <button
                  type="button"
                  className="limits-period-add"
                  onClick={() => {}}
                >
                  + Add a new timeframe
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="limits-new-btn"
            onClick={() => setIsNewLimitOpen(true)}
          >
            <span className="limits-new-plus" />
            <span>New limit</span>
          </button>
        </div>

        {/* Table */}
        <div className="limits-table-wrapper">
          <table className="limits-table">
            <thead>
              <tr>
                <th className="limits-th limits-th-name">
                  <span className="limits-th-inner">
                    <span>Name</span>
                    <SortIcon />
                  </span>
                </th>
                <th className="limits-th limits-th-description">
                  <span className="limits-th-inner">
                    <span>Description</span>
                    <SortIcon />
                  </span>
                </th>
                <th className="limits-th limits-th-number">
                  <span className="limits-th-inner">
                    <span>Limits</span>
                    <SortIcon />
                  </span>
                </th>
                <th className="limits-th limits-th-number">
                  <span className="limits-th-inner">
                    <span>Q4 2024</span>
                    <SortIcon />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {limits.map((row, index) => (
                <tr key={`${row.article}-${index}`} className="limits-row">
                  <td className="limits-td limits-td-name">
                    <div className="limits-name-main">{row.name}</div>
                    <button type="button" className="limits-article-link">
                      {row.article}
                    </button>
                  </td>
                  <td className="limits-td limits-td-description">
                    {row.description}
                  </td>
                  <td className="limits-td limits-td-number">{row.limit}</td>
                  <td className="limits-td limits-td-number">{row.q4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <NewLimitDrawer
        open={isNewLimitOpen}
        onClose={() => setIsNewLimitOpen(false)}
        onSave={handleSaveNewLimit}
      />
    </>
  );
}
