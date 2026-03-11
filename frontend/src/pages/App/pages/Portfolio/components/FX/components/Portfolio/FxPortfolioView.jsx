import React from "react";
import QuarterSelector from "../../../../../../../../components/QuarterSelection/QuarterSelector";
import { SortIcon } from "../../Icons";
import {
  formatFxValue,
  getLatestFxRowByCutoff,
  parseFxValue,
} from "../../FXbackwork";
import "../Deals/FxDealsView.css";

const normalizeLabel = (label) => String(label || "").replace(/\s/g, "");
const impactKeyForTimeframe = (timeframeLabel) => `impact${normalizeLabel(timeframeLabel)}`;

const FxPortfolioView = ({ fundId, shared }) => {
  const {
    quarters,
    isLoading: isTimeframesLoading,
    selectedTimeframeIds,
    debouncedSelectedTimeframes,
    handleToggleTimeframe,
    handleSaveTimeframe,
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

  const hasSelectedTimeframes = timeframeColumns.length > 0;

  const aggregateRows = dealsInvestments
    .map((inv) => {
      const costRows = Array.isArray(inv.costRows) ? inv.costRows : [];
      const fvRows = Array.isArray(inv.fvRows) ? inv.fvRows : [];
      const latestFvRow = getLatestFxRowByCutoff(fvRows, debouncedSelectedTimeframes);

      const fxEntry = fvRows.length
        ? fvRows
            .slice()
            .sort((a, b) => new Date(a.rawDate || a.date) - new Date(b.rawDate || b.date))[0]?.fxRate || "-"
        : "-";

      const rowImpacts = timeframeColumns.reduce((acc, column) => {
        acc[column.impactKey] = parseFxValue(latestFvRow?.[column.impactKey]);
        return acc;
      }, {});

      return {
        name: inv.title,
        costLc: Math.abs(
          costRows.reduce((sum, row) => sum + parseFxValue(row.flow), 0)
        ),
        currency: fvRows[0]?.currency || costRows[0]?.currency || "-",
        fxEntry,
        impacts: rowImpacts,
        impactInception: parseFxValue(latestFvRow?.impactInception),
      };
    });

  const grandTotalCost = aggregateRows.reduce((acc, row) => acc + row.costLc, 0);
  const grandTotalInception = aggregateRows.reduce(
    (acc, row) => acc + row.impactInception,
    0
  );
  const grandImpactTotals = timeframeColumns.reduce((acc, column) => {
    acc[column.impactKey] = aggregateRows.reduce(
      (sum, row) => sum + (row.impacts[column.impactKey] || 0),
      0
    );
    return acc;
  }, {});

  return (
    <section className="fx-deals-section">
      <div className="fx-deals-filters-row">
        <QuarterSelector
          options={quarters}
          selected={selectedTimeframeIds}
          onChange={handleToggleTimeframe}
          onSaveNew={handleSaveTimeframe}
          isLoading={isTimeframesLoading}
          isSingle={false}
        />
      </div>

      <div className="fx-deals-table-card">
        <table className="fx-deals-table">
          <thead>
            <tr>
              <th>Name <SortIcon /></th>
              <th className="col-number">Cost LC <SortIcon /></th>
              <th>Currency <SortIcon /></th>
              <th className="col-number">FX Entry <SortIcon /></th>
              {timeframeColumns.map((column) => (
                <th key={column.id} className="col-number">
                  Impact {column.label} (e)
                  <span className="header-currency-hint">({symbol})</span>
                </th>
              ))}
              <th className="col-number">
                Impact inception (e)
                <span className="header-currency-hint">({symbol})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {aggregateRows.map((row, idx) => (
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
              <td />
              <td />
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
