// components/PortfolioLimitsTab.jsx
import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { LIMITS_ROWS } from "../portfolioData";
import NewLimitPanel from "./NewLimitPanel";

const iconStyle = {
  color: "#111827",
  stroke: "#111827",
  strokeWidth: 1.5,
  width: 20,
  height: 20,
};

const smallIconStyle = {
  ...iconStyle,
  width: 14,
  height: 14,
};

const PortfolioLimitsTab = () => {
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  return (
    <>
      <section className="limits-section">
        <div className="limits-filters-row">
          <div className="limits-filters-left">
            <div className="timeframe-dropdown">
              <button
                className="dropdown-btn"
                onClick={() => setIsTimeframeOpen((prev) => !prev)}
              >
                <span>Q2 2024</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>

              {isTimeframeOpen && (
                <div className="timeframe-menu">
                  <button className="timeframe-menu-item">
                    <span className="timeframe-menu-item-label">Q1 2024</span>
                    <span className="timeframe-menu-item-date">08/03/26</span>
                  </button>
                  <button className="timeframe-menu-item active">
                    <span className="timeframe-menu-item-label">Q2 2024</span>
                    <span className="timeframe-menu-item-date">08/07/26</span>
                  </button>
                  <button className="timeframe-menu-add">
                    + Add a new timeframe
                  </button>
                </div>
              )}
            </div>

            <button className="dropdown-btn">
              <span>Scenario Opti...</span>
              <ChevronDownIcon
                className="icon-svg caret-icon"
                style={smallIconStyle}
              />
            </button>
          </div>

          <button
            className="new-limit-btn"
            onClick={() => setIsNewLimitOpen(true)}
          >
            + New limit
          </button>
        </div>

        <div className="limits-table-wrapper">
          <table className="limits-table">
            <thead>
              <tr>
                <th>
                  Name <span className="sort-indicator">↕</span>
                </th>
                <th>Description</th>
                <th className="col-number">
                  Limits <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Q4 2024 <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Scenario Optimi…{" "}
                  <span className="sort-indicator">↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {LIMITS_ROWS.map((row) => (
                <tr key={row.id}>
                  <td className="name-cell">
                    <div className="name-main">{row.name}</div>
                    <div className="name-sub limits-link">{row.article}</div>
                  </td>
                  <td>{row.description}</td>
                  <td className="col-number">{row.limit}</td>
                  <td className="col-number">{row.q4}</td>
                  <td
                    className={`col-number ${
                      row.isBreach ? "breach-red" : ""
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

      {isNewLimitOpen && (
        <NewLimitPanel onClose={() => setIsNewLimitOpen(false)} />
      )}
    </>
  );
};

export default PortfolioLimitsTab;
