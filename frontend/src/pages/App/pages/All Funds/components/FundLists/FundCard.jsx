import React from "react";
import "./FundCard.css";

export default function FundCard({ fund, fundKpi, clickable = false, onClick }) {
  /** Call calculatefundportfolioKPI.js */
    const getToneClass = (phase) => {
    const phaseLower = phase?.toLowerCase() || "";

    if (
      phaseLower.includes("marketing") ||
      phaseLower.includes("fundraising") ||
      phaseLower.includes("investment")
    ) {
      return "badge-investment";
    }

    if (phaseLower.includes("divestment")) {
      return "badge-divestment";
    }

    if (phaseLower.includes("liquidation") || phaseLower.includes("closed")) {
      return "badge-closed";
    }

    return "badge-info"; // Fallback
  };

  const toneClass = getToneClass(fund.phaseName);

  const handleKeyDown = (e) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };
  const formatKpi = (val) => (val !== undefined && val !== null && val !== "" ? val : "-");
return (
    <div
      className={`fund-card ${clickable ? "clickable" : ""}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="fund-top">
        <div className="fund-left">
          <div className="fund-title-row">
            <h3 className="fund-title">{fund.name}</h3>
            {fund.hasAlert && <span className="alert-dot" />}
          </div>

          <div className="fund-created">{fund.formationDate}</div>

          <div className={`fund-badge ${toneClass}`}>{fund.phaseName}</div>
        </div>

        <div className="fund-arrow">
          <div className="arrow-circle">
            <svg
              className="arrow-icon"
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.86193 0.195262C5.12228 -0.0650874 5.54439 -0.0650874 5.80474 0.195262L10.4714 4.86193C10.7318 5.12228 10.7318 5.54439 10.4714 5.80474L5.80474 10.4714C5.54439 10.7318 5.12228 10.7318 4.86193 10.4714C4.60158 10.2111 4.60158 9.78895 4.86193 9.5286L8.39052 6H0.666667C0.298477 6 0 5.70152 0 5.33333C0 4.96514 0.298477 4.66667 0.666667 4.66667H8.39052L4.86193 1.13807C4.60158 0.877722 4.60158 0.455612 4.86193 0.195262Z"
                fill="#375A89"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="fund-stats">
        <div className="stat-box">
          <div className="stat-label">Gross IRR</div>
          <div className="stat-value">{formatKpi(fundKpi?.grossIrr)}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Net IRR</div>
          <div className="stat-value">{formatKpi(fundKpi?.netIrr)}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label"># Deals</div>
          <div className="stat-value">{formatKpi(fundKpi?.deals)}</div>
        </div>
      </div>
    </div>
  );
}