// frontend/src/pages/App/pages/LPsStatement/components/CapitalAccount/CapitalAccountStatement.jsx
import React, { useMemo, useState } from "react";
import NoticesModal from "./components/NoticesModal.jsx";
import "./CapitalAccountStatement.css";
import { SortIcon, PlusIcon, MinusIcon } from "../../Icons.jsx";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector.jsx";
import SearchBox from "../../../../../../components/SearchBox/SearchBox.jsx";

/* ---------- simple down chevron for the filter box ---------- */
const DownChevronIcon = () => (
  <svg width="16" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 1.25L4 3.75L7 1.25"
      stroke="#375A89"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
    values: { total: "100 000 000", a1: "60 000 000", a2: "10 000 000", a3: "29 000 000", b: "1 000 000" },
  },
  {
    kpi: "Capital called",
    values: { total: "50 685 457", a1: "30 568 475", a2: "5 478 210", a3: "14 685 632", b: "510 023" },
  },
  {
    kpi: "Undrawn",
    values: { total: "49 415 362", a1: "29 874 254", a2: "4 685 741", a3: "14 456 002", b: "490 658" },
  },
  {
    kpi: "Distributed",
    values: { total: "20 547 852", a1: "12 658 742", a2: "2 054 785", a3: "6 354 125", b: "205 478" },
  },
  {
    kpi: "NAV",
    values: { total: "61 458 525", a1: "36 547 852", a2: "6 145 852", a3: "18 658 003", b: "614 585" },
  },
  {
    kpi: "NAV per share",
    isExpandable: true,
    values: { total: "-", a1: "547.87", a2: "2 180.56", a3: "2 180.56", b: "5 218.68" },
  },
  { kpi: "TVPI", suffix: "x", values: { total: "0.21", a1: "0.21", a2: "0.21", a3: "0.21", b: "0.21" } },
  { kpi: "RVPI", suffix: "x", values: { total: "1.12", a1: "1.12", a2: "1.12", a3: "1.12", b: "1.12" } },
  { kpi: "DPI", suffix: "x", values: { total: "1.33", a1: "1.33", a2: "1.33", a3: "1.33", b: "1.33" } },
  {
    kpi: "Number of shares",
    values: { total: "100 000", a1: "60 000", a2: "10 000", a3: "29 000 000", b: "1 000" },
  },
  { kpi: "% Called", suffix: "%", values: { total: "50.08", a1: "50.08", a2: "50.08", a3: "50.08", b: "50.08" } },
  { kpi: "% Distributed", suffix: "%", values: { total: "20.07", a1: "20.07", a2: "20.07", a3: "20.07", b: "20.07" } },
];

