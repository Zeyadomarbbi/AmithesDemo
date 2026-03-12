import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector.jsx";
import { TimeframeProvider, useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import ElementSelector from "./components/ElementSelector.jsx";
import { PageSpinner, PageError } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
import { useCASKPIs } from "../../../../hooks/LPsStatement/useCASKPIs.js";
import { downloadCASAsWord } from "./utils/downloadCASAsWord.js";
import { DownloadIcon } from "../../../../../../components/Icons/InteractiveIcons.jsx";
import Toast from "../../../../components/Toast/Toast.jsx";
import CapitalAccountTable from "./components/CapitalAccountTable.jsx";
import "./CapitalAccountStatement.css";

function mapServiceData(d) {
  if (!d?.basic_kpis) return null;

  const k  = d.basic_kpis;
  const wp = k.waterfall_payments;

  const scKeys = d.share_classes
    ? Object.values(d.share_classes).map((sc) => sc.name)
    : Object.keys(k.commitment.by_share_class);

  const val = (metric, sc) => {
    const bysc = k[metric]?.by_share_class ?? {};
    return sc ? (bysc[sc] ?? null) : (k[metric]?.total ?? null);
  };

  const irrVal = (sc) => {
    if (!d.irr) return null;
    return sc ? (d.irr.by_share_class?.[sc] ?? null) : (d.irr.fund_irr ?? null);
  };

  const lpKpis = d.lp_kpis ?? {};
  const lpVal = (lpId, metric) => lpKpis[lpId]?.[metric] ?? null;
  const lpIds = Object.keys(lpKpis).map(String);

  const buildAllValues = (scGetter, lpGetter) => {
    const values = { total: scGetter(null) };
    scKeys.forEach((sc) => { values[sc] = scGetter(sc); });
    lpIds.forEach((lpId) => { values[lpId] = lpGetter(lpId); });
    return values;
  };

  const kpiRows = [
    { kpi: "Commitment",        values: buildAllValues((sc) => val("commitment", sc),        (id) => lpVal(id, "commitment")) },
    { kpi: "Capital called",    values: buildAllValues((sc) => val("capital_called", sc),    (id) => lpVal(id, "capital_called")) },
    { kpi: "Undrawn",           values: buildAllValues((sc) => val("undrawn", sc),           (id) => lpVal(id, "undrawn")) },
    { kpi: "Distributed",       values: buildAllValues((sc) => val("distributed", sc),      (id) => lpVal(id, "distributed")) },
    { kpi: "NAV",               values: buildAllValues((sc) => val("nav", sc),               (id) => lpVal(id, "nav")) },
    { kpi: "NAV per share", isExpandable: true,
                                values: buildAllValues((sc) => val("nav_per_share", sc),     (_) => null) },
    { kpi: "IRR", suffix: "%",  values: buildAllValues(irrVal,                              (_) => null) },
    { kpi: "TVPI", suffix: "x", values: buildAllValues((sc) => val("tvpi", sc),             (id) => lpVal(id, "tvpi")) },
    { kpi: "RVPI", suffix: "x", values: buildAllValues((sc) => val("rvpi", sc),             (id) => lpVal(id, "rvpi")) },
    { kpi: "DPI",  suffix: "x", values: buildAllValues((sc) => val("dpi", sc),              (id) => lpVal(id, "dpi")) },
    { kpi: "Number of shares",  values: buildAllValues((sc) => val("shares", sc),           (_) => null) },
    { kpi: "% Called",    suffix: "%", values: buildAllValues((sc) => val("pct_called", sc),      (id) => lpVal(id, "pct_called")) },
    { kpi: "% Distributed", suffix: "%", values: buildAllValues((sc) => val("pct_distributed", sc), (id) => lpVal(id, "pct_distributed")) },
  ];

  const navDetails = [
    ...scKeys.map((sc) => ({
      label:   sc,
      nominal: wp.nominal_repayment.by_sc[sc] ?? null,
      hurdle:  wp.hurdle.by_sc[sc]            ?? null,
      catchup: wp.catchup.by_sc[sc]           ?? null,
      special: wp.special_return.by_sc[sc]    ?? null,
    })),
    {
      label:   "Fund",
      nominal: Object.values(wp.nominal_repayment.by_sc).reduce((a, b) => a + b, 0),
      hurdle:  Object.values(wp.hurdle.by_sc).reduce((a, b) => a + b, 0),
      catchup: Object.values(wp.catchup.by_sc).reduce((a, b) => a + b, 0),
      special: Object.values(wp.special_return.by_sc).reduce((a, b) => a + b, 0),
    },
  ];

  return { kpiRows, navDetails, scKeys, lpKpis };
}

function CapitalAccountStatementContent() {
  const { fundId }   = useOutletContext();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { quarters } = useTimeframeContext();

  const [sortConfig, setSortConfig]         = useState({ key: null, direction: "asc" });
  const [selectedElements, setSelectedElements] = useState([]);
  const [isSaving, setIsSaving]             = useState(false);
  const [toast, setToast]                   = useState(null);
  const [adjustedNavValues, setAdjustedNavValues] = useState({});
  const [breakdownMode, setBreakdownMode]   = useState("shareclass");

  const selectedTimeframeIds = useMemo(() => {
    const qp = new URLSearchParams(location.search);
    return qp.get("timeframes")?.split(",").map(Number).filter((id) => !isNaN(id)) || [];
  }, [location.search]);

  const { data: casData, isLoading: casLoading, isError, saveAdjustedNav } = useCASKPIs(fundId, selectedTimeframeIds[0]);

  const mapped = useMemo(() => mapServiceData(casData), [casData]);

  const columns = useMemo(() => {
    const totalColumn = { key: "total", label: "Total", isTotal: true };
    if (breakdownMode === "lp") return [totalColumn];
    const scColumns = Object.values(casData?.share_classes ?? {}).map((sc) => ({
      key:   sc.name,
      label: sc.name,
      type:  "sc",
    }));
    return [totalColumn, ...scColumns];
  }, [casData, breakdownMode]);

  const setTimeframesInUrl = (ids) => {
    const qp      = new URLSearchParams(location.search);
    const cleaned = (Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite);
    if (cleaned.length === 0) qp.delete("timeframes");
    else qp.set("timeframes", cleaned.join(","));
    navigate({ search: qp.toString() }, { replace: true });
  };

  useEffect(() => {
    if (casData?.adjusted_nav) setAdjustedNavValues(casData.adjusted_nav);
  }, [casData]);

  useEffect(() => {
    setSelectedElements(columns.map((c) => c.key));
  }, [columns]);

  useEffect(() => {
    if (selectedTimeframeIds.length === 0 && quarters?.length > 0) {
      const latest = [...quarters].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      setTimeframesInUrl([latest.id]);
    }
  }, [selectedTimeframeIds.length, quarters]);

  const handleToggleTimeframe = (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    setTimeframesInUrl(selectedTimeframeIds.includes(numId) ? [] : [numId]);
  };

  const handleToggleElement = (key) => {
    setSelectedElements((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const parseCellNumber = (raw) => {
    if (raw == null) return null;
    const cleaned = String(raw).trim().replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const sortedKpiRows = useMemo(() => {
    const sourceData = mapped?.kpiRows;
    if (!sourceData) return [];
    if (!sortConfig.key) return sourceData;
    const dir     = sortConfig.direction === "desc" ? -1 : 1;
    const { key } = sortConfig;
    return [...sourceData].sort((a, b) => {
      if (key === "kpi") return a.kpi.localeCompare(b.kpi) * dir;
      const aVal = parseCellNumber(a?.values?.[key]);
      const bVal = parseCellNumber(b?.values?.[key]);
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * dir;
    });
  }, [sortConfig, mapped]);

  const visibleColumns = useMemo(() => {
    if (!columns) return [];
    if (selectedElements.length === 0) return columns;
    return columns
      .filter((c) => selectedElements.includes(c.key))
      .sort((a, b) => (a.isTotal ? -1 : b.isTotal ? 1 : 0));
  }, [columns, selectedElements]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAdjustedNav(adjustedNavValues);
      setToast({ type: "success", title: "Saved", message: "Adjusted NAV has been saved." });
    } catch (err) {
      setToast({ type: "error", title: "Error", message: "Failed to save Adjusted NAV." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    downloadCASAsWord({
      rows: sortedKpiRows,
      columns: visibleColumns,
      adjustedNavValues,
      timeframeLabel: quarters?.find((q) => Number(q.id) === selectedTimeframeIds[0])?.display_label ?? "",
    });
  };

  return (
    <section className="lp-capital-account">
      <div className="lp-cas-topbar">
        <div className="lp-cas-period">
          <TimeframeSelector
            selected={selectedTimeframeIds[0]}
            onChange={handleToggleTimeframe}
            isSingle={true}
          />
        </div>
        <div className="lp-cas-topbar-right">
          <div className="lp-cas-breakdown-wrapper">
            <span className="lp-cas-breakdown-label">Breakdown :</span>
            <div className="lp-cas-mode-switch">
              <button
                className={`lp-cas-mode-btn ${breakdownMode === "shareclass" ? "active" : ""}`}
                onClick={() => setBreakdownMode("shareclass")}
              >
                Share Class
              </button>
              <button
                className={`lp-cas-mode-btn ${breakdownMode === "lp" ? "active" : ""}`}
                onClick={() => setBreakdownMode("lp")}
              >
                LP
              </button>
            </div>
          </div>
          <button className="lp-cas-btn-download" onClick={handleDownload}>
            <DownloadIcon />
            Download
          </button>
          <ElementSelector
            options={columns.map((col) => ({ key: col.key, label: col.label }))}
            selected={selectedElements}
            onChange={handleToggleElement}
          />
        </div>
      </div>

      {casLoading ? (
        <PageSpinner label="Loading statement data..." />
      ) : isError ? (
        <PageError message="There was an error fetching the Capital Account Statement. Please try again later." />
      ) : (
        <CapitalAccountTable
          columns={visibleColumns}
          data={sortedKpiRows}
          navDetails={mapped?.navDetails ?? []}
          isLoading={casLoading}
          isError={isError}
          adjustedNavValues={adjustedNavValues}
          setAdjustedNavValues={setAdjustedNavValues}
          onSaveAdjustedNav={null}
          onSort={(key) =>
            setSortConfig((prev) => ({
              key,
              direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
            }))
          }
        />
      )}

      <div className="fund-identity-footer">
        <div className="fund-identity-actions">
          <button className="fund-identity-btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}

export default function CapitalAccountStatement() {
  const { fundId } = useOutletContext();
  return (
    <TimeframeProvider fundId={fundId}>
      <CapitalAccountStatementContent />
    </TimeframeProvider>
  );
}