import React, { useState } from "react";
import "./PortfolioPage.css";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState("summary");   const [fxBreakdown, setFxBreakdown] = useState("deals");
 
 
  return (
    <div className="portfolio-page">
      {}
      <header className="financials-topbar">
        <span className="fund-name">Asterium Fund I</span>
      </header>

      {}
      <main className="portfolio-content">
        {}
        <h1 className="financials-title">Portfolio</h1>

        {}
        <div className="financials-tabs portfolio-tabs">
  <button className={`tab ${activeTab === "summary" ? "active" : ""}`} onClick={() => setActiveTab("summary")}>Portfolio summary</button>
  <button className={`tab ${activeTab === "fx" ? "active" : ""}`} onClick={() => setActiveTab("fx")}>Portfolio FX</button>
  <button className={`tab ${activeTab === "limits" ? "active" : ""}`} onClick={() => setActiveTab("limits")}>Limits</button>
  <button className={`tab ${activeTab === "compare" ? "active" : ""}`} onClick={() => setActiveTab("compare")}>Compare</button>
</div>


        {}
        {}
{activeTab !== "limits" && activeTab !== "compare" && (
  <div className="portfolio-toolbar">
    <div className="toolbar-left">
      <button className="timeframe-btn">
        <span>Q2 2024</span>
        <ChevronDownIcon className="icon-svg caret-icon" />
      </button>
    </div>

    <div className="toolbar-right">
      <button className="ghost-btn">
        <ArrowUpTrayIcon className="icon-svg" />
        <span>Upload</span>
      </button>
      <button className="ghost-btn">
        <ArrowDownTrayIcon className="icon-svg" />
        <span>Download</span>
      </button>
      <button className="primary-btn">+ New investment</button>
    </div>
  </div>
)}

        {}
        {activeTab === "summary" && (
          <>
            {}
            <section className="portfolio-section">
              <div className="portfolio-table-card">
                {}
                <div className="portfolio-section-header">
                  <h2 className="portfolio-section-title">
                    Unrealized portfolio{" "}
                    <span className="portfolio-count">5</span>
                  </h2>
                  <div className="portfolio-table-tools">
                    <button className="icon-circle-btn">
                      <MagnifyingGlassIcon className="icon-svg" />
                    </button>
                    <button className="icon-circle-btn">
                      <FunnelIcon className="icon-svg" />
                    </button>
                  </div>
                </div>

                <div className="portfolio-table-scroll">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th className="col-name">
                          Name <span className="sort-indicator">↕</span>
                        </th>
                        <th>
                          Geography <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Ownership <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Cost (€) <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Divid./Int. (€){" "}
                          <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          MOIC (net) <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Gross IRR <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number col-highlight">
                          Fair value (€){" "}
                          <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number col-highlight">
                          Unreal. gain (€){" "}
                          <span className="sort-indicator">↕</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {}
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">
                            Alyra BioTech
                          </div>
                          <div className="name-sub">Healthcare</div>
                        </td>
                        <td>
                          <span className="flag">🇩🇪</span>
                          <span className="geo-label">Germany</span>
                        </td>
                        <td className="col-number">22.00%</td>
                        <td className="col-number">6 000 000</td>
                        <td className="col-number">-</td>
                        <td className="col-number">1.80x</td>
                        <td className="col-number">14.00%</td>
                        <td className="col-number col-highlight">
                          10 000 000
                        </td>
                        <td className="col-number col-highlight">
                          4 000 000
                        </td>
                      </tr>

                      {}
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">
                            SBM Health Healthcare
                          </div>
                          <div className="name-sub">Healthcare</div>
                        </td>
                        <td>
                          <span className="flag">🇫🇷</span>
                          <span className="geo-label">France</span>
                        </td>
                        <td className="col-number">15.00%</td>
                        <td className="col-number">6 000 000</td>
                        <td className="col-number">100 000</td>
                        <td className="col-number">1.76x</td>
                        <td className="col-number">18.71%</td>
                        <td className="col-number col-highlight">
                          9 500 000
                        </td>
                        <td className="col-number col-highlight">
                          3 500 000
                        </td>
                      </tr>

                      {}
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">Vantech AI</div>
                          <div className="name-sub">Technology</div>
                        </td>
                        <td>
                          <span className="flag">🇳🇱</span>
                          <span className="geo-label">Netherlands</span>
                        </td>
                        <td className="col-number">10.00%</td>
                        <td className="col-number">8 000 000</td>
                        <td className="col-number">200 000</td>
                        <td className="col-number">1.50x</td>
                        <td className="col-number">9.00%</td>
                        <td className="col-number col-highlight">
                          12 000 000
                        </td>
                        <td className="col-number col-highlight">
                          4 000 000
                        </td>
                      </tr>

                      {}
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">
                            Medisis Industry
                          </div>
                          <div className="name-sub">Healthcare</div>
                        </td>
                        <td>
                          <span className="flag">🇬🇧</span>
                          <span className="geo-label">UK</span>
                        </td>
                        <td className="col-number">15.00%</td>
                        <td className="col-number">10 000 000</td>
                        <td className="col-number">-</td>
                        <td className="col-number">1.50x</td>
                        <td className="col-number">12.00%</td>
                        <td className="col-number col-highlight">
                          15 000 000
                        </td>
                        <td className="col-number col-highlight">
                          5 000 000
                        </td>
                      </tr>

                      {}
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">
                            NeoGrid Industry
                          </div>
                          <div className="name-sub">Industry</div>
                        </td>
                        <td>
                          <span className="flag">🇫🇷</span>
                          <span className="geo-label">France</span>
                        </td>
                        <td className="col-number">18.00%</td>
                        <td className="col-number">10 000 000</td>
                        <td className="col-number">300 000</td>
                        <td className="col-number">2.10x</td>
                        <td className="col-number">15.00%</td>
                        <td className="col-number col-highlight">
                          21 000 000
                        </td>
                        <td className="col-number col-highlight">
                          11 000 000
                        </td>
                      </tr>

                      {}
                      <tr className="portfolio-subtotal-row">
                        <td className="subtotal-name-cell">
                          <ArrowTrendingUpIcon className="icon-svg subtotal-icon" />
                          <span>Sub Total</span>
                        </td>
                        <td />
                        <td className="col-number">-</td>
                        <td className="col-number">40 000 000</td>
                        <td className="col-number">500 000</td>
                        <td className="col-number">1.92x</td>
                        <td className="col-number">13.62%</td>
                        <td className="col-number col-highlight">
                          67 500 000
                        </td>
                        <td className="col-number col-highlight">
                          27 500 000
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {}
            <section className="portfolio-section">
              <div className="portfolio-table-card">
                <div className="portfolio-section-header">
                  <h2 className="portfolio-section-title">
                    Realized portfolio <span className="portfolio-count">2</span>
                  </h2>
                  <div className="portfolio-table-tools">
                    <button className="icon-circle-btn">
                      <MagnifyingGlassIcon className="icon-svg" />
                    </button>
                    <button className="icon-circle-btn">
                      <FunnelIcon className="icon-svg" />
                    </button>
                  </div>
                </div>

                <div className="portfolio-table-scroll">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th className="col-name">
                          Name <span className="sort-indicator">↕</span>
                        </th>
                        <th>
                          Geography <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Ownership <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Cost (€) <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Divid./Int. (€){" "}
                          <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          MOIC (net) <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number">
                          Gross IRR <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number col-highlight">
                          Exit value (€){" "}
                          <span className="sort-indicator">↕</span>
                        </th>
                        <th className="col-number col-highlight">
                          Realized (€){" "}
                          <span className="sort-indicator">↕</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">
                            Solenix Capital Bank
                          </div>
                          <div className="name-sub">Financials</div>
                        </td>
                        <td>
                          <span className="flag">🇳🇴</span>
                          <span className="geo-label">Norway</span>
                        </td>
                        <td className="col-number">12.00%</td>
                        <td className="col-number">4 500 000</td>
                        <td className="col-number">95 000</td>
                        <td className="col-number">2.30x</td>
                        <td className="col-number">16.00%</td>
                        <td className="col-number col-highlight">
                          10 350 000
                        </td>
                        <td className="col-number col-highlight">
                          5 850 000
                        </td>
                      </tr>
                      <tr>
                        <td className="name-cell">
                          <div className="name-main link-like">
                            Terapia Group Healthcare
                          </div>
                          <div className="name-sub">Healthcare</div>
                        </td>
                        <td>
                          <span className="flag">🇮🇹</span>
                          <span className="geo-label">Italy</span>
                        </td>
                        <td className="col-number">20.00%</td>
                        <td className="col-number">6 000 000</td>
                        <td className="col-number">200 000</td>
                        <td className="col-number">2.80x</td>
                        <td className="col-number">22.00%</td>
                        <td className="col-number col-highlight">
                          16 800 000
                        </td>
                        <td className="col-number col-highlight">
                          10 800 000
                        </td>
                      </tr>

                      <tr className="portfolio-subtotal-row">
                        <td className="subtotal-name-cell">
                          <ArrowTrendingUpIcon className="icon-svg subtotal-icon" />
                          <span>Sub Total</span>
                        </td>
                        <td />
                        <td className="col-number">-</td>
                        <td className="col-number">10 500 000</td>
                        <td className="col-number">295 000</td>
                        <td className="col-number">2.50x</td>
                        <td className="col-number">19.00%</td>
                        <td className="col-number col-highlight">
                          27 150 000
                        </td>
                        <td className="col-number col-highlight">
                          16 650 000
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {}
            <section className="portfolio-total-section">
              <table className="portfolio-table total-table">
                <tbody>
                  <tr className="portfolio-subtotal-row total-row">
                    <td className="subtotal-name-cell">
                      <ArrowTrendingUpIcon className="icon-svg subtotal-icon" />
                      <span>Total</span>
                    </td>
                    <td />
                    <td className="col-number">-</td>
                    <td className="col-number">50 500 000</td>
                    <td className="col-number">795 000</td>
                    <td className="col-number">1.95x</td>
                    <td className="col-number">15.26%</td>
                    <td className="col-number col-highlight">94 650 000</td>
                    <td className="col-number col-highlight">44 150 000</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </>
        )}

        {}
        {activeTab === "fx" && (
          <>
            {}
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
                {}
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
                              Flow (LC){" "}
                              <span className="sort-indicator">↕</span>
                            </th>
                            <th>
                              Currency{" "}
                              <span className="sort-indicator">↕</span>
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
                          <tr>
                            <td>18/06/2021</td>
                            <td className="col-number">10 000 000</td>
                            <td>GBP</td>
                            <td className="col-number">0.8801</td>
                            <td className="col-number">21 547</td>
                            <td className="col-number">- 5 785</td>
                            <td className="col-number">210 547</td>
                            <td className="col-number">150 875</td>
                          </tr>
                          <tr>
                            <td>23/10/2021</td>
                            <td className="col-number">2 000 000</td>
                            <td>GBP</td>
                            <td className="col-number">0.8554</td>
                            <td className="col-number">31 025</td>
                            <td className="col-number">- 10 875</td>
                            <td className="col-number">310 025</td>
                            <td className="col-number">225 365</td>
                          </tr>

                          <tr className="fx-total-row">
                            <td className="fx-total-label">Total</td>
                            <td className="col-number">12 000 000</td>
                            <td />
                            <td className="col-number">0.8762</td>
                            <td className="col-number">52 572</td>
                            <td className="col-number">- 16 660</td>
                            <td className="col-number">520 572</td>
                            <td className="col-number">376 240</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {}
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
                              Flow (LC){" "}
                              <span className="sort-indicator">↕</span>
                            </th>
                            <th>
                              Currency{" "}
                              <span className="sort-indicator">↕</span>
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
                          <tr>
                            <td>01/02/2024</td>
                            <td className="col-number">4 500 000</td>
                            <td>USD</td>
                            <td className="col-number">1.0807</td>
                            <td className="col-number">-</td>
                            <td className="col-number">124 574</td>
                            <td className="col-number">117 874</td>
                            <td className="col-number">117 874</td>
                          </tr>
                          <tr>
                            <td>08/02/2024</td>
                            <td className="col-number">3 500 000</td>
                            <td>USD</td>
                            <td className="col-number">1.0807</td>
                            <td className="col-number">-</td>
                            <td className="col-number">101 631</td>
                            <td className="col-number">97 320</td>
                            <td className="col-number">97 320</td>
                          </tr>
                          <tr>
                            <td>13/11/2024</td>
                            <td className="col-number">2 500 000</td>
                            <td>USD</td>
                            <td className="col-number">1.1053</td>
                            <td className="col-number">-</td>
                            <td className="col-number">- 95 157</td>
                            <td className="col-number">- 101 965</td>
                            <td className="col-number">- 101 965</td>
                          </tr>

                          <tr className="fx-total-row">
                            <td className="fx-total-label">Total</td>
                            <td className="col-number">10 500 000</td>
                            <td />
                            <td className="col-number">1.0964</td>
                            <td className="col-number">-</td>
                            <td className="col-number">131 048</td>
                            <td className="col-number">113 229</td>
                            <td className="col-number">113 229</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {}
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
                              Flow (LC){" "}
                              <span className="sort-indicator">↕</span>
                            </th>
                            <th>
                              Currency{" "}
                              <span className="sort-indicator">↕</span>
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
                          <tr>
                            <td>18/06/2021</td>
                            <td className="col-number">100 000 000</td>
                            <td>MAD</td>
                            <td className="col-number">10.8801</td>
                            <td className="col-number">210 547</td>
                            <td className="col-number">- 50 785</td>
                            <td className="col-number">210 547</td>
                            <td className="col-number">150 875</td>
                          </tr>
                          <tr>
                            <td>23/10/2021</td>
                            <td className="col-number">20 000 000</td>
                            <td>MAD</td>
                            <td className="col-number">10.8554</td>
                            <td className="col-number">310 025</td>
                            <td className="col-number">- 100 875</td>
                            <td className="col-number">310 025</td>
                            <td className="col-number">225 365</td>
                          </tr>

                          <tr className="fx-total-row">
                            <td className="fx-total-label">Total</td>
                            <td className="col-number">120 000 000</td>
                            <td />
                            <td className="col-number">10.8762</td>
                            <td className="col-number">520 572</td>
                            <td className="col-number">- 160 660</td>
                            <td className="col-number">520 572</td>
                            <td className="col-number">376 240</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </>
            )}

            {fxBreakdown !== "deals" && (
              <div className="fx-placeholder">
                {fxBreakdown === "portfolio"
                  ? "Portfolio FX breakdown (portfolio view) can be wired later."
                  : "FX charts view can be wired later."}
              </div>
            )}
          </>
        )}

        {}
        {activeTab === "limits" && (
  <section className="limits-section">
    
    {}
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

      <button className="new-limit-btn">+ New limit</button>
    </div>

    {}
    <div className="limits-table-wrapper">
      <table className="limits-table">
        <thead>
          <tr>
            <th>Name <span className="sort-indicator">↕</span></th>
            <th>Description</th>
            <th className="col-number">Limits <span className="sort-indicator">↕</span></th>
            <th className="col-number">Q4 2024 <span className="sort-indicator">↕</span></th>
            <th className="col-number">Scenario Optimi… <span className="sort-indicator">↕</span></th>
          </tr>
        </thead>

        <tbody>
          {}
          <tr>
            <td className="name-cell">
              <div className="name-main">Singlet ticket</div>
              <div className="name-sub">Art 12.7</div>
            </td>
            <td>No single investment shall represent more than 15.00%</td>
            <td className="col-number">15.00%</td>
            <td className="col-number">13.15%</td>
            <td className="col-number breach-red">15.00%</td>
          </tr>

          {}
          <tr>
            <td className="name-cell">
              <div className="name-main">Countries</div>
              <div className="name-sub">Art 12.8</div>
            </td>
            <td>No more than 60.00% shall be invested in Spain</td>
            <td className="col-number">60.00%</td>
            <td className="col-number">22.04%</td>
            <td className="col-number">40.08%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
)}

        {activeTab === "compare" && (
          <div className="tab-placeholder">
            Compare view will be implemented later.
          </div>
        )}
      </main>
    </div>
  );
};

export default Portfolio;