import React, { useMemo, useState, useEffect  } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector.jsx";
import ElementSelector from "./components/ElementSelector.jsx";
import { PageSpinner, PageError } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";
import { useTimeframes, saveNewTimeframe } from "../../../../hooks/Core/useTimeframes.jsx";
import { useShareClasses } from "../../../../hooks/useShareClass.js";
import { useCASKPIs } from "../../../../hooks/LPsStatement/useCASKPIs.js";
import Toast from "../../../../components/Toast/Toast.jsx";
import CapitalAccountTable from "./components/CapitalAccountTable.jsx";
import "./CapitalAccountStatement.css";

function buildValues(scKeys, getter) {
  const values = { total: getter(null) };
  scKeys.forEach((sc) => { values[sc] = getter(sc); });
  return values;
}

function mapServiceData(d) {
  if (!d?.basic_kpis) return null;

  const k  = d.basic_kpis;
  const wp = k.waterfall_payments;

  // Use all fund share classes, not just those with commitments
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

  const kpiRows = [
    { kpi: "Commitment",       values: buildValues(scKeys, (sc) => val("commitment",       sc)) },
    { kpi: "Capital called",   values: buildValues(scKeys, (sc) => val("capital_called",   sc)) },
    { kpi: "Undrawn",          values: buildValues(scKeys, (sc) => val("undrawn",          sc)) },
    { kpi: "Distributed",      values: buildValues(scKeys, (sc) => val("distributed",      sc)) },
    { kpi: "NAV",              values: buildValues(scKeys, (sc) => val("nav",              sc)) },
    { kpi: "NAV per share", isExpandable: true,
                               values: buildValues(scKeys, (sc) => val("nav_per_share",    sc)) },
    { kpi: "IRR", suffix: "%", values: buildValues(scKeys, irrVal) },
    { kpi: "TVPI", suffix: "x", values: buildValues(scKeys, (sc) => val("tvpi",            sc)) },
    { kpi: "RVPI", suffix: "x", values: buildValues(scKeys, (sc) => val("rvpi",            sc)) },
    { kpi: "DPI",  suffix: "x", values: buildValues(scKeys, (sc) => val("dpi",             sc)) },
    { kpi: "Number of shares", values: buildValues(scKeys, (sc) => val("shares",           sc)) },
    { kpi: "% Called",    suffix: "%", values: buildValues(scKeys, (sc) => val("pct_called",      sc)) },
    { kpi: "% Distributed", suffix: "%", values: buildValues(scKeys, (sc) => val("pct_distributed", sc)) },
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

  return { kpiRows, navDetails, scKeys };
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
  const columns = useMemo(() => {
    const baseColumns = [{ key: "total", label: "Total" }];
    if (!shareClassesData) return baseColumns;

    const dynamicColumns = shareClassesData.map((sc) => ({
      key:   sc.share_class_name,
      label: `${sc.share_class_name}`,
    }));

    return [...baseColumns, ...dynamicColumns];
  }, [shareClassesData]);

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
    return columns.filter((c) => c.key === "total" || selectedElements.includes(c.key));
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
          <ElementSelector
            options={(shareClassesData ?? []).map((sc) => ({
              key: sc.share_class_name,
              label: sc.share_class_name,
            }))}
            selected={selectedElements}
            onChange={handleToggleElement}
          />
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