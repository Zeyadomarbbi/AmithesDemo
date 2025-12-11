// components/PortfolioCompareTab.jsx
import React, { useState } from "react";
import { ChevronDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { COMPARE_ROWS, COMPARE_TOTAL_ROW } from "../portfolioData";

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

const PortfolioCompareTab = ({ onSelectInvestment }) => {
  const [isTimeframe1Open, setIsTimeframe1Open] = useState(false);
  const [isTimeframe2Open, setIsTimeframe2Open] = useState(false);

  return (
    <section className="compare-section">
      <div className="compare-timeframes-row">
        {/* Left timeframe */}
        <div className="timeframe-dropdown">
          <button
            className="dropdown-btn"
            onClick={() => setIsTimeframe1Open((prev) => !prev)}
          >
            <span>Q2 2024</span>
            <ChevronDownIcon
              className="icon-svg caret-icon"
              style={smallIconStyle}
            />
          </button>

          {isTimeframe1Open && (
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

        {/* Right timeframe */}
        <div className="timeframe-dropdown">
          <button
            className="dropdown-btn"
            onClick={() => setIsTimeframe2Open((prev) => !prev)}
          >
            <span>Q2 2025</span>
            <ChevronDownIcon
              className="icon-svg caret-icon"
              style={smallIconStyle}
            />
          </button>

          {isTimeframe2Open && (
            <div className="timeframe-menu">
              <button className="timeframe-menu-item">
                <span className="timeframe-menu-item-label">Q1 2025</span>
                <span className="timeframe-menu-item-date">08/03/27</span>
              </button>
              <button className="timeframe-menu-item active">
                <span className="timeframe-menu-item-label">Q2 2025</span>
                <span className="timeframe-menu-item-date">08/07/27</span>
              </button>
              <button className="timeframe-menu-add">
                + Add a new timeframe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compare table */}
      <div className="portfolio-table-card compare-table-card">
        <div className="portfolio-table-scroll">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th className="col-name">
                  Name <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Cost Q2 2024 (€) <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Cost Q2 2025 (€) <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number col-highlight">
                  Difference (€) <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Fair value Q2 2024 (€){" "}
                  <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  Fair value Q2 2025 (€){" "}
                  <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number col-highlight">
                  Change (€) <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  MOIC Q2 2024 (net){" "}
                  <span className="sort-indicator">↕</span>
                </th>
                <th className="col-number">
                  MOIC Q2 2025 (net){" "}
                  <span className="sort-indicator">↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectInvestment({ ...row })}
                >
                  <td className="name-cell compare-name-cell">
                    <div className="name-main">{row.name}</div>
                    <div className="name-sub">{row.sector}</div>
                  </td>
                  <td className="col-number">{row.costQ1}</td>
                  <td className="col-number">{row.costQ2}</td>
                  <td className="col-number col-highlight">{row.diff}</td>
                  <td className="col-number">{row.fvQ1}</td>
                  <td className="col-number">{row.fvQ2}</td>
                  <td className="col-number col-highlight">{row.change}</td>
                  <td className="col-number">{row.moicQ1}</td>
                  <td className="col-number">{row.moicQ2}</td>
                </tr>
              ))}

              <tr className="portfolio-subtotal-row total-row">
                <td className="subtotal-name-cell">
                  <ArrowTrendingUpIcon
                    className="icon-svg subtotal-icon"
                    style={iconStyle}
                  />
                <span>Total</span>
                </td>
                <td className="col-number">{COMPARE_TOTAL_ROW.costQ1}</td>
                <td className="col-number">{COMPARE_TOTAL_ROW.costQ2}</td>
                <td className="col-number col-highlight">
                  {COMPARE_TOTAL_ROW.diff}
                </td>
                <td className="col-number">{COMPARE_TOTAL_ROW.fvQ1}</td>
                <td className="col-number">{COMPARE_TOTAL_ROW.fvQ2}</td>
                <td className="col-number col-highlight">
                  {COMPARE_TOTAL_ROW.change}
                </td>
                <td className="col-number">{COMPARE_TOTAL_ROW.moicQ1}</td>
                <td className="col-number">{COMPARE_TOTAL_ROW.moicQ2}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder chart card */}
      <section className="compare-chart-section">
        <div className="compare-chart-card">
          <div className="compare-chart-header">
            <span className="compare-chart-title">m€</span>
            <div className="compare-chart-filters">
              <button className="dropdown-btn">
                <span>Select an investment</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
              <button className="dropdown-btn">
                <span>Cost</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
              <button className="dropdown-btn">
                <span>Timeframe (2)</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
            </div>
          </div>
          <div className="compare-chart-placeholder" />
        </div>
      </section>
    </section>
  );
};

export default PortfolioCompareTab;
