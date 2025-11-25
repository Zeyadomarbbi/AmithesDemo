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
  const [activeTab, setActiveTab] = useState("pnl"); // "pnl" | "fx" | "limits"
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showTax, setShowTax] = useState(true);
  const [isNewLimitOpen, setIsNewLimitOpen] = useState(false);

  return (
    <div className="financials-page">
      {/* ===== Top strip ===== */}
      <header className="financials-topbar">
        <span className="fund-name">Asterium Fund I</span>
      </header>

      {/* ===== Main content ===== */}
      <main className="financials-content">
        {/* Title */}
        <h1 className="financials-title">Financials</h1>

        {/* Tabs */}
        <div className="financials-tabs">
          <button
            className={`tab ${activeTab === "pnl" ? "active" : ""}`}
            onClick={() => setActiveTab("pnl")}
          >
            P&amp;L
          </button>
         
          <button
            className={`tab ${activeTab === "limits" ? "active" : ""}`}
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
        </div>

        {/* ================= P&L TAB ================= */}
        {activeTab === "pnl" && (
          <>
            {/* Toolbar: Timeframe + Upload / Download */}
            <div className="toolbar-row">
              <div className="left-tools">
                <button className="timeframe-btn">
                  <span>Timeframe (2)</span>
                  <ChevronDownIcon className="icon-svg caret-icon" />
                </button>
              </div>

              <div className="right-tools">
                <button className="ghost-btn">
                  <ArrowUpTrayIcon className="icon-svg" />
                  <span>Upload</span>
                </button>
                <button className="ghost-btn">
                  <ArrowDownTrayIcon className="icon-svg" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <section className="financials-card">
              {/* Header row (periods) */}
              <div className="table-header-row">
                <div className="col-label" />
                <div className="col-period">
                  <DocumentIcon className="icon-svg-muted" />
                  <PencilSquareIcon className="icon-svg-muted small" />
                  <span className="period-label">Q1 2024 (€)</span>
                </div>
                <div className="col-period">
                  <DocumentIcon className="icon-svg-muted" />
                  <PencilSquareIcon className="icon-svg-muted small" />
                  <span className="period-label">Q1 2025 (€)</span>
                </div>
                <div className="col-action" />
              </div>

              {/* ===== Income ===== */}
              <div className="group-row group-row--band">
                <button
                  type="button"
                  className="group-toggle"
                  onClick={() => setShowIncome((v) => !v)}
                >
                  <span className="sign">{showIncome ? "−" : "+"}</span>
                  <span>Income</span>
                </button>

                <div className="group-value">2 500 000</div>
                <div className="group-value">-</div>
                <div className="group-action-cell">
                  <button className="pill-btn">+ Add income</button>
                </div>
              </div>

              {showIncome && (
                <>
                  <div className="detail-row">
                    <div className="detail-label">Realized gain</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">500 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Unrealized gain</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">2 000 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">FX gain</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">750 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Dividends &amp; Interests</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">200 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Other income</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">50 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>
                </>
              )}

              {/* ===== Expenses ===== */}
              <div className="group-row group-row--band">
                <button
                  type="button"
                  className="group-toggle"
                  onClick={() => setShowExpenses((v) => !v)}
                >
                  <span className="sign">{showExpenses ? "−" : "+"}</span>
                  <span>Expenses</span>
                </button>

                <div className="group-value">1 900 000</div>
                <div className="group-value">-</div>
                <div className="group-action-cell">
                  <button className="pill-btn">+ Add expense</button>
                </div>
              </div>

              {showExpenses && (
                <>
                  <div className="detail-row">
                    <div className="detail-label">Management fees</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">1 000 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Due diligence fees</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">500 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Opex</div>
                    <div className="detail-input-wrapper">
                      <PencilSquareIcon className="edit-icon" />
                      <div className="static-value">150 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Unrealized losses</div>
                    <div className="detail-input-wrapper">
                      <div className="static-value">50 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">FX losses</div>
                    <div className="detail-input-wrapper">
                      <div className="static-value">100 000</div>
                    </div>
                    <div className="detail-input-wrapper">
                      <input
                        className="amount-input grey"
                        type="text"
                        value="0,000,000"
                        readOnly
                      />
                    </div>
                    <div className="detail-spacer" />
                  </div>
                </>
              )}

              {/* ===== Tax ===== */}
              <div className="group-row group-row--band">
                <button
                  type="button"
                  className="group-toggle"
                  onClick={() => setShowTax((v) => !v)}
                >
                  <span className="sign">{showTax ? "−" : "+"}</span>
                  <span>Tax</span>
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
                      type="text"
                      value="0,000,000"
                      readOnly
                    />
                  </div>
                  <div className="detail-input-wrapper">
                    <input
                      className="amount-input grey"
                      type="text"
                      value="0,000,000"
                      readOnly
                    />
                  </div>
                  <div className="detail-spacer" />
                </div>
              )}

              {/* ===== Net Profit / Net loss ===== */}
              <div className="net-row">
                <div className="net-label">Net Profit / Net loss</div>
                <div className="net-value positive">600 000</div>
                <div className="net-value negative">- 100 000</div>
                <div className="net-spacer" />
              </div>
            </section>
          </>
        )}

        {/* ================= Portfolio FX TAB (Placeholder) ================= */}
        {activeTab === "fx" && (
          <section className="financials-card">
            <div className="limits-header-row">
              <div>
                <h2 className="limits-title">Portfolio FX</h2>
                <p className="limits-subtitle">
                  FX exposure and currency breakdown (placeholder).
                </p>
              </div>
            </div>
            <div className="limits-table-wrapper">
              <p style={{ fontSize: "13px", color: "#6b7280", padding: "8px" }}>
                This section can be wired later based on the FX Figma design.
              </p>
            </div>
          </section>
        )}

        {/* ================= Limits TAB ================= */}
        {activeTab === "limits" && (
          <>
            <section className="limits-section">
              {/* Filters row */}
              <div className="limits-filters-row">
                <div className="limits-filters-left">
                  <button className="dropdown-btn">
                    <span>Q2 2024</span>
                    <ChevronDownIcon className="icon-svg caret-icon" />
                  </button>

                  <button className="dropdown-btn">
                    <span>Scenario Opti...</span>
                    <ChevronDownIcon className="icon-svg caret-icon" />
                  </button>
                </div>

                <button
                  className="new-limit-btn"
                  onClick={() => setIsNewLimitOpen(true)}
                >
                  + New limit
                </button>
              </div>

              {/* Table */}
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
                        Scenario Optimi...{" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="name-cell">
                        <div className="name-main">Due dil. fees</div>
                        <div className="name-sub">Art 8.7</div>
                      </td>
                      <td>
                        Due diligence fees borne by the fund shall be capped to
                        2.00%
                      </td>
                      <td className="col-number">2.00%</td>
                      <td className="col-number">1.17%</td>
                      <td className="col-number breach-red">2.05%</td>
                    </tr>

                    <tr>
                      <td className="name-cell">
                        <div className="name-main">Opex</div>
                        <div className="name-sub">Art 8.8</div>
                      </td>
                      <td>
                        Operating expenses borne by the fund shall be capped to
                        4.00%
                      </td>
                      <td className="col-number">4.00%</td>
                      <td className="col-number">2.14%</td>
                      <td className="col-number">3.75%</td>
                    </tr>

                    <tr>
                      <td className="name-cell">
                        <div className="name-main">Man. fees</div>
                        <div className="name-sub">Art 8.9</div>
                      </td>
                      <td>
                        Management Fee to be paid shall be capped to 17.00%
                      </td>
                      <td className="col-number">17.00%</td>
                      <td className="col-number">5.14%</td>
                      <td className="col-number">15.75%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Side panel: Adding a new limit */}
            {isNewLimitOpen && (
              <div className="sidepanel-overlay">
                <div className="sidepanel">
                  <div className="sidepanel-header">
                    <button
                      className="sidepanel-back-btn"
                      onClick={() => setIsNewLimitOpen(false)}
                    >
                      <ChevronLeftIcon className="icon-svg" />
                    </button>
                    <h2 className="sidepanel-title">Adding a new limit</h2>
                    <button
                      className="sidepanel-close-btn"
                      onClick={() => setIsNewLimitOpen(false)}
                    >
                      <XMarkIcon className="icon-svg" />
                    </button>
                  </div>

                  <div className="sidepanel-body">
                    <h3 className="sidepanel-section-title">
                      General informations
                    </h3>

                    <div className="form-group">
                      <label className="form-label">
                        Name<span className="required">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Enter the name of the limit"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">PPM reference</label>
                      <input
                        className="form-input"
                        type="text"
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
                        type="text"
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
                          type="text"
                          placeholder="Minimum or Maximum"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Rate<span className="required">*</span>
                        </label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Please enter a percentage"
                        />
                      </div>
                    </div>

                    <hr className="form-divider" />

                    <h3 className="sidepanel-section-title">Description</h3>

                    <div className="form-group">
                      <label className="form-label">
                        Description as per PPM<span className="required">
                          *
                        </span>
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