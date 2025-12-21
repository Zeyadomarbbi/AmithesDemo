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
  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 1.66667C5.02453 1.66667 1.66667 5.02453 1.66667 9.16667C1.66667 11.9417 3.17334 14.3658 5.41727 15.6638C5.81566 15.8943 5.95179 16.404 5.72134 16.8024C5.49089 17.2008 4.98111 17.3369 4.58273 17.1065C1.84498 15.5228 0 12.5607 0 9.16667C0 4.10406 4.10405 0 9.16667 0C14.2293 0 18.3333 4.10405 18.3333 9.16667C18.3333 12.7032 16.3304 15.7706 13.4009 17.2987C13.3887 17.3051 13.3763 17.3115 13.364 17.318C13.0947 17.4587 12.7955 17.615 12.4545 17.7039C12.0713 17.8038 11.6844 17.81 11.2191 17.7469C10.7921 17.6891 10.3269 17.4716 9.96434 17.2518C9.60179 17.0321 9.19384 16.7202 8.94502 16.3683C8.33171 15.501 8.3324 14.6713 8.33327 13.6205C8.3333 13.5806 8.33333 13.5405 8.33333 13.5V7.84518L6.42259 9.75592C6.09715 10.0814 5.56952 10.0814 5.24408 9.75592C4.91864 9.43049 4.91864 8.90285 5.24408 8.57741L8.57741 5.24408C8.73369 5.0878 8.94565 5 9.16667 5C9.38768 5 9.59964 5.0878 9.75592 5.24408L13.0893 8.57741C13.4147 8.90285 13.4147 9.43048 13.0893 9.75592C12.7638 10.0814 12.2362 10.0814 11.9107 9.75592L10 7.84518V13.5C10 14.7094 10.0249 15.0087 10.3058 15.406C10.3618 15.4852 10.5451 15.6549 10.8284 15.8266C11.1116 15.9983 11.3468 16.0823 11.4429 16.0954C11.765 16.139 11.9214 16.1205 12.034 16.0911C12.1733 16.0548 12.3108 15.9876 12.6301 15.821C15.0307 14.5687 16.6667 12.0581 16.6667 9.16667C16.6667 5.02453 13.3088 1.66667 9.16667 1.66667Z" fill="#375A89"/>
  </svg>
  Upload
</button>

          <button className="ghost-btn" type="button">
  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M6.29936 1.69679C6.16008 1.73311 6.0225 1.80037 5.70328 1.9669C3.30261 3.21921 1.66667 5.72987 1.66667 8.62127C1.66667 12.7634 5.02453 16.1213 9.16667 16.1213C13.3088 16.1213 16.6667 12.7634 16.6667 8.62127C16.6667 5.84626 15.16 3.42217 12.9161 2.12412C12.5177 1.89367 12.3815 1.3839 12.612 0.985513C12.8424 0.587128 13.3522 0.450993 13.7506 0.681446C16.4884 2.26515 18.3333 5.22726 18.3333 8.62127C18.3333 13.6839 14.2293 17.7879 9.16667 17.7879C4.10406 17.7879 0 13.6839 0 8.62127C0 5.08473 2.00294 2.01738 4.93244 0.489202C4.94468 0.482814 4.95699 0.476385 4.96936 0.469924C5.23865 0.329256 5.53785 0.172966 5.87879 0.0840571C6.26207 -0.0158958 6.64892 -0.0220444 7.1142 0.0409938C7.54125 0.0988535 8.00645 0.316303 8.369 0.536092C8.73155 0.755881 9.1395 1.06776 9.38831 1.41963C10.0016 2.28697 10.0009 3.11662 10.0001 4.16745C10 4.20729 10 4.24745 10 4.28793V9.94275L11.9107 8.03201C12.2362 7.70657 12.7638 7.70657 13.0893 8.03201C13.4147 8.35745 13.4147 8.88508 13.0893 9.21052L9.75592 12.5439C9.43049 12.8693 8.90285 12.8693 8.57741 12.5439L5.24408 9.21052C4.91864 8.88508 4.91864 8.35745 5.24408 8.03201C5.56951 7.70657 6.09715 7.70657 6.42259 8.03201L8.33333 9.94275V4.28793C8.33333 3.07855 8.30846 2.77924 8.02749 2.38189C7.97149 2.3027 7.78823 2.13303 7.50498 1.96131C7.22174 1.7896 6.98655 1.70559 6.89043 1.69257C6.5683 1.64893 6.41194 1.66743 6.29936 1.69679Z" fill="#375A89"/>
  </svg>
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
                  type="text"
                  defaultValue="0,000,000"
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
                  defaultValue="0,000,000"
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