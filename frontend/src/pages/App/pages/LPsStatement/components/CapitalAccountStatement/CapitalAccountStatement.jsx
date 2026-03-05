import React, { useMemo, useState, useEffect  } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector.jsx";
import ElementSelector from "./components/ElementSelector.jsx";
import { PageSpinner, PageError } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
import { useTimeframes, saveNewTimeframe } from "../../../../hooks/Core/useTimeframes.jsx";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useCASKPIs } from "../../../../hooks/LPsStatement/useCASKPIs.js";
import { downloadCASAsWord } from "./utils/downloadCASAsWord.js";
import Toast from "../../../../components/Toast/Toast.jsx";
import CapitalAccountTable from "./components/CapitalAccountTable.jsx";
import "./CapitalAccountStatement.css";

export const DownloadIcon = (props) => (
  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.29936 1.69679C6.16008 1.73311 6.0225 1.80037 5.70328 1.9669C3.30261 3.21921 1.66667 5.72987 1.66667 8.62127C1.66667 12.7634 5.02453 16.1213 9.16667 16.1213C13.3088 16.1213 16.6667 12.7634 16.6667 8.62127C16.6667 5.84626 15.16 3.42217 12.9161 2.12412C12.5177 1.89367 12.3815 1.3839 12.612 0.985513C12.8424 0.587128 13.3522 0.450993 13.7506 0.681446C16.4884 2.26515 18.3333 5.22726 18.3333 8.62127C18.3333 13.6839 14.2293 17.7879 9.16667 17.7879C4.10406 17.7879 0 13.6839 0 8.62127C0 5.08473 2.00294 2.01738 4.93244 0.489202C4.94468 0.482814 4.95699 0.476385 4.96936 0.469924C5.23865 0.329256 5.53785 0.172966 5.87879 0.0840571C6.26207 -0.0158958 6.64892 -0.0220444 7.1142 0.0409938C7.54125 0.0988535 8.00645 0.316303 8.369 0.536092C8.73155 0.755881 9.1395 1.06776 9.38831 1.41963C10.0016 2.28697 10.0009 3.11662 10.0001 4.16745C10 4.20729 10 4.24745 10 4.28793V9.94275L11.9107 8.03201C12.2362 7.70657 12.7638 7.70657 13.0893 8.03201C13.4147 8.35745 13.4147 8.88508 13.0893 9.21052L9.75592 12.5439C9.43049 12.8693 8.90285 12.8693 8.57741 12.5439L5.24408 9.21052C4.91864 8.88508 4.91864 8.35745 5.24408 8.03201C5.56951 7.70657 6.09715 7.70657 6.42259 8.03201L8.33333 9.94275V4.28793C8.33333 3.07855 8.30846 2.77924 8.02749 2.38189C7.97149 2.3027 7.78823 2.13303 7.50498 1.96131C7.22174 1.7896 6.98655 1.70559 6.89043 1.69257C6.5683 1.64893 6.41194 1.66743 6.29936 1.69679Z" fill="#375A89"/>
  </svg>
);

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

  // Build LP values lookup
  const lpKpis = d.lp_kpis ?? {};
  const lpVal = (lpId, metric) => lpKpis[lpId]?.[metric] ?? null;

  // All column keys: total + scKeys + lpIds
  const lpIds = Object.keys(lpKpis).map(String);
  const allKeys = [null, ...scKeys, ...lpIds]; // null = total

  const buildAllValues = (scGetter, lpGetter) => {
    const values = { total: scGetter(null) };
    scKeys.forEach((sc) => { values[sc] = scGetter(sc); });
    lpIds.forEach((lpId) => { values[lpId] = lpGetter(lpId); });
    return values;
  };

  const kpiRows = [
    { kpi: "Commitment",       values: buildAllValues((sc) => val("commitment", sc),      (id) => lpVal(id, "commitment")) },
    { kpi: "Capital called",   values: buildAllValues((sc) => val("capital_called", sc),  (id) => lpVal(id, "capital_called")) },
    { kpi: "Undrawn",          values: buildAllValues((sc) => val("undrawn", sc),          (id) => lpVal(id, "undrawn")) },
    { kpi: "Distributed",      values: buildAllValues((sc) => val("distributed", sc),     (id) => lpVal(id, "distributed")) },
    { kpi: "NAV",              values: buildAllValues((sc) => val("nav", sc),              (id) => lpVal(id, "nav")) },
    { kpi: "NAV per share", isExpandable: true,
                               values: buildAllValues((sc) => val("nav_per_share", sc),   (_) => null) },
    { kpi: "IRR", suffix: "%", values: buildAllValues(irrVal,                             (_) => null) },
    { kpi: "TVPI", suffix: "x", values: buildAllValues((sc) => val("tvpi", sc),           (id) => lpVal(id, "tvpi")) },
    { kpi: "RVPI", suffix: "x", values: buildAllValues((sc) => val("rvpi", sc),           (id) => lpVal(id, "rvpi")) },
    { kpi: "DPI",  suffix: "x", values: buildAllValues((sc) => val("dpi", sc),            (id) => lpVal(id, "dpi")) },
    { kpi: "Number of shares", values: buildAllValues((sc) => val("shares", sc),          (_) => null) },
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

export default function CapitalAccountStatement() {
  const { fundId }    = useOutletContext();
  const navigate      = useNavigate();
  const location      = useLocation();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { quarters, isLoading: quartersLoading, setQuarters } = useTimeframes(fundId);
  const { data: shareClassesData, isLoading: scLoading } = useShareClasses(fundId);
  const [selectedElements, setSelectedElements] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [adjustedNavValues, setAdjustedNavValues] = useState({});

  const selectedTimeframeIds = useMemo(() => {
    const qp = new URLSearchParams(location.search);
      return qp.get("timeframes")?.split(",").map(Number).filter((id) => !isNaN(id)) || [];
  }, [location.search]);

  const { data: casData, isLoading: casLoading, isError, saveAdjustedNav } = useCASKPIs(fundId, selectedTimeframeIds[0]);

  const mapped = useMemo(() => mapServiceData(casData), [casData]);
  // Thats the full one
  // const columns = useMemo(() => {
  //   const totalColumn = { key: "total", label: "Total", isTotal: true };
  //   const scColumns = (shareClassesData ?? []).map((sc) => ({
  //     key:   sc.share_class_name,
  //     label: sc.share_class_name,
  //     type:  "sc",
  //   }));
  //   const lpKpis = casData?.lp_kpis ?? {};
  //   const lpColumns = Object.entries(lpKpis).map(([lpId, lp]) => ({
  //     key:   String(lpId),
  //     label: `${lp.name} (${lp.share_class})`,
  //     type:  "lp",
  //   }));
  //   return [totalColumn, ...scColumns, ...lpColumns];
  // }, [shareClassesData, casData]);

  const columns = useMemo(() => {
    const totalColumn = { key: "total", label: "Total", isTotal: true };
    const scColumns = (shareClassesData ?? []).map((sc) => ({
      key:   sc.share_class_name,
      label: sc.share_class_name,
      type:  "sc",
    }));
    // LP columns — hidden for now
    // const lpKpis = casData?.lp_kpis ?? {};
    // const lpColumns = Object.entries(lpKpis).map(([lpId, lp]) => ({
    //   key:   String(lpId),
    //   label: `${lp.name} (${lp.share_class})`,
    //   type:  "lp",
    // }));
    // return [totalColumn, ...scColumns, ...lpColumns];
    return [totalColumn, ...scColumns];
  }, [shareClassesData, casData]);

  const setTimeframesInUrl = (ids) => {
    const qp      = new URLSearchParams(location.search);
    const cleaned = (Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite);
    if (cleaned.length === 0) qp.delete("timeframes");
    else qp.set("timeframes", cleaned.join(","));
    navigate({ search: qp.toString() }, { replace: true });
  };

  useEffect(() => {
    if (casData?.adjusted_nav) {
      setAdjustedNavValues(casData.adjusted_nav);
    }
  }, [casData]);

  useEffect(() => {
    if (columns.length > 0 && selectedElements.length === 0) {
      setSelectedElements(columns.map((c) => c.key));
    }
  }, [columns]);

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

  const handleSaveNew = async (newTimeframe) => {
    try {
      const formatted = await saveNewTimeframe(fundId, newTimeframe);
      setQuarters((prev) => [...(Array.isArray(prev) ? prev : []), formatted]);
      setTimeframesInUrl([Number(formatted.id)]);
    } catch (error) {
      console.error("CapitalAccountStatement: timeframe save error:", error);
    }
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

    const dir      = sortConfig.direction === "desc" ? -1 : 1;
    const { key }  = sortConfig;
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

  React.useEffect(() => {
    if (selectedTimeframeIds.length === 0 && quarters?.length > 0) {
      const latest = [...quarters].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      setTimeframesInUrl([latest.id]);
    }
  }, [selectedTimeframeIds.length, quarters]);

  const visibleColumns = useMemo(() => {
    if (!columns) return [];
    if (selectedElements.length === 0) return columns; // show all
    return columns.filter((c) => selectedElements.includes(c.key))
      .sort((a, b) => (a.isTotal ? -1 : b.isTotal ? 1 : 0)); // total always first
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

  const isLoading = scLoading || casLoading;

  return (
    <section className="lp-capital-account">
      <div className="lp-cas-topbar">
        <div className="lp-cas-period">
          <QuarterSelector
            options={quarters}
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            onSaveNew={handleSaveNew}
            isLoading={quartersLoading}
            isSingle={true}
          />
        </div>
        <div className="lp-cas-topbar-right">
          <button
            className="lp-cas-btn-download"
            onClick={handleDownload}
          >
            <DownloadIcon />
            Download
          </button>
          <ElementSelector
            options={columns.map((col) => ({
              key:   col.key,
              label: col.label,
            }))}
            selected={selectedElements}
            onChange={handleToggleElement}
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner label="Loading statement data..." />
      ) : isError ? (
        <PageError message="There was an error fetching the Capital Account Statement. Please try again later." />
      ) : (
        <CapitalAccountTable
          columns={visibleColumns}
          data={sortedKpiRows}
          navDetails={mapped?.navDetails ?? []}
          isLoading={isLoading}
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
          <button
            className="fund-identity-btn-save"
            onClick={handleSave}
            disabled={isSaving}
          >
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