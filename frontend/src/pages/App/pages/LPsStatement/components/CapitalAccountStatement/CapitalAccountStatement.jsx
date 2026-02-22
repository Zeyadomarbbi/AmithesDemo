import React, { useMemo, useState } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import NoticesModal from "./components/NoticesModal.jsx";
import "./CapitalAccountStatement.css";
import { SortIcon, PlusIcon, MinusIcon } from "../../Icons.jsx";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector.jsx";
import { useTimeframes, saveNewTimeframe } from "../../../../hooks/Core/useTimeframes.jsx";

const MOCK_DATA = {
  shareClasses: [
    { key: "total", label: "Total (€)" },
    { key: "a1", label: "Share class A1 (€)" },
    { key: "a2", label: "Share class A2 (€)" },
    { key: "a3", label: "Share class A3 (€)" },
    { key: "b", label: "Share class B (€)" },
  ],
  kpiRows: [
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
  ],
  navDetails: [
    { label: "Shares A1", nominal: "30 000 000", hurdle: "7 575 758", catchup: "-", special: "12 000 000" },
    { label: "Shares A2", nominal: "40 000 000", hurdle: "10 101 010", catchup: "-", special: "16 000 000" },
    { label: "Shares A3", nominal: "29 000 000", hurdle: "7 323 232", catchup: "-", special: "11 600 000" },
    { label: "Shares B", nominal: "1 000 000", hurdle: "-", catchup: "6 250 000", special: "10 400 000" },
    { label: "Fund", nominal: "100 000 000", hurdle: "25 000 000", catchup: "6 250 000", special: "50 000 000" },
  ],
};

export default function CapitalAccountStatement() {
  const { fundId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAdjustedOpen, setIsAdjustedOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);

  const selectedTimeframeIds = useMemo(() => {
    const qp = new URLSearchParams(location.search);
    return (
      qp.get("timeframes")
        ?.split(",")
        .map(Number)
        .filter((id) => !isNaN(id)) || []
    );
  }, [location.search]);

  const setTimeframesInUrl = (ids) => {
    const qp = new URLSearchParams(location.search);
    const cleaned = (Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite);
    if (cleaned.length === 0) qp.delete("timeframes");
    else qp.set("timeframes", cleaned.join(","));
    navigate({ search: qp.toString() }, { replace: true });
  };

  const handleToggleTimeframe = (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    
    if (selectedTimeframeIds.includes(numId)) {
      setTimeframesInUrl([]);
    } else {
      setTimeframesInUrl([numId]);
    }
  };

  const handleSaveNew = async (newTimeframe) => {
    try {
      const formatted = await saveNewTimeframe(fundId, newTimeframe);
      setQuarters((prev) => [...(Array.isArray(prev) ? prev : []), formatted]);
      setTimeframesInUrl([Number(formatted.id)]);
    } catch (error) {
      console.error("CapitalAccountStatement: timeframe save error:", error);
    }
  };

  const handleHeaderSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const parseCellNumber = (raw) => {
    if (raw == null) return null;
    const cleaned = String(raw).trim().replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const sortedKpiRows = useMemo(() => {
    if (!sortConfig.key) return MOCK_DATA.kpiRows;
    const dir = sortConfig.direction === "desc" ? -1 : 1;
    const { key } = sortConfig;
    return [...MOCK_DATA.kpiRows].sort((a, b) => {
      if (key === "kpi") return a.kpi.localeCompare(b.kpi) * dir;
      const aVal = parseCellNumber(a?.values?.[key]);
      const bVal = parseCellNumber(b?.values?.[key]);
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * dir;
    });
  }, [sortConfig]);

  return (
    <section className="lp-capital-account">
      <div className="lp-cas-topbar">
        <div className="lp-cas-period">
          <QuarterSelector
            options={quarters}
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            onSaveNew={handleSaveNew}
            isLoading={isLoading}
            isSingle={true}
          />
        </div>
        <div className="lp-cas-actions">
          <button className="lp-cas-notice-btn" type="button" onClick={() => setIsNoticeOpen(true)}>
            Notice
          </button>
        </div>
      </div>

      <div className="lp-cas-table-wrapper">
        <table className="lp-cas-table">
          <thead>
            <tr>
              <th className="lp-cas-kpi-header" onClick={() => handleHeaderSort("kpi")} style={{ cursor: "pointer" }}>
                <span>KPIs</span>
                <span className="lp-cas-sort-icon"><SortIcon /></span>
              </th>
              {MOCK_DATA.shareClasses.map((col) => (
                <th key={col.key} className="lp-cas-header-cell" onClick={() => handleHeaderSort(col.key)} style={{ cursor: "pointer" }}>
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
                      {(isNavPerShareRow || isNavRow) && (
                        <button
                          type="button"
                          className="lp-cas-expand-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isNavPerShareRow) setIsNavOpen((p) => !p);
                            if (isNavRow) setIsAdjustedOpen((p) => !p);
                          }}
                        >
                          <span className="lp-cas-plus-icon">
                            {(isNavPerShareRow ? isNavOpen : isAdjustedOpen) ? <MinusIcon /> : <PlusIcon />}
                          </span>
                        </button>
                      )}
                      <span>{row.kpi}</span>
                    </td>

                    {MOCK_DATA.shareClasses.map((col) => {
                      const raw = row.values[col.key];
                      const value = raw
                        ? row.suffix === "x" ? `${raw}x`
                        : row.suffix === "%" ? `${raw}%`
                        : raw
                        : "-";
                      return <td key={col.key} className="lp-cas-value-cell">{value}</td>;
                    })}
                  </tr>

                  {isNavRow && isAdjustedOpen && (
                    <tr className="lp-cas-adjusted-row">
                      <td className="lp-cas-kpi-cell"><span>Adjusted NAV</span></td>
                      {MOCK_DATA.shareClasses.map((col) => (
                        <td key={col.key} className="lp-cas-value-cell">-</td>
                      ))}
                    </tr>
                  )}

                  {isNavPerShareRow && isNavOpen && (
                    <tr className="lp-cas-nav-details-row">
                      <td colSpan={MOCK_DATA.shareClasses.length + 1}>
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
                                {MOCK_DATA.navDetails.map((r) => (
                                  <tr key={r.label}>
                                    <td className="lp-cas-nav-td lp-cas-nav-td--label">{r.label}</td>
                                    <td className="lp-cas-nav-td">{r.nominal}</td>
                                    <td className="lp-cas-nav-td">{r.hurdle}</td>
                                    <td className="lp-cas-nav-td">{r.catchup}</td>
                                    <td className="lp-cas-nav-td">{r.special}</td>
                                  </tr>
                                ))}
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

      <NoticesModal isOpen={isNoticeOpen} onClose={() => setIsNoticeOpen(false)} />
    </section>
  );
}