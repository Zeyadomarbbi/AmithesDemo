import {
  calculateDealTableTotals,
  formatFxValue,
  parseFxValue,
  resolveImpactKeys,
} from "../../FXbackwork";
import { SortIcon } from "../../Icons";
import "./FxDealsView.css";

const normalizeLabel = (label) => String(label || "").replace(/\s/g, "");

const buildTimeframeColumns = (selectedTimeframes, impactKeys) => {
  if (selectedTimeframes.length) {
    const impactMap = new Map(impactKeys.map((key) => [key.toLowerCase(), key]));
    return selectedTimeframes.map((timeframe) => {
      const fallbackImpactKey = `impact${normalizeLabel(timeframe.display_label)}`;
      const expected = fallbackImpactKey.toLowerCase();
      const impactKey = impactMap.get(expected) || fallbackImpactKey;
      return { id: timeframe.id, label: timeframe.display_label, impactKey };
    });
  }
  if (!impactKeys.length) return [];
  return impactKeys.map((key) => ({
    id: key,
    label: key.replace("impact", "Impact ").replace(/(\d{4})$/, " $1"),
    impactKey: key,
  }));
};

const resolveFxAsOfValue = (row, timeframeLabel) => {
  const token = normalizeLabel(timeframeLabel);
  const candidates = [`fxAsOf${token}`, `fx_as_of_${token}`, `fx${token}`];
  const matchedKey = candidates.find((key) => row?.[key] !== undefined && row?.[key] !== null);
  return matchedKey ? row[matchedKey] : row.fxRate;
};

const toDateValue = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getLatestRowByCutoff = (rows = [], selectedTimeframes = []) => {
  const validRows = rows
    .filter((row) => row?.rawDate || row?.date)
    .map((row) => ({ row, date: toDateValue(row.rawDate || row.date) }))
    .filter((item) => item.date);
  if (!validRows.length) return [];
  const cutoffCandidates = selectedTimeframes
    .map((tf) => toDateValue(tf.rawDate || tf.date))
    .filter(Boolean)
    .sort((a, b) => a - b);
  const cutoff = cutoffCandidates.length ? cutoffCandidates[cutoffCandidates.length - 1] : null;
  const eligible = cutoff ? validRows.filter((item) => item.date <= cutoff) : validRows;
  const targetPool = eligible.length ? eligible : validRows;
  const latest = targetPool.sort((a, b) => a.date - b.date)[targetPool.length - 1];
  return latest ? [latest.row] : [];
};

const FxDealsSubTable = ({
  rows, timeframeColumns, symbol, primaryValueLabel,
  primaryValueCellResolver, totalPrimaryValue = 0,
  showTotal = false, totals = null, tablePart = "top",
}) => (
  <div className={`fx-deals-table-card fx-deals-table-card-${tablePart}`}>
    <table className="fx-deals-table">
      <thead>
        <tr>
          <th>Date <SortIcon /></th>
          <th className="col-number">{primaryValueLabel} <SortIcon /></th>
          <th>Currency <SortIcon /></th>
          {timeframeColumns.map((column) => (
            <th key={`fx-${column.id}`} className="col-number">FX as of {column.label}</th>
          ))}
          {timeframeColumns.map((column) => (
            <th key={`impact-${column.id}`} className="col-number">
              Impact {column.label} (e)
              <span className="header-currency-hint">({symbol})</span>
            </th>
          ))}
          <th className="col-number">
            Impact since inception €
            <span className="header-currency-hint">({symbol})</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.date}</td>
            <td className="col-number">{primaryValueCellResolver(row)}</td>
            <td>{row.currency}</td>
            {timeframeColumns.map((column) => (
              <td key={`row-fx-${row.id}-${column.id}`} className="col-number">
                {resolveFxAsOfValue(row, column.label)}
              </td>
            ))}
            {timeframeColumns.map((column) => (
              <td key={`row-impact-${row.id}-${column.id}`} className="col-number">
                {row[column.impactKey]}
              </td>
            ))}
            <td className="col-number">{row.impactInception}</td>
          </tr>
        ))}
        {showTotal && totals && (
          <tr className="fx-total-row">
            <td className="fx-total-label">Total</td>
            <td className="col-number">{formatFxValue(totalPrimaryValue)}</td>
            <td></td>
            {timeframeColumns.map((column) => (
              <td key={`total-fx-${column.id}`} className="col-number"></td>
            ))}
            {timeframeColumns.map((column) => (
              <td key={`total-impact-${column.id}`} className="col-number">
                {formatFxValue(totals.impactTotals[column.impactKey])}
              </td>
            ))}
            <td className="col-number">{formatFxValue(totals.totalInception)}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const InvestmentTable = ({ title, rows, symbol, selectedTimeframes }) => {
  const costRows = rows?.costRows || [];
  const fvRows = rows?.fvRows || [];
  const latestFvRows = getLatestRowByCutoff(fvRows, selectedTimeframes);
  const impactKeys = resolveImpactKeys(latestFvRows.length ? latestFvRows : costRows, selectedTimeframes);
  const timeframeColumns = buildTimeframeColumns(selectedTimeframes, impactKeys);
  const fvTotals = calculateDealTableTotals(latestFvRows, timeframeColumns.map((col) => col.impactKey));

  return (
    <section className="fx-deals-section">
      <h2 className="fx-deals-title">{title}</h2>
      <div className="fx-deals-investment-tables">
        <div>
          <h3 className="fx-deals-subtitle">FX on cost</h3>
          <FxDealsSubTable
            rows={costRows}
            timeframeColumns={timeframeColumns}
            symbol={symbol}
            primaryValueLabel="Cost LC"
            primaryValueCellResolver={(row) => formatFxValue(Math.abs(parseFxValue(row.flow)))}
            tablePart="top"
          />
        </div>
        <div>
          <h3 className="fx-deals-subtitle">FX on FV</h3>
          <FxDealsSubTable
            rows={latestFvRows}
            timeframeColumns={timeframeColumns}
            symbol={symbol}
            primaryValueLabel="Fair Value on date (e)"
            primaryValueCellResolver={(row) => row.fairValueOnDate}
            totalPrimaryValue={fvTotals.totalFlow}
            showTotal
            totals={fvTotals}
            tablePart="bottom"
          />
        </div>
      </div>
    </section>
  );
};

const FxDealsView = ({ fundId, shared }) => {
  const { dealsInvestments, isDealsLoading, debouncedSelectedTimeframes, symbol = "EUR", isFundsLoading } = shared;

  if (isFundsLoading || isDealsLoading) return null;

  return (
    <div className="fx-deals-container">
      {dealsInvestments.map((inv, index) => (
        <InvestmentTable
          key={`${fundId}-inv-${index}`}
          title={inv.title}
          rows={inv}
          symbol={symbol}
          selectedTimeframes={debouncedSelectedTimeframes}
        />
      ))}
    </div>
  );
};

export default FxDealsView;