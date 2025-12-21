import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { quarterOptions, limitsRows } from "../data/mockData";
import LimitSidePanel from "./LimitSidePanel";
import "../styles/Limits.css";

const LimitsTab = () => {
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);
  const [isQuarterOpen, setIsQuarterOpen] = useState(false);

  return (
    <>
      <section className="limits-section">
        <div className="limits-filters-row">
          <div className="limits-filters-left">
            {/* Quarter Dropdown */}
            <div className="timeframe-wrapper">
              <button
                className="timeframe-btn"
                type="button"
                onClick={() => setIsQuarterOpen((v) => !v)}
              >
                <span>Q2 2024</span>
                <ChevronDownIcon className="icon-svg caret-icon" />
              </button>

              {isQuarterOpen && (
                <div className="timeframe-dropdown">
                  {quarterOptions.map((q) => (
                    <div
                      key={q.id}
                      className="timeframe-item"
                      onClick={() => setIsQuarterOpen(false)}
                    >
                      <span className="timeframe-label">{q.label}</span>
                      <span className="timeframe-date">{q.date}</span>
                    </div>
                  ))}
                  <div className="timeframe-add">+ Add a new quarter</div>
                </div>
              )}
            </div>

            {/* Scenario Dropdown (STATIC for now) */}
            <button className="dropdown-btn" type="button">
              <span>Scenario Opti...</span>
              <ChevronDownIcon className="icon-svg caret-icon" />
            </button>
          </div>

          <button
            className="new-limit-btn"
            type="button"
            onClick={() => setIsNewLimitOpen(true)}
          >
            + New limit
          </button>
        </div>

        {/* ===== TABLE ===== */}
        <div className="limits-table-wrapper">
          <table className="limits-table">
            <thead>
              <tr>
                <th >
  <span className="header-label">Name ↕</span>
</th>

                <th>Description</th>
                <th className="col-number">
                  Limits <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Q4 2024 <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Scenario Optimi...
                  <span className="sort-indicator">↕</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {limitsRows.map((row) => (
                <tr key={row.id}>
                  <td className="name-cell">
  <div className="name-main">
    {row.name} <span className="name-sub-inline">({row.article})</span>
  </div>
</td>


                  <td>{row.description}</td>

                  <td className="col-number">{row.limit}</td>
                  <td className="col-number">{row.q4}</td>

                  <td
                    className={`col-number ${
                      row.breach ? "breach-red" : ""
                    }`}
                  >
                    {row.scenario}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <LimitSidePanel
        isOpen={isNewLimitOpen}
        onClose={() => setIsNewLimitOpen(false)}
      />
    </>
  );
};

export default LimitsTab;