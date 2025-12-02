// frontend/src/pages/App/pages/LPsStatement/components/Limits.jsx
import React, { useState } from "react";
import "./Limits.css";
import NewLimitDrawer from "./NewLimitDrawer.jsx";

const PERIODS = [
  { id: "q1-2024", label: "Q1 2024", date: "08/03/26" },
  { id: "q2-2024", label: "Q2 2024", date: "08/07/26" },
];

const MOCK_LIMITS = [
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

export default function Limits() {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1]); // Q2 2024
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  const toggleDropdown = () => setOpenDropdown((prev) => !prev);

  const handleSelect = (period) => {
    setSelectedPeriod(period);
    setOpenDropdown(false);
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
                    <span className="limits-sort-icon" />
                  </span>
                </th>
                <th className="limits-th limits-th-description">
                  <span className="limits-th-inner">
                    <span>Description</span>
                    <span className="limits-sort-icon" />
                  </span>
                </th>
                <th className="limits-th limits-th-number">
                  <span className="limits-th-inner">
                    <span>Limits</span>
                    <span className="limits-sort-icon" />
                  </span>
                </th>
                <th className="limits-th limits-th-number">
                  <span className="limits-th-inner">
                    <span>Q4 2024</span>
                    <span className="limits-sort-icon" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LIMITS.map((row) => (
                <tr key={row.article} className="limits-row">
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
      />
    </>
  );
}
