import React, { useState } from "react";

/* ===== External Components ===== */
import QuarterSelector from "../../../../../components/QuarterSelection/QuarterSelector";

/* ===== Icons ===== */
import {
  DocumentIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

/* ===== Mock Data ===== */
import {
  pnlPeriods,
  incomeLines,
  expenseLines,
} from "../data/mockData";

/* ===== Styles ===== */
import "../styles/PnL.css";

const PnLTab = () => {
  /* ================= Timeframe ================= */
  const [selectedQuarters, setSelectedQuarters] = useState([]);

  /* ================= UI Toggles ================= */
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);

  /* ================= Values ================= */
  const [incomeValues, setIncomeValues] = useState(
    incomeLines.map(() => ({ col1: 0, col2: 0 }))
  );

  const [expenseValues, setExpenseValues] = useState(
    expenseLines.map(() => ({ col1: 0, col2: 0 }))
  );

  const [taxValues, setTaxValues] = useState([{ col1: 0, col2: 0 }]);

  /* ================= Helpers ================= */
  const sumColumn = (arr, col) =>
    arr.reduce((acc, v) => acc + Number(v[col] || 0), 0);

  const totalIncomeCol1 = sumColumn(incomeValues, "col1");
  const totalIncomeCol2 = sumColumn(incomeValues, "col2");

  const totalExpensesCol1 = sumColumn(expenseValues, "col1");
  const totalExpensesCol2 = sumColumn(expenseValues, "col2");

  const totalTaxCol1 = sumColumn(taxValues, "col1");
  const totalTaxCol2 = sumColumn(taxValues, "col2");

  const netCol1 =
    totalIncomeCol1 - totalExpensesCol1 - totalTaxCol1;
  const netCol2 =
    totalIncomeCol2 - totalExpensesCol2 - totalTaxCol2;

  return (
    <>
      {/* ===== Toolbar ===== */}
      <div className="toolbar-row">
        <div
          className="left-tools"
          style={{ gap: "12px", alignItems: "center" }}
        >
          {/* Quarter Selector (MULTI) */}
          <QuarterSelector
            isSingle={false}
            selected={selectedQuarters}
            onChange={(values) => {
              setSelectedQuarters(values);
              console.log("Selected quarters:", values);
            }}
          />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <section className="financials-card">
        {/* ===== Header ===== */}
        <div className="table-header-row">
          <div />
          {pnlPeriods.map((p) => (
            <div key={p.id} className="col-period">
              <DocumentIcon className="icon-svg-muted" />
              <PencilSquareIcon className="icon-svg-muted small" />
              <span className="period-label">{p.label}</span>
            </div>
          ))}
          <div />
        </div>

        {/* ================= Income ================= */}
        <div className="group-row group-row--band">
          <button
            className="group-toggle"
            onClick={() => setShowIncome((v) => !v)}
          >
            <span className="sign">{showIncome ? "−" : "+"}</span>
            Income
          </button>
          <div className="group-value">
            {totalIncomeCol1.toLocaleString()}
          </div>
          <div className="group-value">
            {totalIncomeCol2.toLocaleString()}
          </div>
          <div className="group-action-cell">
            <button className="pill-btn">+ Add income</button>
          </div>
        </div>

        {showIncome &&
          incomeLines.map((line, index) => (
            <div className="detail-row" key={line.id}>
              <div className="detail-label">{line.label}</div>

              <div className="detail-input-wrapper">
                <PencilSquareIcon className="edit-icon" />
                <input
                  className="amount-input"
                  type="number"
                  value={incomeValues[index].col1}
                  onChange={(e) => {
                    const copy = [...incomeValues];
                    copy[index].col1 = e.target.value;
                    setIncomeValues(copy);
                  }}
                />
              </div>

              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  value={incomeValues[index].col2}
                  onChange={(e) => {
                    const copy = [...incomeValues];
                    copy[index].col2 = e.target.value;
                    setIncomeValues(copy);
                  }}
                />
              </div>
              <div />
            </div>
          ))}

        {/* ================= Expenses ================= */}
        <div className="group-row group-row--band">
          <button
            className="group-toggle"
            onClick={() => setShowExpenses((v) => !v)}
          >
            <span className="sign">{showExpenses ? "−" : "+"}</span>
            Expenses
          </button>
          <div className="group-value">
            {totalExpensesCol1.toLocaleString()}
          </div>
          <div className="group-value">
            {totalExpensesCol2.toLocaleString()}
          </div>
          <div className="group-action-cell">
            <button className="pill-btn">+ Add expense</button>
          </div>
        </div>

        {showExpenses &&
          expenseLines.map((line, index) => (
            <div className="detail-row" key={line.id}>
              <div className="detail-label">{line.label}</div>

              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  value={expenseValues[index].col1}
                  onChange={(e) => {
                    const copy = [...expenseValues];
                    copy[index].col1 = e.target.value;
                    setExpenseValues(copy);
                  }}
                />
              </div>

              <div className="detail-input-wrapper">
                <input
                  className="amount-input"
                  type="number"
                  value={expenseValues[index].col2}
                  onChange={(e) => {
                    const copy = [...expenseValues];
                    copy[index].col2 = e.target.value;
                    setExpenseValues(copy);
                  }}
                />
              </div>
              <div />
            </div>
          ))}

        {/* ================= Tax ================= */}
        <div className="group-row group-row--band">
          <button
            className="group-toggle"
            onClick={() => setShowTax((v) => !v)}
          >
            <span className="sign">{showTax ? "−" : "+"}</span>
            Tax
          </button>
          <div className="group-value">
            {totalTaxCol1.toLocaleString()}
          </div>
          <div className="group-value">
            {totalTaxCol2.toLocaleString()}
          </div>
          <div className="group-action-cell">
            <button className="pill-btn">+ Add tax</button>
          </div>
        </div>

        {showTax && (
          <div className="detail-row">
            <div className="detail-label">Tax</div>

            <div className="detail-input-wrapper">
              <input
                className="amount-input"
                type="number"
                value={taxValues[0].col1}
                onChange={(e) =>
                  setTaxValues([{ ...taxValues[0], col1: e.target.value }])
                }
              />
            </div>

            <div className="detail-input-wrapper">
              <input
                className="amount-input"
                type="number"
                value={taxValues[0].col2}
                onChange={(e) =>
                  setTaxValues([{ ...taxValues[0], col2: e.target.value }])
                }
              />
            </div>
            <div />
          </div>
        )}

        {/* ================= Net Profit ================= */}
        <div className="net-row">
          <div>Net Profit / Net loss</div>
          <div
            className={`net-value ${
              netCol1 >= 0 ? "positive" : "negative"
            }`}
          >
            {netCol1.toLocaleString()}
          </div>
          <div
            className={`net-value ${
              netCol2 >= 0 ? "positive" : "negative"
            }`}
          >
            {netCol2.toLocaleString()}
          </div>
          <div />
        </div>
      </section>
    </>
  );
};

export default PnLTab;
