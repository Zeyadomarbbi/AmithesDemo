import React from "react";
import { SortIcon } from "../../../icons.jsx"; 
import "../../FX/components/Deals/FxDealsView.css"; // Ensure you import the styles
import "./Table.css";

const PortfolioCompareTable = ({ 
  activeQuarters, 
  visibleRows, 
  totalRow, 
  onSelectInvestment, 
  formatMoney, 
  getDiff 
}) => {
  const symbol = "€"; // Default symbol

  return (
    <div className="fx-deals-table-card">
        <table className="fx-deals-table">
          <thead>
            <tr>
              <th>Name <SortIcon /></th>
              
              {/* Dynamic Cost Columns */}
              {activeQuarters.map(q => (
                <th key={`cost-${q.id}`} className="col-number">
                  Cost {q.display_label} 
                  <span className="header-currency-hint2">({symbol})</span>
                  <SortIcon />
                </th>
              ))}
              
              {/* Highlighted Difference Column */}
              <th className="col-number" style={{ color: '#374151', fontWeight: 600 }}>
                Difference 
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>
              
              {/* Dynamic FV Columns */}
              {activeQuarters.map(q => (
                <th key={`fv-${q.id}`} className="col-number">
                  Fair value {q.display_label} 
                  <span className="header-currency-hint2">({symbol})</span>
                  <SortIcon />
                </th>
              ))}
              
              <th className="col-number" style={{ color: '#374151', fontWeight: 600 }}>
                Change 
                <span className="header-currency-hint2">({symbol})</span>
                <SortIcon />
              </th>

              {/* Dynamic MOIC Columns */}
              {activeQuarters.map(q => (
                <th key={`moic-${q.id}`} className="col-number">
                  MOIC {q.display_label} <SortIcon />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} onClick={() => onSelectInvestment ? onSelectInvestment(row) : null}>
                <td style={{ fontWeight: 500, color: '#111827' }}>
                  <div className="name-main">{row.name}</div>
                  <div className="name-sub" style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}>
                    {row.sector}
                  </div>
                </td>
                
                {/* Cost Cells */}
                {activeQuarters.map(q => (
                  <td key={`cost-${row.id}-${q.id}`} className="col-number">
                    {formatMoney(row.timeframes[q.id]?.cost)}
                  </td>
                ))}
                <td className="col-number" style={{ fontWeight: 600, color: '#374151' }}>
                  {getDiff(row, 'cost')}
                </td>

                {/* FV Cells */}
                {activeQuarters.map(q => (
                  <td key={`fv-${row.id}-${q.id}`} className="col-number">
                    {formatMoney(row.timeframes[q.id]?.fv)}
                  </td>
                ))}
                <td className="col-number" style={{ fontWeight: 600, color: '#374151' }}>
                  {getDiff(row, 'fv')}
                </td>

                {/* MOIC Cells */}
                {activeQuarters.map(q => (
                  <td key={`moic-${row.id}-${q.id}`} className="col-number">
                    {row.timeframes[q.id]?.moic ? `${row.timeframes[q.id].moic}x` : "-"}
                  </td>
                ))}
              </tr>
            ))}

            {/* TOTAL ROW */}
            <tr className="fx-total-row">
              <td className="fx-total-label">Total</td>
              
               {/* Total Cost */}
               {activeQuarters.map(q => (
                  <td key={`tot-cost-${q.id}`} className="col-number">
                    {formatMoney(totalRow.timeframes[q.id]?.cost)}
                  </td>
                ))}
                <td className="col-number" style={{ fontWeight: 700 }}>
                   {getDiff(totalRow, 'cost')}
                </td>

                {/* Total FV */}
                {activeQuarters.map(q => (
                  <td key={`tot-fv-${q.id}`} className="col-number">
                    {formatMoney(totalRow.timeframes[q.id]?.fv)}
                  </td>
                ))}
                <td className="col-number" style={{ fontWeight: 700 }}>
                   {getDiff(totalRow, 'fv')}
                </td>

                {/* Total MOIC */}
                {activeQuarters.map(q => (
                  <td key={`tot-moic-${q.id}`} className="col-number">
                     {totalRow.timeframes[q.id]?.moic}x
                  </td>
                ))}
            </tr>
          </tbody>
        </table>
      </div>
  );
};

export default PortfolioCompareTable;