import React from "react";
import { formatFxValue, getLatestFxRowByCutoff, parseFxValue } from "../../FXbackwork";
import "../Deals/FxDealsView.css";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort";

const normalizeLabel = (label) => String(label || "").replace(/\s/g, "");
const impactKeyForTimeframe = (timeframeLabel) => `impact${normalizeLabel(timeframeLabel)}`;

const FxPortfolioView = ({ fundId, shared }) => {
  const {
    debouncedSelectedTimeframes,
    dealsInvestments,
    isDealsLoading,
    symbol = "EUR",
    isFundsLoading,
  } = shared;

  if (isFundsLoading || isDealsLoading) return null;

  const timeframeColumns = debouncedSelectedTimeframes.map((timeframe) => ({
    id: timeframe.id,
    label: timeframe.display_label,
    impactKey: impactKeyForTimeframe(timeframe.display_label),
    rawDate: timeframe.rawDate || timeframe.date,
  }));

  const aggregateRows = dealsInvestments.map((inv) => {
    const costRows = Array.isArray(inv.costRows) ? inv.costRows : [];
    const fvRows = Array.isArray(inv.fvRows) ? inv.fvRows : [];
    const latestFvRow = getLatestFxRowByCutoff(fvRows, debouncedSelectedTimeframes);
    const fxEntry = fvRows.length
      ? fvRows.slice().sort((a, b) => new Date(a.rawDate || a.date) - new Date(b.rawDate || b.date))[0]?.fxRate || "-"
      : "-";
    const rowImpacts = timeframeColumns.reduce((acc, column) => {
      acc[column.impactKey] = parseFxValue(latestFvRow?.[column.impactKey]);
      return acc;
    }, {});
    return {
      name: inv.title,
      costLc: Math.abs(costRows.reduce((sum, row) => sum + parseFxValue(row.flow), 0)),
      currency: fvRows[0]?.currency || costRows[0]?.currency || "-",
      fxEntry,
      impacts: rowImpacts,
      impactInception: parseFxValue(latestFvRow?.impactInception),
    };
  });

  const { sorted, sortKey, toggleSort } = useTableSort(aggregateRows, "name");

  const grandTotalCost = aggregateRows.reduce((acc, row) => acc + row.costLc, 0);
  const grandTotalInception = aggregateRows.reduce((acc, row) => acc + row.impactInception, 0);
  const grandImpactTotals = timeframeColumns.reduce((acc, column) => {
    acc[column.impactKey] = aggregateRows.reduce((sum, row) => sum + (row.impacts[column.impactKey] || 0), 0);
    return acc;
  }, {});

  return (
    <section className="fx-deals-section">
      <div className="fx-deals-table-card">
        <table className="fx-deals-table">
          <thead>
            <tr>
              <th>
                <SortableHeaderRenderer label="Name" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
              </th>
              <th className="col-number">
                <SortableHeaderRenderer label="Cost LC" columnKey="costLc" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
              </th>
              <th>
                <SortableHeaderRenderer label="Currency" columnKey="currency" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
              </th>
              <th className="col-number">
                <SortableHeaderRenderer label="FX Entry" columnKey="fxEntry" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
              </th>
              {timeframeColumns.map((column) => (
                <th key={column.id} className="col-number">
                  <SortableHeaderRenderer label={`Impact ${column.label} (e)`} columnKey={column.impactKey} currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                  <span className="header-currency-hint">({symbol})</span>
                </th>
              ))}
              <th className="col-number">
                <SortableHeaderRenderer label="Impact inception (e)" columnKey="impactInception" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                <span className="header-currency-hint">({symbol})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={`${row.name}-${idx}`}>
                <td>{row.name}</td>
                <td className="col-number">{formatFxValue(row.costLc)}</td>
                <td>{row.currency}</td>
                <td className="col-number">{row.fxEntry}</td>
                {timeframeColumns.map((column) => (
                  <td key={`${row.name}-${column.id}`} className="col-number">
                    {formatFxValue(row.impacts[column.impactKey] || 0)}
                  </td>
                ))}
                <td className="col-number">{formatFxValue(row.impactInception)}</td>
              </tr>
            ))}
            <tr className="fx-total-row">
              <td className="fx-total-label">Total</td>
              <td className="col-number">{formatFxValue(grandTotalCost)}</td>
              <td /><td />
              {timeframeColumns.map((column) => (
                <td key={`total-${column.id}`} className="col-number">
                  {formatFxValue(grandImpactTotals[column.impactKey] || 0)}
                </td>
              ))}
              <td className="col-number">{formatFxValue(grandTotalInception)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default FxPortfolioView;