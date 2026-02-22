// KPIsTable.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../components/Sort/TableSort";
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../components/useFormatter';
import { fetchPortfolioKpisByFundIds } from "../PortfolioDataFuncs"; 
import { API_BASE_URL } from "../../../../hooks/useApi"; 
import { PageSpinner } from "../../AllFundsPage"; 
import "./KPIsTable.css";

const COLS = [
  { key: "name",       label: "Fund",           center: false },
  { key: "strategy",   label: "Strategy",       center: true  },
  { key: "commitment", label: "Commitment (€)", center: true  },
  { key: "cost",       label: "Cost (€)",       center: true  },
  { key: "deals",      label: "Nb of deals",    center: true  },
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

export default function KPIsTable({ funds = [], onFundClick }) {
  const formatNumber  = useNumberFormatter();
  const formatPercent = usePercentageFormatter();

  const [fundKpisByFundId, setFundKpisByFundId] = useState({});
  const [casKpisByFundId, setCasKpisByFundId] = useState({});
  const [isKpisLoading, setIsKpisLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadAllKpis = async () => {
      const ids = funds.map((fund) => fund.id).filter(Boolean);
      if (ids.length === 0) {
        if (!signal.aborted) {
          setFundKpisByFundId({});
          setCasKpisByFundId({});
          setIsKpisLoading(false);
        }
        return;
      }

      if (!signal.aborted) setIsKpisLoading(true);

      // Note: fetchPortfolioKpisByFundIds must be updated internally to accept and utilize the 'signal' parameter to fully abort its internal network requests.
      const portfolioKpisPromise = fetchPortfolioKpisByFundIds(ids, signal).catch(e => {
        if (e.name === 'AbortError') return {};
        throw e;
      });

      const casBulkPromise = fetch(
        `${API_BASE_URL}/api/funds/cas-kpis/bulk/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fund_ids: ids,
            timeframe_id: null, // or pass actual timeframe if available
          }),
          signal,
        }
      )
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.json();
        })
        .catch(e => {
          if (e.name === "AbortError") return {};
          throw e;
        });

      try {
        const [portfolioMap, casMap] = await Promise.all([
          portfolioKpisPromise,
          casBulkPromise
        ]);

        if (!signal.aborted) {
          setFundKpisByFundId(portfolioMap || {});
          setCasKpisByFundId(casMap || {});
          setIsKpisLoading(false);
        }
      } catch (err) {
        if (!signal.aborted) {
          setIsKpisLoading(false);
        }
      }
    };

    loadAllKpis();

    return () => {
      controller.abort();
    };
  }, [funds]);

  const tableRows = useMemo(
    () =>
      funds.map((fund) => {
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
    [funds, fundKpisByFundId, casKpisByFundId]
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
                  showCurrency={false}
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