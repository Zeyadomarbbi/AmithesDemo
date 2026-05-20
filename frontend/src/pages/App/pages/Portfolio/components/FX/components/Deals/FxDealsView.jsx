import {
  calculateDealTableTotals,
  formatFxValue,
  parseFxValue,
  resolveImpactKeys,
} from "../../FXbackwork";
import { SortIcon } from "../../Icons";
import "./FxDealsView.css";

const normalizeLabel = (label) => String(label || "").replace(/\s/g, "");

// "FX at {label}" for full-year timeframes (FY), "FX as of {label}" for quarters
const getFxColumnLabel = (label) => {
  const normalized = String(label || "").trim().toUpperCase();
  const isFY = normalized.startsWith("FY") || /^(FY|FULL.?YEAR)/i.test(normalized);
  return isFY ? `FX at ${label}` : `FX as of ${label}`;
};

const buildTimeframeColumns = (selectedTimeframes, impactKeys) => {
  if (selectedTimeframes.length) {
    const impactMap = new Map(impactKeys.map((key) => [key.toLowerCase(), key]));
    return selectedTimeframes.map((timeframe) => {
      const fallbackImpactKey = `impact${normalizeLabel(timeframe.display_label)}`;
      const expected = fallbackImpactKey.toLowerCase();
      const impactKey = impactMap.get(expected) || fallbackImpactKey;
      const fxAsOfKey = `fxAsOf${normalizeLabel(timeframe.display_label)}`;
      return { id: timeframe.id, label: timeframe.display_label, impactKey, fxAsOfKey };
    });
  }
  if (!impactKeys.length) return [];
  return impactKeys.map((key) => {
    const suffix = key.replace("impact", "");
    return {
      id: key,
      label: key.replace("impact", "Impact ").replace(/(\d{4})$/, " $1"),
      impactKey: key,
      fxAsOfKey: `fxAsOf${suffix}`,
    };
  });
};

const toDateValue = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};



// ─── FX on Cost Sub-Table ─────────────────────────────────────────────────────
// Columns:
//   Date | Cost LC | Currency | FX as of (timeframe)... | Impact (timeframe)... | Impact since inception
//
// FX as of (timeframe) → row[fxAsOfKey]   (fx rate at that quarter, built in FXbackwork)
// Impact (timeframe)   → row[impactKey]   = (costLc / fxAtDate) - (costLc / fxOneYearBefore)
// Impact since inception → row.impactInception = (costLc / latestFx) - (costLc / oldestFx)

