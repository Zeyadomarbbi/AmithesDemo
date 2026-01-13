// components/CompareDetailPanel.jsx
import React from "react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const iconStyle = {
  color: "#111827",
  stroke: "#111827",
  strokeWidth: 1.5,
  width: 20,
  height: 20,
};

const smallIconStyle = {
  ...iconStyle,
  width: 14,
  height: 14,
};

const CompareDetailPanel = ({ investment, onClose }) => {
  return (
    <div className="compare-detail-overlay" onClick={onClose}>
      <aside
        className="compare-detail-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="compare-detail-header">
          <button className="compare-back-btn" onClick={onClose}>
            <ArrowLeftIcon className="icon-svg" style={smallIconStyle} />
          </button>

          <div className="compare-investment-header">
            <div className="compare-investment-name">
              {investment?.name ?? "Investment"}
            </div>
            <div className="compare-investment-meta">
              <span className="meta-item">
                <span className="meta-label">Ownership</span>
                <span className="meta-value">21.65%</span>
              </span>
              <span className="meta-item">
                <span className="meta-label">Currency</span>
                <span className="meta-value">EUR €</span>
              </span>
              <span className="meta-item">
                <span className="meta-label">Country</span>
                <span className="meta-value">
                  <span className="flag">🇩🇪</span> Germany
                </span>
              </span>
            </div>
          </div>

          <div className="compare-investment-actions">
            <button className="icon-circle-btn">
              <PencilSquareIcon className="icon-svg" style={iconStyle} />
            </button>
          </div>
        </div>

        {/* Summary tiles */}
        <section className="compare-flows-summary">
          <div className="flow-summary-card">
            <div className="flow-summary-label">Investment</div>
            <div className="flow-summary-amount">12 000 000 €</div>
          </div>
          <div className="flow-summary-card">
            <div className="flow-summary-label">Dividends</div>
            <div className="flow-summary-amount">545 000 €</div>
          </div>
          <div className="flow-summary-card">
            <div className="flow-summary-label">Interests</div>
            <div className="flow-summary-amount">- €</div>
          </div>
          <div className="flow-summary-card">
            <div className="flow-summary-label">Other</div>
            <div className="flow-summary-amount">265 000 €</div>
          </div>
          <div className="flow-summary-card">
            <div className="flow-summary-label">Divestment</div>
            <div className="flow-summary-amount">24 000 000 €</div>
          </div>
        </section>

        {/* Fair value block */}
        <section className="compare-fairvalue-section">
          <div className="fairvalue-date-block">
            <div className="fairvalue-label">Fair Value</div>
            <button className="fairvalue-date-btn">31/03/2025</button>
          </div>
          <div className="fairvalue-inputs">
            <div className="fairvalue-input-group">
              <label className="fairvalue-input-label">Amount</label>
              <input
                className="fairvalue-input"
                type="text"
                defaultValue="13 500 000"
              />
            </div>
            <div className="fairvalue-input-group">
              <label className="fairvalue-input-label">FX Rate*</label>
              <input
                className="fairvalue-input"
                type="text"
                defaultValue="1.10"
              />
            </div>
            <div className="fairvalue-input-group">
              <label className="fairvalue-input-label">Amount LC *</label>
              <input
                className="fairvalue-input"
                type="text"
                defaultValue="15 000 000"
              />
            </div>
          </div>
        </section>

        {/* Flows table */}
        <section className="compare-flows-table-section">
          <div className="flows-table-header">
            <span className="flows-title">Flows</span>
          </div>
          <div className="flows-table-wrapper">
            <table className="flows-table">
              <thead>
                <tr>
                  <th>Flow</th>
                  <th>Date</th>
                  <th>Amount (€)</th>
                  <th>FX Rate</th>
                  <th>Amount LC</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Flow #1 */}
                <tr>
                  <td>#1</td>
                  <td>
                    <input
                      className="flow-input flow-date-input"
                      type="text"
                      defaultValue="02/02/23"
                    />
                  </td>
                  <td>
                    <input
                      className="flow-input"
                      type="text"
                      defaultValue="-10 000 000"
                    />
                  </td>
                  <td>
                    <input
                      className="flow-input"
                      type="text"
                      defaultValue="0.00"
                    />
                  </td>
                  <td>
                    <input
                      className="flow-input"
                      type="text"
                      defaultValue="0,000.00LC"
                    />
                  </td>
                  <td>
                    <button className="flow-type-btn">
                      Investment
                      <ChevronDownIcon
                        className="icon-svg caret-icon"
                        style={smallIconStyle}
                      />
                    </button>
                  </td>
                  <td>
                    <div className="flow-actions">
                      <button className="icon-circle-btn">
                        <InformationCircleIcon
                          className="icon-svg"
                          style={iconStyle}
                        />
                      </button>
                      <button className="icon-circle-btn">
                        <EllipsisVerticalIcon
                          className="icon-svg"
                          style={iconStyle}
                        />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Flow #2 */}
                <tr>
                  <td>#2</td>
                  <td>
                    <input
                      className="flow-input flow-date-input"
                      type="text"
                      defaultValue="02/02/24"
                    />
                  </td>
                  <td>
                    <input
                      className="flow-input"
                      type="text"
                      defaultValue="-2 000 000"
                    />
                  </td>
                  <td>
                    <input
                      className="flow-input"
                      type="text"
                      defaultValue="0.00"
                    />
                  </td>
                  <td>
                    <input
                      className="flow-input"
                      type="text"
                      defaultValue="0,000.00LC"
                    />
                  </td>
                  <td>
                    <button className="flow-type-btn">
                      Investment
                      <ChevronDownIcon
                        className="icon-svg caret-icon"
                        style={smallIconStyle}
                      />
                    </button>
                  </td>
                  <td>
                    <div className="flow-actions">
                      <button className="icon-circle-btn">
                        <InformationCircleIcon
                          className="icon-svg"
                          style={iconStyle}
                        />
                      </button>
                      <button className="icon-circle-btn">
                        <EllipsisVerticalIcon
                          className="icon-svg"
                          style={iconStyle}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button className="new-flow-btn">+ New Flow</button>
        </section>

        {/* Footer */}
        <section className="compare-footer-section">
          <div className="performance-title">Performance</div>
          <div className="compare-footer-actions">
            <button className="compare-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="compare-save-btn">Save</button>
          </div>
        </section>
      </aside>
    </div>
  );
};

export default CompareDetailPanel;
