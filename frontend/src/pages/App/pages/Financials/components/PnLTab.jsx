import React, { useState } from "react";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PencilSquareIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  pnlPeriods,
  timeframeData,
  incomeLines,
  expenseLines,
} from "../data/mockData";
import "../styles/PnL.css";

const PnLTab = () => {
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  return (
    <>
      {/* Toolbar */}
      <div className="toolbar-row">
        <div className="left-tools">
          <div className="timeframe-wrapper">
            <button
              type="button"
              className="timeframe-btn"
              onClick={() => setIsTimeframeOpen((v) => !v)}
            >
              <span>Timeframe ({timeframeData.length})</span>
              <ChevronDownIcon className="icon-svg caret-icon" />
            </button>

            {isTimeframeOpen && (
              <div className="timeframe-dropdown">
                {timeframeData.map((tf) => (
                  <div key={tf.id} className="timeframe-item">
                    <input
                      type="checkbox"
                      checked={tf.checked}
                      readOnly
                      className="timeframe-check"
                    />
                    <span className="timeframe-label">{tf.label}</span>
                    <span className="timeframe-date">{tf.date}</span>
                  </div>
                ))}
                <div className="timeframe-add">+ Add a new timeframe</div>
              </div>
            )}
          </div>
        </div>

        <div className="right-tools">
          <button className="ghost-btn" type="button">
            <ArrowUpTrayIcon className="icon-svg" />
            Upload
          </button>
          <button className="ghost-btn" type="button">
            <ArrowDownTrayIcon className="icon-svg" />
            Download
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <section className="financials-card">
        {/* Periods Header */}
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
          <div className="group-value">2 500 000</div>
          <div className="group-value">-</div>
          <div className="group-action-cell">
            <button className="pill-btn">+ Add income</button>
          </div>
        </div>

        {showIncome &&
          incomeLines.map((line) => (
            <div className="detail-row" key={line.id}>
              <div className="detail-label">{line.label}</div>
              <div className="detail-input-wrapper">
                <PencilSquareIcon className="edit-icon" />
                <div >{line.value}</div>
              </div>
              <div className="detail-input-wrapper">
                <input
                  className="amount-input grey"
                  readOnly
                  value="0,000,000"
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
          <div className="group-value">1 900 000</div>
          <div className="group-value">-</div>
          <div className="group-action-cell">
            <button className="pill-btn">+ Add expense</button>
          </div>
        </div>

        {showExpenses &&
          expenseLines.map((line) => (
            <div className="detail-row" key={line.id}>
              <div className="detail-label">{line.label}</div>
              <div className="detail-input-wrapper">
                { (
                  <PencilSquareIcon className="edit-icon" />
                )}
                <div>{line.value}</div>
              </div>
              <div className="detail-input-wrapper">
                <input
                  className="amount-input grey"
                  readOnly
                  value="0,000,000"
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
          <div className="group-value">4 875</div>
          <div className="group-value">4 875</div>
          <div className="group-action-cell">
            <button className="pill-btn">+ Add tax</button>
          </div>
        </div>

        

        {/* ================= Net Profit ================= */}
        <div className="net-row">
          <div>Net Profit / Net loss</div>
          <div className="net-value positive">600 000</div>
          <div className="net-value negative">- 100 000</div>
          <div />
        </div>
      </section>
    </>
  );
};

export default PnLTab;