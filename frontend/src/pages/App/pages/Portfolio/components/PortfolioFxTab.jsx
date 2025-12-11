// components/PortfolioFxTab.jsx
import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  FX_INVESTMENT_1_ROWS,
  FX_INVESTMENT_2_ROWS,
  FX_INVESTMENT_3_ROWS,
  FX_PORTFOLIO_ROWS,
  FX_PORTFOLIO_TOTAL,
} from "../portfolioData";

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

const PortfolioFxTab = () => {
  const [fxBreakdown, setFxBreakdown] = useState("deals");

  return (
    <>
      <div className="fx-breakdown-row">
        <span className="fx-breakdown-label">Breakdown :</span>
        <button
          className={`fx-breakdown-pill ${
            fxBreakdown === "deals" ? "active" : ""
          }`}
          onClick={() => setFxBreakdown("deals")}
        >
          Deals
        </button>
        <button
          className={`fx-breakdown-pill ${
            fxBreakdown === "portfolio" ? "active" : ""
          }`}
          onClick={() => setFxBreakdown("portfolio")}
        >
          Portfolio
        </button>
        <button
          className={`fx-breakdown-pill ${
            fxBreakdown === "charts" ? "active" : ""
          }`}
          onClick={() => setFxBreakdown("charts")}
        >
          Charts
        </button>
      </div>

      {fxBreakdown === "deals" && (
        <>
          {/* Investment #1 */}
          <section className="fx-investment-section">
            <h2 className="fx-investment-title">Investment #1</h2>
            <div className="fx-table-card">
              <div className="fx-table-scroll">
                <table className="fx-table">
                  <thead>
                    <tr>
                      <th>
                        Date <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Flow (LC) <span className="sort-indicator">↕</span>
                      </th>
                      <th>
                        Currency <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        FX Rate <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q4 2023 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q2 2024 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q4 2024 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Inception (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FX_INVESTMENT_1_ROWS.map((row) =>
                      row.type === "total" ? (
                        <tr key={row.id} className="fx-total-row">
                          <td className="fx-total-label">{row.date}</td>
                          <td className="col-number">{row.flow}</td>
                          <td />
                          <td className="col-number">{row.fxRate}</td>
                          <td className="col-number">{row.impactQ42023}</td>
                          <td className="col-number">{row.impactQ22024}</td>
                          <td className="col-number">{row.impactQ42024}</td>
                          <td className="col-number">{row.impactInception}</td>
                        </tr>
                      ) : (
                        <tr key={row.id}>
                          <td>{row.date}</td>
                          <td className="col-number">{row.flow}</td>
                          <td>{row.currency}</td>
                          <td className="col-number">{row.fxRate}</td>
                          <td className="col-number">{row.impactQ42023}</td>
                          <td className="col-number">{row.impactQ22024}</td>
                          <td className="col-number">{row.impactQ42024}</td>
                          <td className="col-number">{row.impactInception}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Investment #2 */}
          <section className="fx-investment-section">
            <h2 className="fx-investment-title">Investment #2</h2>
            <div className="fx-table-card">
              <div className="fx-table-scroll">
                <table className="fx-table">
                  <thead>
                    <tr>
                      <th>
                        Date <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Flow (LC) <span className="sort-indicator">↕</span>
                      </th>
                      <th>
                        Currency <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        FX Rate <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q4 2023 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q2 2024 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q4 2024 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Inception (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FX_INVESTMENT_2_ROWS.map((row) =>
                      row.type === "total" ? (
                        <tr key={row.id} className="fx-total-row">
                          <td className="fx-total-label">{row.date}</td>
                          <td className="col-number">{row.flow}</td>
                          <td />
                          <td className="col-number">{row.fxRate}</td>
                          <td className="col-number">{row.impactQ42023}</td>
                          <td className="col-number">{row.impactQ22024}</td>
                          <td className="col-number">{row.impactQ42024}</td>
                          <td className="col-number">{row.impactInception}</td>
                        </tr>
                      ) : (
                        <tr key={row.id}>
                          <td>{row.date}</td>
                          <td className="col-number">{row.flow}</td>
                          <td>{row.currency}</td>
                          <td className="col-number">{row.fxRate}</td>
                          <td className="col-number">{row.impactQ42023}</td>
                          <td className="col-number">{row.impactQ22024}</td>
                          <td className="col-number">{row.impactQ42024}</td>
                          <td className="col-number">{row.impactInception}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Investment #3 */}
          <section className="fx-investment-section">
            <h2 className="fx-investment-title">Investment #3</h2>
            <div className="fx-table-card">
              <div className="fx-table-scroll">
                <table className="fx-table">
                  <thead>
                    <tr>
                      <th>
                        Date <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Flow (LC) <span className="sort-indicator">↕</span>
                      </th>
                      <th>
                        Currency <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        FX Rate <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q4 2023 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q2 2024 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Q4 2024 (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Impact Inception (€)
                        <span className="sort-indicator">↕</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FX_INVESTMENT_3_ROWS.map((row) =>
                      row.type === "total" ? (
                        <tr key={row.id} className="fx-total-row">
                          <td className="fx-total-label">{row.date}</td>
                          <td className="col-number">{row.flow}</td>
                          <td />
                          <td className="col-number">{row.fxRate}</td>
                          <td className="col-number">{row.impactQ42023}</td>
                          <td className="col-number">{row.impactQ22024}</td>
                          <td className="col-number">{row.impactQ42024}</td>
                          <td className="col-number">{row.impactInception}</td>
                        </tr>
                      ) : (
                        <tr key={row.id}>
                          <td>{row.date}</td>
                          <td className="col-number">{row.flow}</td>
                          <td>{row.currency}</td>
                          <td className="col-number">{row.fxRate}</td>
                          <td className="col-number">{row.impactQ42023}</td>
                          <td className="col-number">{row.impactQ22024}</td>
                          <td className="col-number">{row.impactQ42024}</td>
                          <td className="col-number">{row.impactInception}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {fxBreakdown === "portfolio" && (
        <section className="fx-investment-section">
          <h2 className="fx-investment-title">Portfolio FX</h2>
          <div className="fx-table-card">
            <div className="fx-table-scroll">
              <table className="fx-table">
                <thead>
                  <tr>
                    <th>
                      Name <span className="sort-indicator">↕</span>
                    </th>
                    <th className="col-number">
                      Cost <span className="sort-indicator">↕</span>
                    </th>
                    <th>
                      Currency <span className="sort-indicator">↕</span>
                    </th>
                    <th className="col-number">
                      FX Entry <span className="sort-indicator">↕</span>
                    </th>
                    <th className="col-number">
                      Impact Q4 2023 (€)
                      <span className="sort-indicator">↕</span>
                    </th>
                    <th className="col-number">
                      Impact Q2 2024 (€)
                      <span className="sort-indicator">↕</span>
                    </th>
                    <th className="col-number">
                      Impact Q4 2024 (€)
                      <span className="sort-indicator">↕</span>
                    </th>
                    <th className="col-number">
                      Impact Inception (€)
                      <span className="sort-indicator">↕</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FX_PORTFOLIO_ROWS.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td className="col-number">{row.cost}</td>
                      <td>{row.currency}</td>
                      <td className="col-number">{row.fxEntry}</td>
                      <td className="col-number">{row.impactQ42023}</td>
                      <td className="col-number">{row.impactQ22024}</td>
                      <td className="col-number">{row.impactQ42024}</td>
                      <td className="col-number">{row.impactInception}</td>
                    </tr>
                  ))}
                  <tr className="fx-total-row">
                    <td className="fx-total-label">Total</td>
                    <td className="col-number">{FX_PORTFOLIO_TOTAL.cost}</td>
                    <td />
                    <td className="col-number">{FX_PORTFOLIO_TOTAL.fxEntry}</td>
                    <td className="col-number">
                      {FX_PORTFOLIO_TOTAL.impactQ42023}
                    </td>
                    <td className="col-number">
                      {FX_PORTFOLIO_TOTAL.impactQ22024}
                    </td>
                    <td className="col-number">
                      {FX_PORTFOLIO_TOTAL.impactQ42024}
                    </td>
                    <td className="col-number">
                      {FX_PORTFOLIO_TOTAL.impactInception}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {fxBreakdown === "charts" && (
        <section className="fx-charts-section">
          <div className="fx-charts-filters-row">
            <button className="dropdown-btn">
              <span>Investment</span>
              <ChevronDownIcon
                className="icon-svg caret-icon"
                style={smallIconStyle}
              />
            </button>
            <button className="dropdown-btn">
              <span>Currency</span>
              <ChevronDownIcon
                className="icon-svg caret-icon"
                style={smallIconStyle}
              />
            </button>
            <button className="dropdown-btn">
              <span>Timeframes</span>
              <ChevronDownIcon
                className="icon-svg caret-icon"
                style={smallIconStyle}
              />
            </button>
          </div>

          <div className="fx-charts-card">
            <div className="fx-charts-header">
              <div className="fx-charts-title">FX Gains / Losses (m€)</div>
              <button className="fx-charts-menu-btn">…</button>
            </div>
            <div className="fx-charts-body">
              <div className="fx-charts-plot" />
              <div className="fx-charts-xlabels">
                <span>Q3 23</span>
                <span>Q4 23</span>
                <span>Q1 24</span>
                <span>Q2 24</span>
                <span>Q3 24</span>
                <span>Q4 24</span>
                <span>Q1 25</span>
                <span>Q2 25</span>
                <span>Q3 25</span>
                <span>Q4 25</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PortfolioFxTab;