const FxCostSubTable = ({
  rows,
  timeframeColumns,
  symbol,
  showTotal = false,
  totals = null,
  tablePart = "single",
}) => (
  <div className={`fx-deals-table-card fx-deals-table-card-${tablePart}`}>
    <table className="fx-deals-table">
      <thead>
        <tr>
          <th>Date <SortIcon /></th>
          <th className="col-number">Cost LC <SortIcon /></th>
          <th>Currency <SortIcon /></th>
          {timeframeColumns.map((col) => (
            <th key={`fx-${col.id}`} className="col-number">
              {getFxColumnLabel(col.label)}
            </th>
          ))}
          {timeframeColumns.map((col) => (
            <th key={`impact-${col.id}`} className="col-number">
              Impact {col.label} (e)
              <span className="header-currency-hint">({symbol})</span>
            </th>
          ))}
          <th className="col-number">
            Impact since inception
            <span className="header-currency-hint">({symbol})</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {/* Date — from the flow's date */}
            <td>{row.date}</td>

            {/* Cost LC — absolute amount in local currency */}
            <td className="col-number">
              {formatFxValue(Math.abs(parseFxValue(row.flow)))}
            </td>

            {/* Currency — investment currency code */}
            <td>{row.currency}</td>

            {/* FX as of each selected timeframe — fx rate at that quarter */}
            {timeframeColumns.map((col) => (
              <td key={`row-fx-${row.id}-${col.id}`} className="col-number">
                {row[col.fxAsOfKey] ?? "-"}
              </td>
            ))}

            {/* Impact per timeframe = (costLc / fxAtDate) - (costLc / fxOneYearBefore) */}
            {timeframeColumns.map((col) => (
              <td key={`row-impact-${row.id}-${col.id}`} className="col-number">
                {row[col.impactKey] ?? "-"}
              </td>
            ))}

            {/* Impact since inception = (costLc / latestFx) - (costLc / oldestFx) */}
            <td className="col-number">{row.impactInception}</td>
          </tr>
        ))}

        {showTotal && totals && (
          <tr className="fx-total-row">
            <td className="fx-total-label">Total</td>
            <td className="col-number">{formatFxValue(totals.totalFlow)}</td>
            <td></td>
            {timeframeColumns.map((col) => (
              <td key={`total-fx-${col.id}`} className="col-number"></td>
            ))}
            {timeframeColumns.map((col) => (
              <td key={`total-impact-${col.id}`} className="col-number">
                {formatFxValue(totals.impactTotals[col.impactKey])}
              </td>
            ))}
            <td className="col-number">{formatFxValue(totals.totalInception)}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// ─── FX on FV Sub-Table ──────────────────────────────────────────────────────

const FxFvSubTable = ({
  rows,
  timeframeColumns,
  symbol,
  totalPrimaryValue = 0,
  showTotal = false,
  totals = null,
  tablePart = "bottom",
}) => (
  <div className={`fx-deals-table-card fx-deals-table-card-${tablePart}`}>
    <table className="fx-deals-table">
      <thead>
        <tr>
          <th>Date <SortIcon /></th>
          <th className="col-number">
            Fair Value on date (e)
            <span className="header-currency-hint">({symbol})</span>
          </th>
          <th>Currency <SortIcon /></th>
          {timeframeColumns.map((col) => (
            <th key={`fx-${col.id}`} className="col-number">
              {getFxColumnLabel(col.label)}
            </th>
          ))}
          {timeframeColumns.map((col) => (
            <th key={`impact-${col.id}`} className="col-number">
              Impact {col.label} (e)
              <span className="header-currency-hint">({symbol})</span>
            </th>
          ))}
          <th className="col-number">
            Impact since inception
            <span className="header-currency-hint">({symbol})</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.date}</td>
            <td className="col-number">{row.fairValueOnDate}</td>
            <td>{row.currency}</td>
            {timeframeColumns.map((col) => (
              <td key={`row-fx-${row.id}-${col.id}`} className="col-number">
                {row[col.fxAsOfKey] ?? "-"}
              </td>
            ))}
            {timeframeColumns.map((col) => (
              <td key={`row-impact-${row.id}-${col.id}`} className="col-number">
                {row[col.impactKey] ?? "-"}
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
            {timeframeColumns.map((col) => (
              <td key={`total-fx-${col.id}`} className="col-number"></td>
            ))}
            {timeframeColumns.map((col) => (
              <td key={`total-impact-${col.id}`} className="col-number">
                {formatFxValue(totals.impactTotals[col.impactKey])}
              </td>
            ))}
            <td className="col-number">{formatFxValue(totals.totalInception)}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// ─── Investment Table (Cost + FV) ─────────────────────────────────────────────

const InvestmentTable = ({ title, rows, symbol, historicalTimeframes }) => {
  const costRows = rows?.costRows || [];
  const fvRows = rows?.fvRows || [];
  const rowsForColumns = costRows.length ? costRows : fvRows;
  const impactKeys = resolveImpactKeys(
    rowsForColumns,
    historicalTimeframes
  );
  const timeframeColumns = buildTimeframeColumns(historicalTimeframes, impactKeys);

  const costTotals = calculateDealTableTotals(costRows, timeframeColumns.map((col) => col.impactKey));
  const fvTotals = calculateDealTableTotals(fvRows, timeframeColumns.map((col) => col.impactKey));

  return (
    <section className="fx-deals-section">
      <h2 className="fx-deals-title">{title}</h2>
      <div className="fx-deals-investment-tables">
        <div>
          <h3 className="fx-deals-subtitle">FX on cost</h3>
          <FxCostSubTable
            rows={costRows}
            timeframeColumns={timeframeColumns}
            symbol={symbol}
            showTotal={costRows.length > 1}
            totals={costTotals}
            tablePart={fvRows.length ? "top" : "single"}
          />
        </div>
        {fvRows.length > 0 && (
          <div>
            <h3 className="fx-deals-subtitle">FX on FV</h3>
            <FxFvSubTable
            rows={fvRows}
            timeframeColumns={timeframeColumns}
            symbol={symbol}
            totalPrimaryValue={fvTotals.totalFlow}
            showTotal
            totals={fvTotals}
            tablePart="bottom"
          />
        </div>
      )}
      </div>
    </section>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

const FxDealsView = ({ fundId, shared }) => {
  const {
    dealsInvestments,
    isDealsLoading,
    debouncedSelectedTimeframes,
    symbol = "EUR",
    isFundsLoading,
  } = shared;

  if (isFundsLoading || isDealsLoading) return null;

  return (
    <div className="fx-deals-container">
      {dealsInvestments.map((inv, index) => (
        <InvestmentTable
          key={`${fundId}-inv-${index}`}
          title={inv.title}
          rows={inv}
          symbol={symbol}
          historicalTimeframes={inv.timeframes || debouncedSelectedTimeframes}
        />
      ))}
    </div>
  );
};

export default FxDealsView;
