import React, { useState } from "react";
import "./FinancialsPage.css";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Financials = () => {
  const [activeTab, setActiveTab] = useState("pnl");

  // groups
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);

  // sidepanel
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  // timeframe dropdown (P&L)
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  // quarter dropdown (Limits)
  const [isQuarterOpen, setIsQuarterOpen] = useState(false);

  // ====================================
  // STATIC DATA (Replace with DB later)
  // ====================================

  const pnlPeriods = [
    { id: "q1_2024", label: "Q1 2024 (€)" },
    { id: "q1_2025", label: "Q1 2025 (€)" },
  ];

  const timeframeData = [
    { id: 1, label: "Q1 2024", date: "08/03/26", checked: true },
    { id: 2, label: "Q1 2025", date: "08/07/26", checked: true },
  ];

  const quarterOptions = [
    { id: 1, label: "Q1 2024", date: "08/03/26" },
    { id: 2, label: "Q2 2024", date: "08/07/26" },
    { id: 3, label: "Q3 2024", date: "08/10/26" },
    { id: 4, label: "Q4 2024", date: "08/12/26" },
  ];

  const incomeLines = [
    { id: "realized_gain", label: "Realized gain", value: "500 000" },
    { id: "unrealized_gain", label: "Unrealized gain", value: "2 000 000" },
    { id: "fx_gain", label: "FX gain", value: "750 000" },
    { id: "dividends", label: "Dividends & Interests", value: "200 000" },
    { id: "other_income", label: "Other income", value: "50 000" },
  ];

  const expenseLines = [
    { id: "management_fees", label: "Management fees", value: "1 000 000" },
    { id: "dd_fees", label: "Due diligence fees", value: "500 000" },
    { id: "opex", label: "Opex", value: "150 000" },
    { id: "unrealized_losses", label: "Unrealized losses", value: "50 000" },
    { id: "fx_losses", label: "FX losses", value: "100 000" },
  ];

  const limitsRows = [
    {
      id: "due_dil_fees",
      name: "Due dil. fees",
      article: "Art 8.7",
      description:
        "Due diligence fees borne by the fund shall be capped to 2.00%",
      limit: "2.00%",
      q4: "1.17%",
      scenario: "2.05%",
      breach: true,
    },
    {
      id: "opex",
      name: "Opex",
      article: "Art 8.8",
      description:
        "Operating expenses borne by the fund shall be capped to 4.00%",
      limit: "4.00%",
      q4: "2.14%",
      scenario: "3.75%",
      breach: false,
    },
    {
      id: "man_fees",
      name: "Man. fees",
      article: "Art 8.9",
      description: "Management Fee to be paid shall be capped to 17.00%",
      limit: "17.00%",
      q4: "5.14%",
      scenario: "15.75%",
      breach: false,
    },
  ];

  // ====================================
  // COMPONENT
  // ====================================

  return (
    <div className="financials-page">
      <main className="financials-content">
        <h1 className="financials-title">Financials</h1>

        {/* TABS */}
        <div className="financials-tabs">
          <button
            className={`tab ${activeTab === "pnl" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("pnl")}
          >
            P&L
          </button>

          <button
            className={`tab ${activeTab === "limits" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
        </div>

        {/* ======================= P&L TAB ======================= */}
        {activeTab === "pnl" && (
          <>
            {/* Toolbar */}
            <div className="toolbar-row">
              <div className="left-tools">
                {/* TIMEFRAME DROPDOWN */}
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
                      <div className="static-value">{line.value}</div>
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
                      {line.id === "unrealized_losses" ||
                      line.id === "fx_losses" ? null : (
                        <PencilSquareIcon className="edit-icon" />
                      )}
                      <div className="static-value">{line.value}</div>
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

              {showTax && (
                <div className="detail-row tax-note">
                  <div className="detail-label">Tax details</div>

                  <div className="detail-input-wrapper">
                    <input
                      className="amount-input grey"
                      readOnly
                      value="0,000,000"
                    />
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
              )}

              {/* ================= Net Profit ================= */}
              <div className="net-row">
                <div>Net Profit / Net loss</div>
                <div className="net-value positive">600 000</div>
                <div className="net-value negative">- 100 000</div>
                <div />
              </div>
            </section>
          </>
        )}

        {/* ======================= LIMITS TAB ======================= */}
        {activeTab === "limits" && (
          <>
            <section className="limits-section">
              <div className="limits-filters-row">
                <div className="limits-filters-left">
                  {/* Quarter Dropdown */}
                  <div className="timeframe-wrapper">
                    <button
                      className="timeframe-btn"
                      type="button"
                      onClick={() => setIsQuarterOpen((v) => !v)}
                    >
                      <span>Q2 2024</span>
                      <ChevronDownIcon className="icon-svg caret-icon" />
                    </button>

                    {isQuarterOpen && (
                      <div className="timeframe-dropdown">
                        {quarterOptions.map((q) => (
                          <div
                            key={q.id}
                            className="timeframe-item"
                            onClick={() => setIsQuarterOpen(false)}
                          >
                            <span className="timeframe-label">{q.label}</span>
                            <span className="timeframe-date">{q.date}</span>
                          </div>
                        ))}

                        <div className="timeframe-add">+ Add a new quarter</div>
                      </div>
                    )}
                  </div>

                  {/* Scenario Dropdown (STATIC for now) */}
                  <button className="dropdown-btn" type="button">
                    <span>Scenario Opti...</span>
                    <ChevronDownIcon className="icon-svg caret-icon" />
                  </button>
                </div>

                <button
                  className="new-limit-btn"
                  type="button"
                  onClick={() => setIsNewLimitOpen(true)}
                >
                  + New limit
                </button>
              </div>

              {/* ===== TABLE ===== */}
              <div className="limits-table-wrapper">
                <table className="limits-table">
                  <thead>
                    <tr>
                      <th className="col-name">
                        Name <span className="sort-indicator">↕</span>
                      </th>
                      <th>Description</th>
                      <th className="col-number">
                        Limits <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Q4 2024 <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Scenario Optimi...
                        <span className="sort-indicator">↕</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {limitsRows.map((row) => (
                      <tr key={row.id}>
                        <td className="name-cell">
                          <div className="name-main">{row.name}</div>
                          <div className="name-sub">{row.article}</div>
                        </td>

                        <td>{row.description}</td>

                        <td className="col-number">{row.limit}</td>
                        <td className="col-number">{row.q4}</td>

                        <td
                          className={`col-number ${
                            row.breach ? "breach-red" : ""
                          }`}
                        >
                          {row.scenario}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ==================== SIDE PANEL ==================== */}
            {isNewLimitOpen && (
              <div className="sidepanel-overlay">
                <div className="sidepanel">
         <div className="sidepanel-header">
  <button
    type="button"
    className="sidepanel-back-btn"
    onClick={() => setIsNewLimitOpen(false)}
  >
    <ChevronLeftIcon className="sidepanel-icon" />
  </button>

  <h2 className="sidepanel-title">Adding a new limit</h2>

  <button
    type="button"
    className="sidepanel-close-btn"
    onClick={() => setIsNewLimitOpen(false)}
  >
    <XMarkIcon className="sidepanel-icon" />
  </button>
</div>



                  <div className="sidepanel-body">
                    {/* General Info */}
                    <h3 className="sidepanel-section-title">
                      General informations
                    </h3>

                    <div className="form-group">
                      <label className="form-label">
                        Name<span className="required">*</span>
                      </label>
                      <input
                        className="form-input"
                        placeholder="Enter the name of the limit"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">PPM reference</label>
                      <input
                        className="form-input"
                        placeholder="Enter the page or the article of the PPM"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Type of expense</label>
                      <div className="form-select">
                        <span>Select a type of expense</span>
                        <ChevronDownIcon className="icon-svg caret-icon" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Group of expense</label>
                      <input
                        className="form-input"
                        placeholder="Name of the group"
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">
                          Min/Max<span className="required">*</span>
                        </label>
                        <input
                          className="form-input"
                          placeholder="Minimum or Maximum"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Rate<span className="required">*</span>
                        </label>
                        <input
                          className="form-input"
                          placeholder="Please enter a percentage"
                        />
                      </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Description */}
                    <h3 className="sidepanel-section-title">Description</h3>

                    <div className="form-group">
                      <label className="form-label">
                        Description as per PPM<span className="required">*</span>
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        placeholder="Please type the description here..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Financials;
