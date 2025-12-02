// src/pages/App/pages/LPsStatement/components/CapitalAccountStatement.jsx
import React, { useState } from "react";
import NoticesModal from "./NoticesModal.jsx";
import "./capitalAccountStatement.css";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const SHARE_CLASSES = [
  { key: "total", label: "Total (€)" },
  { key: "a1", label: "Share class A1 (€)" },
  { key: "a2", label: "Share class A2 (€)" },
  { key: "a3", label: "Share class A3 (€)" },
  { key: "b", label: "Share class B (€)" },
];

const KPI_ROWS = [
  {
    kpi: "Commitment",
    values: {
      total: "100 000 000",
      a1: "60 000 000",
      a2: "10 000 000",
      a3: "29 000 000",
      b: "1 000 000",
    },
  },
  {
    kpi: "Capital called",
    values: {
      total: "50 685 457",
      a1: "30 568 475",
      a2: "5 478 210",
      a3: "14 685 632",
      b: "510 023",
    },
  },
  {
    kpi: "Undrawn",
    values: {
      total: "49 415 362",
      a1: "29 874 254",
      a2: "4 685 741",
      a3: "14 456 002",
      b: "490 658",
    },
  },
  {
    kpi: "Distributed",
    values: {
      total: "20 547 852",
      a1: "12 658 742",
      a2: "2 054 785",
      a3: "6 354 125",
      b: "205 478",
    },
  },
  {
    kpi: "NAV",
    values: {
      total: "61 458 525",
      a1: "36 547 852",
      a2: "6 145 852",
      a3: "18 658 003",
      b: "614 585",
    },
  },
  {
    kpi: "TVPI",
    suffix: "x",
    values: { total: "0.21", a1: "0.21", a2: "0.21", a3: "0.21", b: "0.21" },
  },
  {
    kpi: "RVPI",
    suffix: "x",
    values: { total: "1.12", a1: "1.12", a2: "1.12", a3: "1.12", b: "1.12" },
  },
  {
    kpi: "DPI",
    suffix: "x",
    values: { total: "1.33", a1: "1.33", a2: "1.33", a3: "1.33", b: "1.33" },
  },
  {
    kpi: "Number of shares",
    values: {
      total: "100 000",
      a1: "60 000",
      a2: "10 000",
      a3: "29 000 000",
      b: "1 000",
    },
  },
  {
    kpi: "NAV per share",
    isExpandable: true,
    values: {
      total: "-",
      a1: "547.87",
      a2: "2 180.56",
      a3: "2 180.56",
      b: "5 218.68",
    },
  },
  {
    kpi: "% Called",
    suffix: "%",
    values: {
      total: "50.08",
      a1: "50.08",
      a2: "50.08",
      a3: "50.08",
      b: "50.08",
    },
  },
  {
    kpi: "% Distributed",
    suffix: "%",
    values: {
      total: "20.07",
      a1: "20.07",
      a2: "20.07",
      a3: "20.07",
      b: "20.07",
    },
  },
];

export default function CapitalAccountStatement() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q2");
  const [asOfDate] = useState("08/07/26");
  const [breakdown, setBreakdown] = useState("share-class"); // 'share-class' | 'lps'
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);   // modal state

  const renderShareClassTable = () => (
    <div className="lp-cas-table-wrapper">
      <table className="lp-cas-table">
        <thead>
          <tr>
            <th className="lp-cas-kpi-header">
              KPIs <span className="lp-cas-sort-icon">◇</span>
            </th>
            {SHARE_CLASSES.map((col) => (
              <th key={col.key} className="lp-cas-header-cell">
                <span>{col.label}</span>
                <span className="lp-cas-sort-icon">◇</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KPI_ROWS.map((row) => (
            <tr
              key={row.kpi}
              className={
                "lp-cas-row" +
                (row.isExpandable ? " lp-cas-row--expandable" : "")
              }
            >
              <td className="lp-cas-kpi-cell">
                {row.isExpandable && <span className="lp-cas-plus">+</span>}
                <span>{row.kpi}</span>
              </td>
              {SHARE_CLASSES.map((col) => {
                const raw = row.values[col.key];
                const value = raw
                  ? row.suffix === "x"
                    ? `${raw}x`
                    : row.suffix === "%"
                    ? `${raw}%`
                    : raw
                  : "-";
                return (
                  <td key={col.key} className="lp-cas-value-cell">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLPsTable = () => (
    <div className="lp-cas-table-wrapper">
      <table className="lp-cas-table lp-cas-table--lps">
        <thead>
          <tr>
            <th className="lp-cas-kpi-header">
              KPIs <span className="lp-cas-sort-icon">◇</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {KPI_ROWS.map((row) => (
            <tr key={row.kpi} className="lp-cas-row">
              <td className="lp-cas-kpi-cell lp-cas-kpi-cell--full">
                {row.isExpandable && <span className="lp-cas-plus">+</span>}
                <span className={row.isExpandable ? "lp-cas-link" : undefined}>
                  {row.kpi}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="lp-capital-account">
      {/* TOP BAR */}
      <div className="lp-cas-topbar">
        <div className="lp-cas-period">
          <select
            className="lp-cas-quarter"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
          >
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          <button className="lp-cas-date-btn" type="button">
            <span className="lp-cas-date-arrow">→</span>
            <span>{asOfDate}</span>
          </button>
        </div>

        <div className="lp-cas-actions">
          <button
            className="lp-cas-notice-btn"
            type="button"
            onClick={() => setIsNoticeOpen(true)}
          >
            Notice
          </button>

          <div className="lp-cas-breakdown">
            <span className="lp-cas-breakdown-label">Breakdown :</span>
            <button
              type="button"
              className={
                "lp-cas-breakdown-pill" +
                (breakdown === "share-class"
                  ? " lp-cas-breakdown-pill--active"
                  : "")
              }
              onClick={() => setBreakdown("share-class")}
            >
              Share Class
            </button>
            <button
              type="button"
              className={
                "lp-cas-breakdown-pill" +
                (breakdown === "lps"
                  ? " lp-cas-breakdown-pill--active"
                  : "")
              }
              onClick={() => setBreakdown("lps")}
            >
              LPs
            </button>
          </div>

          {breakdown === "lps" && (
            <div className="lp-cas-lps-search">
              <span className="lp-cas-search-icon" />
              <input
                className="lp-cas-search-input"
                placeholder="Search by LP..."
              />
            </div>
          )}
        </div>
      </div>

      {/* TABLE AREA */}
      {breakdown === "share-class" ? renderShareClassTable() : renderLPsTable()}

      {/* NOTICES MODAL */}
      <NoticesModal
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
      />
    </section>
  );
}
