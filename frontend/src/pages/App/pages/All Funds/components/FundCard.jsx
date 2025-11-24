import React from "react";
import "./FundCard.css";

export default function FundCard({ fund, clickable = false, onClick }) {
  const toneClass =
    fund.badgeTone === "warn"
      ? "badge-warn"
      : fund.badgeTone === "success"
      ? "badge-success"
      : "badge-info";

  return (
    <div
      className={`fund-card ${clickable ? "clickable" : ""}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="fund-top">
        <div className="fund-left">
          <div className="fund-title-row">
            <h3 className="fund-title">{fund.name}</h3>
            {fund.hasAlert && <span className="alert-dot" />}
          </div>

          <div className="fund-created">{fund.createdOn}</div>

          <div className={`fund-badge ${toneClass}`}>{fund.badgeText}</div>
        </div>

        <div className="fund-arrow">
          <div className="arrow-circle">
            <div className="arrow-right" />
          </div>
        </div>
      </div>

      <div className="fund-stats">
        <div className="stat-box">
          <div className="stat-label">Gross IRR</div>
          <div className="stat-value">{fund.grossIrr}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Net IRR</div>
          <div className="stat-value">{fund.netIrr}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label"># Deals</div>
          <div className="stat-value">{fund.deals}</div>
        </div>
      </div>
    </div>
  );
}
