import React from "react";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../components/Sort/TableSort.jsx";
import { useNumberFormatter } from "../../../../../../../components/useFormatter.js";
import "../../FX/components/Deals/FxDealsView.css";
import "./Table.css";

const PortfolioCompareTable = ({
  activeQuarters,
  visibleRows,
  totalRow,
  visibleColumnKeys,
  onSelectInvestment,
  getDiff,
}) => {
  const formatNumber = useNumberFormatter();
  const showColumn = (key) => visibleColumnKeys.includes(key);

  const flatRows = React.useMemo(() => {
    return visibleRows.map((row) => {
      const flat = { id: row.id, name: row.name, sector: row.sector };
      activeQuarters.forEach((q) => {
        flat[`cost_${q.id}`]       = row.timeframes?.[q.id]?.cost       ?? 0;
        flat[`fv_${q.id}`]         = row.timeframes?.[q.id]?.fv         ?? 0;
        flat[`divestment_${q.id}`] = row.timeframes?.[q.id]?.divestment ?? 0;
        flat[`dividends_${q.id}`]  = row.timeframes?.[q.id]?.dividends  ?? 0;
      });
      return flat;
    });
  }, [visibleRows, activeQuarters]);

  const { sorted, sortKey, toggleSort } = useTableSort(flatRows, "name");

  const sortedWithOriginal = sorted
    .map((flat) => visibleRows.find((r) => String(r.id) === String(flat.id)))
    .filter(Boolean);

  return (
    <div className="fx-deals-table-card">
      <table className="fx-deals-table">
        <thead>
          <tr>
            <th>
              <SortableHeaderRenderer
                label="Name"
                columnKey="name"
                currentSortKey={sortKey}
                toggleSort={toggleSort}
                center={false}
              />
            </th>

            {showColumn("cost") && activeQuarters.map((q) => (
              <th key={`cost-${q.id}`} className="col-number">
                <SortableHeaderRenderer
                  label={`Cost ${q.display_label}`}
                  columnKey={`cost_${q.id}`}
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                />
              </th>
            ))}
            {showColumn("change_cost") && (
              <th className="col-number">
                <SortableHeaderRenderer
                  label="Change in Cost"
                  columnKey="change_cost"
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                />
              </th>
            )}

            {showColumn("fv") && activeQuarters.map((q) => (
              <th key={`fv-${q.id}`} className="col-number">
                <SortableHeaderRenderer
                  label={`FV ${q.display_label}`}
                  columnKey={`fv_${q.id}`}
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                />
              </th>
            ))}
            {showColumn("change_fv") && (
              <th className="col-number">
                <SortableHeaderRenderer
                  label="Change in FV"
                  columnKey="change_fv"
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                />
              </th>
            )}

            {showColumn("divestment") && activeQuarters.map((q) => (
              <th key={`divestment-${q.id}`} className="col-number">
                <SortableHeaderRenderer
                  label={`Divestment ${q.display_label}`}
                  columnKey={`divestment_${q.id}`}
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                />
              </th>
            ))}

            {showColumn("dividends") && activeQuarters.map((q) => (
              <th key={`dividends-${q.id}`} className="col-number">
                <SortableHeaderRenderer
                  label={`Dividends ${q.display_label}`}
                  columnKey={`dividends_${q.id}`}
                  currentSortKey={sortKey}
                  toggleSort={toggleSort}
                  center={true}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedWithOriginal.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelectInvestment?.(row)}
              className={onSelectInvestment ? "clickable-row" : ""}
            >
              <td className="col-name">
                <div className="name-main">{row.name}</div>
                <div className="name-sub">{row.sector}</div>
              </td>

              {showColumn("cost") && activeQuarters.map((q) => (
                <td key={`cost-${row.id}-${q.id}`} className="col-number">
                  {formatNumber(row.timeframes?.[q.id]?.cost)}
                </td>
              ))}
              {showColumn("change_cost") && (
                <td className="col-number col-diff">{getDiff(row, "cost")}</td>
              )}

              {showColumn("fv") && activeQuarters.map((q) => (
                <td key={`fv-${row.id}-${q.id}`} className="col-number">
                  {formatNumber(row.timeframes?.[q.id]?.fv)}
                </td>
              ))}
              {showColumn("change_fv") && (
                <td className="col-number col-diff">{getDiff(row, "fv")}</td>
              )}

              {showColumn("divestment") && activeQuarters.map((q) => (
                <td key={`divestment-${row.id}-${q.id}`} className="col-number">
                  {formatNumber(row.timeframes?.[q.id]?.divestment)}
                </td>
              ))}

              {showColumn("dividends") && activeQuarters.map((q) => (
                <td key={`dividends-${row.id}-${q.id}`} className="col-number">
                  {formatNumber(row.timeframes?.[q.id]?.dividends)}
                </td>
              ))}
            </tr>
          ))}

          <tr className="fx-total-row">
            <td className="fx-total-label">Total</td>

            {showColumn("cost") && activeQuarters.map((q) => (
              <td key={`tot-cost-${q.id}`} className="col-number">
                {formatNumber(totalRow.timeframes?.[q.id]?.cost)}
              </td>
            ))}
            {showColumn("change_cost") && (
              <td className="col-number col-total-diff">{getDiff(totalRow, "cost")}</td>
            )}

            {showColumn("fv") && activeQuarters.map((q) => (
              <td key={`tot-fv-${q.id}`} className="col-number">
                {formatNumber(totalRow.timeframes?.[q.id]?.fv)}
              </td>
            ))}
            {showColumn("change_fv") && (
              <td className="col-number col-total-diff">{getDiff(totalRow, "fv")}</td>
            )}

            {showColumn("divestment") && activeQuarters.map((q) => (
              <td key={`tot-divestment-${q.id}`} className="col-number">
                {formatNumber(totalRow.timeframes?.[q.id]?.divestment)}
              </td>
            ))}

            {showColumn("dividends") && activeQuarters.map((q) => (
              <td key={`tot-dividends-${q.id}`} className="col-number">
                {formatNumber(totalRow.timeframes?.[q.id]?.dividends)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioCompareTable;