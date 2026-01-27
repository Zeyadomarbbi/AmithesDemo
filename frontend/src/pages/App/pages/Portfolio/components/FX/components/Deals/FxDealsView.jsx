import { useFundData } from "../../../../../../hooks/useFundData"; 
import { FX_DEALS_DATA } from "../../../../portfolioData";
import { SortIcon } from "../../Icons";
import "./FxDealsView.css";

// --- HELPERS ---

const parseValue = (val) => {
  if (!val || val === "-") return 0;
  // Removes spaces and ensures negative signs are attached correctly
  return parseFloat(val.replace(/\s/g, "").replace("−", "-"));
};

const formatValue = (num) => {
  if (num === 0) return "-";
  // Formats back to standard display: "12 000 000" or "- 5 785"
  const formatted = new Intl.NumberFormat("en-US").format(Math.abs(num)).replace(/,/g, " ");
  return num < 0 ? `- ${formatted}` : formatted;
};

const InvestmentTable = ({ title, rows, symbol }) => {
  // Filter out any rows that might be legacy "total" types from the dataset
  const dataRows = rows.filter(r => r.type !== "total");

  const impactKeys = Object.keys(dataRows[0] || {}).filter(
    key => key.startsWith("impact") && key !== "impactInception"
  );

  // --- CALCULATIONS ---

  const totalFlow = dataRows.reduce((acc, row) => acc + parseValue(row.flow), 0);
  const totalInception = dataRows.reduce((acc, row) => acc + parseValue(row.impactInception), 0);
  
  const impactTotals = impactKeys.reduce((acc, key) => {
    acc[key] = dataRows.reduce((sum, row) => sum + parseValue(row[key]), 0);
    return acc;
  }, {});

  const formatHeader = (key) => {
    return key
      .replace("impact", "Impact ")
      .replace(/(\d{4})$/, " $1"); 
  };

  return (
    <section className="fx-deals-section">
      <h2 className="fx-deals-title">{title}</h2>
      <div className="fx-deals-table-card">
        <table className="fx-deals-table">
          <thead>
            <tr>
              <th>Date <SortIcon /></th>
              <th className="col-number">Flow (LC) <SortIcon /></th>
              <th>Currency <SortIcon /></th>
              <th className="col-number">FX Rate <SortIcon /></th>
              {impactKeys.map(key => (
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
            {dataRows.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td className="col-number">{row.flow}</td>
                <td>{row.currency}</td>
                <td className="col-number">{row.fxRate}</td>
                {impactKeys.map(key => (
                  <td key={key} className="col-number">{row[key]}</td>
                ))}
                <td className="col-number">{row.impactInception}</td>
              </tr>
            ))}
            
            {/* FRONTEND CALCULATED TOTAL ROW */}
            <tr className="fx-total-row">
              <td className="fx-total-label">Total</td>
              <td className="col-number">{formatValue(totalFlow)}</td>
              <td></td>
              <td></td>
              {impactKeys.map(key => (
                <td key={key} className="col-number">{formatValue(impactTotals[key])}</td>
              ))}
              <td className="col-number">{formatValue(totalInception)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

const FxDealsView = ({ fundId }) => {
  const { funds, isLoading } = useFundData();

  if (isLoading) return null;

  const currentFund = funds.find(f => String(f.id) === String(fundId));
  const symbol = currentFund?.currencySymbol || "€";
  const investments = FX_DEALS_DATA[fundId] || FX_DEALS_DATA[Number(fundId)] || [];

  return (
    <div className="fx-deals-container">
      {investments.map((inv, index) => (
        <InvestmentTable 
          key={`${fundId}-inv-${index}`} 
          title={inv.title} 
          rows={inv.rows}
          symbol={symbol}
        />
      ))}
    </div>
  );
};

export default FxDealsView;