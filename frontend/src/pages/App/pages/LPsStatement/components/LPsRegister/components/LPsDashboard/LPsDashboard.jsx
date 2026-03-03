import React from "react";
import { SortIcon, PlusIcon } from "../../../../Icons.jsx";
import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate.jsx";
import "./LPsDashboard.css";

/* Helpers Internalized for the Table */
function formatPercent(num) {
  return `${(Number(num) || 0).toFixed(2)}%`;
}

const LPsDashboard = ({
  displayRows,
  tableColumns,
  totals,
  onSelectLP,
  onOpenAddPeriod,
}) => {
  return (
    <div className="lp-table-row">
      <div className="lp-table-container">
        <table className="lp-table">
          <thead>
            <tr>
              <th className="th-left">
                LPs <SortIcon />
              </th>
              <th className="th-left">
                Share class <SortIcon />
              </th>
              <th className="th-right">
                Commitment (€) <SortIcon />
              </th>
              <th className="th-right">
                % of Ownership <SortIcon />
              </th>
              {tableColumns.map((col) => (
                <th key={col.id} className="th-right">
                  {col.name} <SortIcon />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => (
              <tr
                key={`${row.lp?.lp_id}_${row.displayClass}`} // Use a unique data-driven key
                className="lp-row-clickable"
                onClick={() => onSelectLP(row.lp)}
              >
                <td className="td-left lp-cell">
                  {/* Initials are now derived from the LP name in the transformer */}
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
                <td className="td-left">
                  <span className={`tag ${row.displayClassColor}`}>
                    {row.displayClass}
                  </span>
                </td>
                <td className="td-right">{row.commitmentCell}</td>
                <td className="td-right">{formatPercent(row.ownership)}</td>
                
                {/* DYNAMIC CLOSING COLUMNS */}
                {tableColumns.map((col) => (
                  <td key={col.id} className="td-right">
                    {row.closingValues[col.id] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="lp-total-row">
              <td className="td-left">Total</td>
              <td />
              <td className="td-right">{totals.commitment}</td>
              <td className="td-right">{totals.ownership}</td>
              
              {/* DYNAMIC FOOTER TOTALS */}
              {tableColumns.map((col) => (
                <td key={col.id} className="td-right">
                  {totals.closingTotals?.[col.id] || "0"}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Side Plus Button for Adding Periods */}
      <PermissionGate>
        <button 
          className="side-plus-btn" 
          onClick={onOpenAddPeriod}
          title="Add Closing Period"
        >
          <PlusIcon />
        </button>
      </PermissionGate>
    </div>
  );
};

export default LPsDashboard;