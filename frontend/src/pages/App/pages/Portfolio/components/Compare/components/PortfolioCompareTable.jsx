import React from "react";
import { SortIcon } from "../../../icons.jsx";
import "../../FX/components/Deals/FxDealsView.css";
import "./Table.css";

const PortfolioCompareTable = ({
  activeQuarters,
  visibleRows,
  totalRow,
  visibleColumnKeys,
  onSelectInvestment,
  formatMoney,
  getDiff,
}) => {
  const symbol = "EUR";
  const showColumn = (key) => visibleColumnKeys.includes(key);

  return (
    <div className="fx-deals-table-card">
      <table className="fx-deals-table">
        <thead>
          <tr>
            <th>Name <SortIcon /></th>
            {activeQuarters.filter((q) => showColumn(`cost:${q.id}`)).map((q) => (
              <th key={`cost-${q.id}`} className="col-number">
                Cost {q.display_label}
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
            ))}
            {showColumn("change_cost") && (
              <th className="col-number" style={{ color: "#374151", fontWeight: 600 }}>
                Change in Cost
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
            )}
            {activeQuarters.filter((q) => showColumn(`fv:${q.id}`)).map((q) => (
              <th key={`fv-${q.id}`} className="col-number">
                FV {q.display_label}
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
            ))}
            {showColumn("change_fv") && (
              <th className="col-number" style={{ color: "#374151", fontWeight: 600 }}>
                Change in FV
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
            )}
            {activeQuarters.filter((q) => showColumn(`divestment:${q.id}`)).map((q) => (
              <th key={`divestment-${q.id}`} className="col-number">
                Divestment {q.display_label}
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
            ))}
            {activeQuarters.filter((q) => showColumn(`dividends:${q.id}`)).map((q) => (
              <th key={`dividends-${q.id}`} className="col-number">
                Dividends {q.display_label}
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id} onClick={() => onSelectInvestment ? onSelectInvestment(row) : null}>
              <td style={{ fontWeight: 500, color: "#111827" }}>
                <div className="name-main">{row.name}</div>
                <div className="name-sub" style={{ fontSize: 12, color: "#6B7280", fontWeight: 400 }}>
                  {row.sector}
                </div>
              </td>
              {activeQuarters.filter((q) => showColumn(`cost:${q.id}`)).map((q) => (
                <td key={`cost-${row.id}-${q.id}`} className="col-number">
                  {formatMoney(row.timeframes[q.id]?.cost)}
                </td>
              ))}
              {showColumn("change_cost") && (
                <td className="col-number" style={{ fontWeight: 600, color: "#374151" }}>
                  {getDiff(row, "cost")}
                </td>
              )}
              {activeQuarters.filter((q) => showColumn(`fv:${q.id}`)).map((q) => (
                <td key={`fv-${row.id}-${q.id}`} className="col-number">
                  {formatMoney(row.timeframes[q.id]?.fv)}
                </td>
              ))}
              {showColumn("change_fv") && (
                <td className="col-number" style={{ fontWeight: 600, color: "#374151" }}>
                  {getDiff(row, "fv")}
                </td>
              )}
              {activeQuarters.filter((q) => showColumn(`divestment:${q.id}`)).map((q) => (
                <td key={`divestment-${row.id}-${q.id}`} className="col-number">
                  {formatMoney(row.timeframes[q.id]?.divestment)}
                </td>
              ))}
              {activeQuarters.filter((q) => showColumn(`dividends:${q.id}`)).map((q) => (
                <td key={`dividends-${row.id}-${q.id}`} className="col-number">
                  {formatMoney(row.timeframes[q.id]?.dividends)}
                </td>
              ))}
            </tr>
          ))}

          <tr className="fx-total-row">
            <td className="fx-total-label">Total</td>
            {activeQuarters.filter((q) => showColumn(`cost:${q.id}`)).map((q) => (
              <td key={`tot-cost-${q.id}`} className="col-number">
                {formatMoney(totalRow.timeframes[q.id]?.cost)}
              </td>
            ))}
            {showColumn("change_cost") && (
              <td className="col-number" style={{ fontWeight: 700 }}>
                {getDiff(totalRow, "cost")}
              </td>
            )}
            {activeQuarters.filter((q) => showColumn(`fv:${q.id}`)).map((q) => (
              <td key={`tot-fv-${q.id}`} className="col-number">
                {formatMoney(totalRow.timeframes[q.id]?.fv)}
              </td>
            ))}
            {showColumn("change_fv") && (
              <td className="col-number" style={{ fontWeight: 700 }}>
                {getDiff(totalRow, "fv")}
              </td>
            )}
            {activeQuarters.filter((q) => showColumn(`divestment:${q.id}`)).map((q) => (
              <td key={`tot-divestment-${q.id}`} className="col-number">
                {formatMoney(totalRow.timeframes[q.id]?.divestment)}
              </td>
            ))}
            {activeQuarters.filter((q) => showColumn(`dividends:${q.id}`)).map((q) => (
              <td key={`tot-dividends-${q.id}`} className="col-number">
                {formatMoney(totalRow.timeframes[q.id]?.dividends)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioCompareTable;
