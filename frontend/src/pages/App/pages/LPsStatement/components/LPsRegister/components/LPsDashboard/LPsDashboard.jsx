import React from "react";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort.jsx";
import { useNumberFormatter, usePercentageFormatter } from "../../../../../../../../components/useFormatter.js";
import "./LPsDashboard.css";

const LPsDashboard = ({
  displayRows,
  tableColumns,
  totals,
  onSelectLP,
}) => {
  // 1. Initialize Formatters from Hooks
  const formatNumber = useNumberFormatter();
  const formatPercent = usePercentageFormatter();

  // 2. Initialize Sorting Logic
  // Using 'lp.name' as initial key (ensure useTableSort handles nested keys or use row.lp?.name)
  const { sorted, sortKey, toggleSort } = useTableSort(displayRows, "lp.name");

  return (
    <div className="lp-table-row">
      <div className="lp-table-container">
        <table className="lp-table">
          <thead>
            <tr>
              <th className="th-left">
                <SortableHeaderRenderer
                  label="LPs"
                  columnKey="lp.name"
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={false}
                  showCurrency={false}
                />
              </th>
              <th>
                <SortableHeaderRenderer
                  label="Share class"
                  columnKey="displayClass"
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                  showCurrency={false}
                />
              </th>
              <th>
                <SortableHeaderRenderer
                  label="Commitment"
                  columnKey="totalNumeric"
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                  showCurrency={true}
                />
              </th>
              <th>
                <SortableHeaderRenderer
                  label="% of Ownership"
                  columnKey="ownership"
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                  showCurrency={false}
                />
              </th>
              {tableColumns.map((col) => (
                <th key={col.id}>
                  <SortableHeaderRenderer
                    label={col.name}
                    columnKey={`closingValues.${col.id}`}
                    currentSortKey={sortKey}
                    toggleSort={toggleSort}
                    center={true}
                    showCurrency={true}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.map((row) => (
              <tr
                key={`${row.lp?.lp_id}_${row.displayClass}`}
                className="lp-row-clickable"
                onClick={() => onSelectLP(row.lp)}
              >
                <td className="td-left lp-cell">
                  <div className="lp-avatar">
                    {row.lp?.name
                      ? row.lp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "LP"}
                  </div>
                  <span className="lp-name">{row.lp?.name || "Unknown LP"}</span>
                </td>

                <td className="td-center">
                  <span className={`tag ${row.displayClassColor}`}>
                    {row.displayClass}
                  </span>
                </td>

                {/* Individual LP Commitment */}
                <td className="td-center">
                  {formatNumber(row.totalNumeric)}
                </td>

                {/* Individual LP Ownership % */}
                <td className="td-center">
                  {formatPercent(row.ownership)}
                </td>
                
                {/* Individual LP Commitment per Closing Period */}
                {tableColumns.map((col) => {
                  const val = row.closingValues[col.id];
                  // Parse value to ensure numeric formatting if transformer returns strings
                  const numericVal = (val && val !== "—") 
                    ? parseFloat(String(val).replace(/[^\d.-]/g, '')) 
                    : 0;

                  return (
                    <td key={col.id} className="td-center">
                      {numericVal > 0 ? formatNumber(numericVal) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="lp-total-row">
              <td className="td-left">Total</td>
              <td />
              
              {/* Grand Total Commitment */}
              <td className="td-center">
                {formatNumber(totals.commitmentNumber || 0)}
              </td>

              {/* Grand Total Ownership (Should be 100%) */}
              <td className="td-center">
                {formatPercent(totals.ownership)}
              </td>
              
              {/* Grand Total per Closing Period */}
              {tableColumns.map((col) => {
                const totalVal = totals.closingTotals?.[col.id];
                // Strip formatting if the total arrives as a string
                const numericTotal = typeof totalVal === 'string' 
                   ? parseFloat(totalVal.replace(/[^\d.-]/g, '')) 
                   : (totalVal || 0);

                return (
                  <td key={col.id} className="td-center">
                    {numericTotal > 0 ? formatNumber(numericTotal) : "0.00"}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default LPsDashboard;