export default function CapitalAccountStatement() {
  const [breakdown, setBreakdown] = useState("share-class");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAdjustedOpen, setIsAdjustedOpen] = useState(false);

  // ✅ QuarterSelector value
  const [selectedPeriod, setSelectedPeriod] = useState("Q2-2024");
  const [searchTerm, setSearchTerm] = useState("");


  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleHeaderSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const parseCellNumber = (raw) => {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (!s || s === "-") return null;
    const cleaned = s.replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const sortedKpiRows = useMemo(() => {
    if (!sortConfig.key) return KPI_ROWS;

    const dir = sortConfig.direction === "desc" ? -1 : 1;
    const key = sortConfig.key;

    const arr = [...KPI_ROWS];
    arr.sort((a, b) => {
      if (key === "kpi") return a.kpi.localeCompare(b.kpi) * dir;

      const aVal = parseCellNumber(a?.values?.[key]);
      const bVal = parseCellNumber(b?.values?.[key]);

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

    return arr;
  }, [sortConfig]);

  const renderShareClassTable = () => (
    <div className="lp-cas-table-wrapper">
      <table className="lp-cas-table">
        <thead>
          <tr>
            <th className="lp-cas-kpi-header" onClick={() => handleHeaderSort("kpi")} style={{ cursor: "pointer" }}>
              <span>KPIs</span>
              <span className="lp-cas-sort-icon"><SortIcon /></span>
            </th>

            {SHARE_CLASSES.map((col) => (
              <th
                key={col.key}
                className="lp-cas-header-cell"
                onClick={() => handleHeaderSort(col.key)}
                style={{ cursor: "pointer" }}
              >
                <span>{col.label}</span>
                <span className="lp-cas-sort-icon"><SortIcon /></span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedKpiRows.map((row) => {
            const isNavPerShareRow = row.kpi === "NAV per share";
            const isNavRow = row.kpi === "NAV";

            return (
              <React.Fragment key={row.kpi}>
                <tr
                  className={
                    "lp-cas-row" +
                    ((row.isExpandable || isNavRow) ? " lp-cas-row--expandable" : "") +
                    (isNavPerShareRow && isNavOpen ? " lp-cas-row--open" : "") +
                    (isNavRow && isAdjustedOpen ? " lp-cas-row--open" : "")
                  }
                  onClick={
                    isNavPerShareRow ? () => setIsNavOpen((p) => !p)
                    : isNavRow ? () => setIsAdjustedOpen((p) => !p)
                    : undefined
                  }
                >
                  <td className="lp-cas-kpi-cell">
                    {isNavPerShareRow && (
                      <button
                        type="button"
                        className="lp-cas-expand-btn"
                        onClick={(e) => { e.stopPropagation(); setIsNavOpen((p) => !p); }}
                      >
                        <span className="lp-cas-plus-icon">{isNavOpen ? <MinusIcon /> : <PlusIcon />}</span>
                      </button>
                    )}

                    {isNavRow && (
                      <button
                        type="button"
                        className="lp-cas-expand-btn"
                        onClick={(e) => { e.stopPropagation(); setIsAdjustedOpen((p) => !p); }}
                      >
                        <span className="lp-cas-plus-icon">{isAdjustedOpen ? <MinusIcon /> : <PlusIcon />}</span>
                      </button>
                    )}

                    <span>{row.kpi}</span>
                  </td>

                  {SHARE_CLASSES.map((col) => {
                    const raw = row.values[col.key];
                    const value = raw
                      ? row.suffix === "x" ? `${raw}x`
                      : row.suffix === "%" ? `${raw}%`
                      : raw
                      : "-";

                    return (
                      <td key={col.key} className="lp-cas-value-cell">{value}</td>
                    );
                  })}
                </tr>

                {isNavRow && isAdjustedOpen && (
                  <tr className="lp-cas-adjusted-row">
                    <td className="lp-cas-kpi-cell"><span>Adjusted NAV</span></td>
                    {SHARE_CLASSES.map((col) => (
                      <td key={col.key} className="lp-cas-value-cell">-</td>
                    ))}
                  </tr>
                )}

                {isNavPerShareRow && isNavOpen && (
                  <tr className="lp-cas-nav-details-row">
                    <td colSpan={SHARE_CLASSES.length + 1}>
                      <div className="lp-cas-nav-details">
                        <div className="lp-cas-nav-details-inner">
                          <table className="lp-cas-nav-details-table">
                            <thead>
                              <tr>
                                <th className="lp-cas-nav-th lp-cas-nav-th--first"></th>
                                <th className="lp-cas-nav-th">Nominal <span className="lp-cas-nav-th-euro">(€)</span></th>
                                <th className="lp-cas-nav-th">Hurdle <span className="lp-cas-nav-th-euro">(€)</span></th>
                                <th className="lp-cas-nav-th">Catch-up <span className="lp-cas-nav-th-euro">(€)</span></th>
                                <th className="lp-cas-nav-th">Special return <span className="lp-cas-nav-th-euro">(€)</span></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">Shares A1</td>
                                <td className="lp-cas-nav-td">30 000 000</td>
                                <td className="lp-cas-nav-td">7 575 758</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">12 000 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">Shares A2</td>
                                <td className="lp-cas-nav-td">40 000 000</td>
                                <td className="lp-cas-nav-td">10 101 010</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">16 000 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">Shares A3</td>
                                <td className="lp-cas-nav-td">29 000 000</td>
                                <td className="lp-cas-nav-td">7 323 232</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">11 600 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">Shares B</td>
                                <td className="lp-cas-nav-td">1 000 000</td>
                                <td className="lp-cas-nav-td">-</td>
                                <td className="lp-cas-nav-td">6 250 000</td>
                                <td className="lp-cas-nav-td">10 400 000</td>
                              </tr>
                              <tr>
                                <td className="lp-cas-nav-td lp-cas-nav-td--label">Fund</td>
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
              <span className="lp-cas-sort-icon"><SortIcon /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {KPI_ROWS.map((row) => (
            <tr key={row.kpi} className="lp-cas-row">
              <td className="lp-cas-kpi-cell lp-cas-kpi-cell--full">
                <span className={row.isExpandable ? "lp-cas-link" : undefined}>{row.kpi}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="lp-capital-account">
      <div className="lp-cas-topbar">
        <div className="lp-cas-period">
          {/* ✅ quarter selector instead of hardcoded button */}
          <QuarterSelector selected={selectedPeriod} onChange={setSelectedPeriod} isSingle />
        </div>

        <div className="lp-cas-actions">
          <button className="lp-cas-notice-btn" type="button" onClick={() => setIsNoticeOpen(true)}>
            Notice
          </button>

          <div className={"lp-cas-breakdown-block" + (breakdown === "lps" ? " lp-cas-breakdown-block--lps" : "")}>
            <div className="lp-cas-breakdown">
              <span className="lp-cas-breakdown-label">Breakdown :</span>

              <div className="lp-cas-breakdown-tabs">
                <button
                  type="button"
                  className={"lp-cas-breakdown-tab" + (breakdown === "share-class" ? " lp-cas-breakdown-tab--active" : "")}
                  onClick={() => setBreakdown("share-class")}
                >
                  Share Class
                </button>
                <button
                  type="button"
                  className={"lp-cas-breakdown-tab" + (breakdown === "lps" ? " lp-cas-breakdown-tab--active" : "")}
                  onClick={() => setBreakdown("lps")}
                >
                  LPs
                </button>
              </div>
            </div>

            {breakdown === "lps" && (
  <div className="lp-cas-lps-search lp-cas-lps-search--under">
    <SearchBox
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search by LP..."
    />
  </div>
)}
          </div>
        </div>
      </div>

      {breakdown === "share-class" ? renderShareClassTable() : renderLPsTable()}

      <NoticesModal isOpen={isNoticeOpen} onClose={() => setIsNoticeOpen(false)} />
    </section>
  );
}
