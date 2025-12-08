// src/pages/App/pages/LPsStatement/components/CapitalAccountStatement.jsx
import React, { useState } from "react";
import NoticesModal from "./NoticesModal.jsx";
import "./capitalAccountStatement.css";

/* ---------- SVG sort icon used in table headers (double arrow) ---------- */
const SortIcon = () => (
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
);

/* ---------- simple down chevron for the filter box ---------- */
const DownChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 8 5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1.25L4 3.75L7 1.25"
      stroke="#375A89"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------- search magnifier using YOUR SVG path ---------- */
const SearchIconLp = () => (
  <svg
    width="16"
    height="16"
    viewBox="16 12 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M23.333 14.6654C20.7557 14.6654 18.6663 16.7547 18.6663 19.332C18.6663 21.9094 20.7557 23.9987 23.333 23.9987C24.5903 23.9987 25.7315 23.5015 26.5706 22.693C26.5881 22.6701 26.6074 22.6482 26.6283 22.6273C26.6492 22.6064 26.6711 22.5872 26.6939 22.5696C27.5025 21.7305 27.9997 20.5893 27.9997 19.332C27.9997 16.7547 25.9103 14.6654 23.333 14.6654ZM28.0209 23.0772C28.842 22.0507 29.333 20.7487 29.333 19.332C29.333 16.0183 26.6467 13.332 23.333 13.332C20.0193 13.332 17.333 16.0183 17.333 19.332C17.333 22.6457 20.0193 25.332 23.333 25.332C24.7497 25.332 26.0517 24.841 27.0781 24.02L29.5283 26.4701C29.7886 26.7305 30.2107 26.7305 30.4711 26.4701C30.7314 26.2098 30.7314 25.7876 30.4711 25.5273L28.0209 23.0772Z"
      fill="#375A89"
    />
  </svg>
);

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
  const [breakdown, setBreakdown] = useState("share-class");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  // NAV per share dropdown (existing)
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Adjusted NAV row (new) for NAV
  const [isAdjustedOpen, setIsAdjustedOpen] = useState(false);

  const renderShareClassTable = () => (
    <div className="lp-cas-table-wrapper">
      <table className="lp-cas-table">
        <thead>
          <tr>
            <th className="lp-cas-kpi-header">
              <span>KPIs</span>
              <span className="lp-cas-sort-icon">
                <SortIcon />
              </span>
            </th>
            {SHARE_CLASSES.map((col) => (
              <th key={col.key} className="lp-cas-header-cell">
                <span>{col.label}</span>
                <span className="lp-cas-sort-icon">
                  <SortIcon />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KPI_ROWS.map((row) => {
            const isNavPerShareRow = row.kpi === "NAV per share";
            const isNavRow = row.kpi === "NAV";

            return (
              <React.Fragment key={row.kpi}>
                <tr
                  className={
                    "lp-cas-row" +
                    ((row.isExpandable || isNavRow)
                      ? " lp-cas-row--expandable"
                      : "") +
                    (isNavPerShareRow && isNavOpen ? " lp-cas-row--open" : "") +
                    (isNavRow && isAdjustedOpen ? " lp-cas-row--open" : "")
                  }
                  onClick={
                    isNavPerShareRow
                      ? () => setIsNavOpen((prev) => !prev)
                      : isNavRow
                      ? () => setIsAdjustedOpen((prev) => !prev)
                      : undefined
                  }
                >
                  <td className="lp-cas-kpi-cell">
                    {/* plus for NAV per share */}
                    {isNavPerShareRow && (
                      <button
                        type="button"
                        className="lp-cas-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNavOpen((prev) => !prev);
                        }}
                      >
                        <span className="lp-cas-plus">
                          {isNavOpen ? "−" : "+"}
                        </span>
                      </button>
                    )}

                    {/* plus for NAV */}
                    {isNavRow && (
                      <button
                        type="button"
                        className="lp-cas-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAdjustedOpen((prev) => !prev);
                        }}
                      >
                        <span className="lp-cas-plus">
                          {isAdjustedOpen ? "−" : "+"}
                        </span>
                      </button>
                    )}

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

                {/* Adjusted NAV row under NAV – grey band, same columns */}
                {isNavRow && isAdjustedOpen && (
                  <tr className="lp-cas-adjusted-row">
                    <td className="lp-cas-kpi-cell">
                      <span>Adjusted NAV</span>
                    </td>
                    {SHARE_CLASSES.map((col) => (
                      <td key={col.key} className="lp-cas-value-cell">
                        -
                      </td>
                    ))}
                  </tr>
                )}

                {/* NAV per share dropdown – inner grey table */}
                {isNavPerShareRow && isNavOpen && (
                  <tr className="lp-cas-nav-details-row">
                    <td colSpan={SHARE_CLASSES.length + 1}>
                      <div className="lp-cas-nav-details">
                        <div className="lp-cas-nav-details-inner">
                          <table className="lp-cas-nav-details-table">
                            <thead>
                              <tr>
                                {/* empty header above "Shares ..." */}
                                <th className="lp-cas-nav-th lp-cas-nav-th--first"></th>
                                <th className="lp-cas-nav-th">
                                  Nominal{" "}
                                  <span className="lp-cas-nav-th-euro">(€)</span>
                                </th>
                                <th className="lp-cas-nav-th">
                                  Hurdle{" "}
                                  <span className="lp-cas-nav-th-euro">(€)</span>
                                </th>
                                <th className="lp-cas-nav-th">
                                  Catch-up{" "}
                                  <span className="lp-cas-nav-th-euro">(€)</span>
                                </th>
                                <th className="lp-cas-nav-th">
                                  Special return{" "}
                                  <span className="lp-cas-nav-th-euro">(€)</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">
                                  Shares A1
                                </td>
                                <td className="lp-cas-nav-td">30 000 000</td>
                                <td className="lp-cas-nav-td">7 575 758</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">12 000 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">
                                  Shares A2
                                </td>
                                <td className="lp-cas-nav-td">40 000 000</td>
                                <td className="lp-cas-nav-td">10 101 010</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">16 000 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">
                                  Shares A3
                                </td>
                                <td className="lp-cas-nav-td">29 000 000</td>
                                <td className="lp-cas-nav-td">7 323 232</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">11 600 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">
                                  Shares B
                                </td>
                                <td className="lp-cas-nav-td">1 000 000</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">6 250 000</td>
                                <td className="lp-cas-nav-td">10 400 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">
                                  Fund
                                </td>
                                <td className="lp-cas-nav-td">100 000 000</td>
                                <td className="lp-cas-nav-td">25 000 000</td>
                                <td className="lp-cas-nav-td">6 250 000</td>
                                <td className="lp-cas-nav-td">50 000 000</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
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
              <span>KPIs</span>
              <span className="lp-cas-sort-icon">
                <SortIcon />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {KPI_ROWS.map((row) => (
            <tr key={row.kpi} className="lp-cas-row">
              <td className="lp-cas-kpi-cell lp-cas-kpi-cell--full">
                {row.isExpandable && <span className="lp-cas-plus"></span>}
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
        {/* LEFT FILTER – ONE BOX LIKE FIGMA */}
        <div className="lp-cas-period">
          <button type="button" className="lp-cas-filter-btn">
            <span className="lp-cas-filter-text">Q2  → 08/07/26</span>
            <span className="lp-cas-filter-chevron" aria-hidden="true">
              <DownChevronIcon />
            </span>
          </button>
        </div>

        {/* RIGHT SIDE: notice + breakdown + (optional) search BELOW */}
        <div className="lp-cas-actions">
          <button
            className="lp-cas-notice-btn"
            type="button"
            onClick={() => setIsNoticeOpen(true)}
          >
            Notice
          </button>

          <div className="lp-cas-breakdown-block">
            <div className="lp-cas-breakdown">
              <span className="lp-cas-breakdown-label">Breakdown :</span>

              <div className="lp-cas-breakdown-tabs">
                <button
                  type="button"
                  className={
                    "lp-cas-breakdown-tab" +
                    (breakdown === "share-class"
                      ? " lp-cas-breakdown-tab--active"
                      : "")
                  }
                  onClick={() => setBreakdown("share-class")}
                >
                  Share Class
                </button>
                <button
                  type="button"
                  className={
                    "lp-cas-breakdown-tab" +
                    (breakdown === "lps"
                      ? " lp-cas-breakdown-tab--active"
                      : "")
                  }
                  onClick={() => setBreakdown("lps")}
                >
                  LPs
                </button>
              </div>
            </div>

            {breakdown === "lps" && (
              <div className="lp-cas-lps-search lp-cas-lps-search--under">
                <span className="lp-cas-search-icon-svg">
                  <SearchIconLp />
                </span>
                <input
                  className="lp-cas-search-input"
                  placeholder="Search by LP..."
                />
              </div>
            )}
          </div>
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
