import React from "react";
import { useFundData } from "../../../../../../hooks/useFundData";
import { FX_DEALS_DATA } from "../../../../portfolioData";
import { SortIcon } from "../../Icons";
import "../Deals/FxDealsView.css";

const parseValue = (val) => {
  if (!val || val === "-") return 0;
  return parseFloat(val.replace(/\s/g, "").replace("−", "-"));
};

const formatValue = (num) => {
  if (num === 0) return "-";
  const formatted = new Intl.NumberFormat("en-US").format(Math.abs(num)).replace(/,/g, " ");
  return num < 0 ? `- ${formatted}` : formatted;
};

const FxPortfolioView = ({ fundId }) => {
  const { funds, isLoading } = useFundData();

  if (isLoading) return null;

  const currentFund = funds.find((f) => String(f.id) === String(fundId));
  const symbol = currentFund?.currencySymbol || "€";
  const investments = FX_DEALS_DATA[fundId] || FX_DEALS_DATA[Number(fundId)] || [];

  // 1. Identify all unique dynamic impact keys across all investments
  const impactKeys = Array.from(
    new Set(
      investments.flatMap((inv) =>
        Object.keys(inv.rows[0] || {}).filter(
          (key) => key.startsWith("impact") && key !== "impactInception"
        )
      )
    )
  ).sort();

  // 2. Aggregate data: One row per Investment title
  const aggregateRows = investments.map((inv) => {
    // Filter out potential legacy total rows to ensure math accuracy
    const dataRows = inv.rows.filter((r) => r.type !== "total");

    const rowImpacts = impactKeys.reduce((acc, key) => {
      acc[key] = dataRows.reduce((sum, row) => sum + parseValue(row[key]), 0);
      return acc;
    }, {});

    return {
      name: inv.title,
      cost: dataRows.reduce((acc, row) => acc + parseValue(row.flow), 0),
      currency: dataRows[0]?.currency || "—",
      // Logic Change: Explicitly take the FX rate from the very first entry
      fxEntry: dataRows[0]?.fxRate || "—", 
      impacts: rowImpacts,
      impactInception: dataRows.reduce((acc, row) => acc + parseValue(row.impactInception), 0),
    };
  });

  // 3. Grand Totals for the footer
  const grandTotalCost = aggregateRows.reduce((acc, row) => acc + row.cost, 0);
  const grandTotalInception = aggregateRows.reduce((acc, row) => acc + row.impactInception, 0);
  const grandImpactTotals = impactKeys.reduce((acc, key) => {
    acc[key] = aggregateRows.reduce((sum, row) => sum + row.impacts[key], 0);
    return acc;
  }, {});

  const formatHeader = (key) => {
    return key.replace("impact", "Impact ").replace(/(\d{4})$/, " $1");
  };

  return (
    <section className="fx-deals-section">
      <div className="fx-deals-table-card">
        <table className="fx-deals-table">
          <thead>
            <tr>
              <th>Name <SortIcon /></th>
              <th className="col-number">Cost <SortIcon /></th>
              <th>Currency <SortIcon /></th>
              <th className="col-number">FX Entry <SortIcon /></th>
              {impactKeys.map((key) => (
                <th key={key} className="col-number">
                  {formatHeader(key)} 
                  <span className="header-currency-hint">({symbol})</span>
                </th>
              ))}
              <th className="col-number">Impact Inception 
                <span className="header-currency-hint">({symbol})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {aggregateRows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.name}</td>
                <td className="col-number">{formatValue(row.cost)}</td>
                <td>{row.currency}</td>
                <td className="col-number">{row.fxEntry}</td>
                {impactKeys.map((key) => (
                  <td key={key} className="col-number">
                    {formatValue(row.impacts[key])}
                  </td>
                ))}
                <td className="col-number">{formatValue(row.impactInception)}</td>
              </tr>
            ))}

            <tr className="fx-total-row">
              <td className="fx-total-label">Total</td>
              <td className="col-number">{formatValue(grandTotalCost)}</td>
              <td />
              <td />
              {impactKeys.map((key) => (
                <td key={key} className="col-number">
                  {formatValue(grandImpactTotals[key])}
                </td>
              ))}
              <td className="col-number">{formatValue(grandTotalInception)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default FxPortfolioView;