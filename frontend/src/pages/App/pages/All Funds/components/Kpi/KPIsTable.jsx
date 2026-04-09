import React, { useMemo, useState, useEffect } from "react";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../components/Sort/TableSort";
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../components/useFormatter';
import { fetchPortfolioKpisByFundIds } from "../PortfolioDataFuncs"; 
import useApi from "../../../../../../hooks/api/useApi"; // ✅ New engine import
import { PageSpinner } from "../../../../../../components/LoadingScreens/LoadingScreens";
import "./KPIsTable.css";

const COLS = [
  { key: "name",       label: "Fund",           center: false },
  { key: "strategy",   label: "Strategy",       center: true  },
  { key: "commitment", label: "Commitment (€)", center: true  },
  { key: "cost",       label: "Cost (€)",       center: true  },
  { key: "deals",       label: "Nb of deals",    center: true  },
  { key: "grossIrr",   label: "Gross IRR",      center: true  },
  { key: "netIrr",     label: "Net IRR",        center: true  },
  { key: "dpi",        label: "DPI",            center: true  },
  { key: "rvpi",       label: "RVPI",           center: true  },
  { key: "tvpi",       label: "TVPI",           center: true  },
];

const yearFromDate = (rawDate) => {
  if (!rawDate) return "-";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "-";
  return date.getFullYear();
};

const fmtRatio = (x) =>
  Number.isFinite(Number(x)) ? `${Number(x).toFixed(2)}x` : "-";

export default function KPIsTable({ allFunds = [], displayFunds = [], onFundClick }) {
  const api = useApi();
  const formatNumber  = useNumberFormatter();
  const formatPercent = usePercentageFormatter();

  const [fundKpisByFundId, setFundKpisByFundId] = useState({});
  const [casKpisByFundId, setCasKpisByFundId] = useState({});
  const [isKpisLoading, setIsKpisLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAllKpis = async () => {
      // Use allFunds for the fetch payload
      const ids = allFunds.map((fund) => fund.id).filter(Boolean);
      
      if (ids.length === 0) {
        setFundKpisByFundId({});
        setCasKpisByFundId({});
        setIsKpisLoading(false);
        return;
      }

      setIsKpisLoading(true);

      try {
        const portfolioKpisPromise = fetchPortfolioKpisByFundIds(api, ids);
        const casBulkPromise = api.post("/api/funds/cas-kpis/bulk/", {
          fund_ids: ids,
          timeframe_id: null,
        });

        const [portfolioMap, casMap] = await Promise.all([
          portfolioKpisPromise,
          casBulkPromise
        ]);

        if (isMounted) {
          setFundKpisByFundId(portfolioMap || {});
          setCasKpisByFundId(casMap || {});
        }
      } catch (err) {
        console.error("KPI loading failed:", err.message);
      } finally {
        if (isMounted) setIsKpisLoading(false);
      }
    };

    loadAllKpis();

    return () => {
      isMounted = false;
    };
  }, [allFunds, api]); // <-- Dependency is now allFunds, isolating the fetch from search

  const tableRows = useMemo(
    () =>
      displayFunds.map((fund) => { // <-- Use displayFunds for the UI mapping
        const fundKpi = fundKpisByFundId[String(fund.id)] || {};
        const casKpi = casKpisByFundId[String(fund.id)] || {};
        
        const k = casKpi.basic_kpis || {};
        const irr = casKpi.irr || {};

        return {
          id:         fund.id,
          name:       fund.name || "-",
          year:       yearFromDate(fund.formationDate),
          strategy:   fund.strategy || "-",
          commitment: k.commitment?.total ?? fund.commitment,
          cost:       fundKpi.totalCost,
          deals:      fundKpi.deals,
          grossIrr:   Number.isFinite(Number(fundKpi.grossIrr))
                        ? Number(fundKpi.grossIrr) * 100
                        : null,
          netIrr:     irr.fund_irr != null 
                        ? Number(irr.fund_irr) * 100 
                        : fund.netIrr,
          dpi:        k.dpi?.total ?? fund.dpi,
          rvpi:       k.rvpi?.total ?? fund.rvpi,
          tvpi:       k.tvpi?.total ?? fund.tvpi,
        };
      }),
    [displayFunds, fundKpisByFundId, casKpisByFundId] // <-- Add displayFunds to dependencies
  );

  const { sorted, sortKey, toggleSort } = useTableSort(tableRows);

  if (isKpisLoading) {
    return <PageSpinner label="Calculating KPIs…" />;
  }
  
  return (
    <div className="table-wrapper">
      <table className="clean-table">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c.key} className={c.center ? "td-center" : "td-left"}>
                <SortableHeaderRenderer
                  label={c.label}
                  columnKey={c.key}
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={c.center}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((f, i) => (
            <tr key={f.id} className={i % 2 === 0 ? "striped" : ""}>
              <td className="td-left">
                <div
                  className="fund-name"
                  onClick={() => onFundClick?.(f.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onFundClick?.(f.id);
                    }
                  }}
                >
                  {f.name}
                </div>
                <div className="fund-year">{f.year}</div>
              </td>

              <td className="td-center">{f.strategy}</td>
              <td className="td-center">{Number.isFinite(Number(f.commitment)) ? formatNumber(f.commitment) : "-"}</td>
              <td className="td-center">{Number.isFinite(Number(f.cost))       ? formatNumber(f.cost)       : "-"}</td>
              <td className="td-center">{Number.isFinite(Number(f.deals))      ? formatNumber(f.deals)      : "-"}</td>
              <td className="td-center">{Number.isFinite(Number(f.grossIrr))   ? formatPercent(f.grossIrr)  : "-"}</td>
              <td className="td-center">{Number.isFinite(Number(f.netIrr))     ? formatPercent(f.netIrr)    : "-"}</td>
              <td className="td-center">{fmtRatio(f.dpi)}</td>
              <td className="td-center">{fmtRatio(f.rvpi)}</td>
              <td className="td-center">{fmtRatio(f.tvpi)}</td>
            </tr>
          ))}

          {sorted.length === 0 && (
            <tr>
              <td className="td-left" colSpan={COLS.length}>
                No funds found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}