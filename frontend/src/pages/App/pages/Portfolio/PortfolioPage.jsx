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

// ======== STATIC DATA (تتبدل بالـ DB بعدين) =========

// Unrealized portfolio
const UNREALIZED_ROWS = [
  {
    id: 1,
    type: "row",
    name: "Alyra BioTech",
    sector: "Healthcare",
    countryFlag: "🇩🇪",
    country: "Germany",
    ownership: "22.00%",
    cost: "6 000 000",
    dividends: "-",
    moic: "1.80x",
    irr: "14.00%",
    fairValue: "10 000 000",
    unrealizedGain: "4 000 000",
  },
  {
    id: 2,
    type: "row",
    name: "SBM Health Healthcare",
    sector: "Healthcare",
    countryFlag: "🇫🇷",
    country: "France",
    ownership: "15.00%",
    cost: "6 000 000",
    dividends: "100 000",
    moic: "1.76x",
    irr: "18.71%",
    fairValue: "9 500 000",
    unrealizedGain: "3 500 000",
  },
  {
    id: 3,
    type: "row",
    name: "Vantech AI",
    sector: "Technology",
    countryFlag: "🇳🇱",
    country: "Netherlands",
    ownership: "10.00%",
    cost: "8 000 000",
    dividends: "200 000",
    moic: "1.50x",
    irr: "9.00%",
    fairValue: "12 000 000",
    unrealizedGain: "4 000 000",
  },
  {
    id: 4,
    type: "row",
    name: "Medisis Industry",
    sector: "Healthcare",
    countryFlag: "🇬🇧",
    country: "UK",
    ownership: "15.00%",
    cost: "10 000 000",
    dividends: "-",
    moic: "1.50x",
    irr: "12.00%",
    fairValue: "15 000 000",
    unrealizedGain: "5 000 000",
  },
  {
    id: 5,
    type: "row",
    name: "NeoGrid Industry",
    sector: "Industry",
    countryFlag: "🇫🇷",
    country: "France",
    ownership: "18.00%",
    cost: "10 000 000",
    dividends: "300 000",
    moic: "2.10x",
    irr: "15.00%",
    fairValue: "21 000 000",
    unrealizedGain: "11 000 000",
  },
  {
    id: "unrealized-subtotal",
    type: "subtotal",
    cost: "40 000 000",
    dividends: "500 000",
    moic: "1.92x",
    irr: "13.62%",
    fairValue: "67 500 000",
    unrealizedGain: "27 500 000",
  },
];

// Realized portfolio
const REALIZED_ROWS = [
  {
    id: 1,
    type: "row",
    name: "Solenix Capital Bank",
    sector: "Financials",
    countryFlag: "🇳🇴",
    country: "Norway",
    ownership: "12.00%",
    cost: "4 500 000",
    dividends: "95 000",
    moic: "2.30x",
    irr: "16.00%",
    exitValue: "10 350 000",
    realized: "5 850 000",
  },
  {
    id: 2,
    type: "row",
    name: "Terapia Group Healthcare",
    sector: "Healthcare",
    countryFlag: "🇮🇹",
    country: "Italy",
    ownership: "20.00%",
    cost: "6 000 000",
    dividends: "200 000",
    moic: "2.80x",
    irr: "22.00%",
    exitValue: "16 800 000",
    realized: "10 800 000",
  },
  {
    id: "realized-subtotal",
    type: "subtotal",
    cost: "10 500 000",
    dividends: "295 000",
    moic: "2.50x",
    irr: "19.00%",
    exitValue: "27 150 000",
    realized: "16 650 000",
  },
];

// Limits
const LIMITS_ROWS = [
  {
    id: 1,
    name: "Single ticket",
    article: "Art 12.7",
    description: "No single investment shall represent more than 15.00%",
    limit: "15.00%",
    q4: "13.15%",
    scenario: "15.00%",
    isBreach: true,
  },
  {
    id: 2,
    name: "Countries",
    article: "Art 12.8",
    description: "No more than 60.00% shall be invested in Spain",
    limit: "60.00%",
    q4: "22.04%",
    scenario: "40.08%",
    isBreach: false,
  },
];

// FX – Investment #1
const FX_INVESTMENT_1_ROWS = [
  {
    id: 1,
    type: "row",
    date: "18/06/2021",
    flow: "10 000 000",
    currency: "GBP",
    fxRate: "0.8801",
    impactQ42023: "21 547",
    impactQ22024: "- 5 785",
    impactQ42024: "210 547",
    impactInception: "150 875",
  },
  {
    id: 2,
    type: "row",
    date: "23/10/2021",
    flow: "2 000 000",
    currency: "GBP",
    fxRate: "0.8554",
    impactQ42023: "31 025",
    impactQ22024: "- 10 875",
    impactQ42024: "310 025",
    impactInception: "225 365",
  },
  {
    id: "fx1-total",
    type: "total",
    date: "Total",
    flow: "12 000 000",
    currency: "",
    fxRate: "0.8762",
    impactQ42023: "52 572",
    impactQ22024: "- 16 660",
    impactQ42024: "520 572",
    impactInception: "376 240",
  },
];

// FX – Investment #2
const FX_INVESTMENT_2_ROWS = [
  {
    id: 1,
    type: "row",
    date: "01/02/2024",
    flow: "4 500 000",
    currency: "USD",
    fxRate: "1.0807",
    impactQ42023: "-",
    impactQ22024: "124 574",
    impactQ42024: "117 874",
    impactInception: "117 874",
  },
  {
    id: 2,
    type: "row",
    date: "08/02/2024",
    flow: "3 500 000",
    currency: "USD",
    fxRate: "1.0807",
    impactQ42023: "-",
    impactQ22024: "101 631",
    impactQ42024: "97 320",
    impactInception: "97 320",
  },
  {
    id: 3,
    type: "row",
    date: "13/11/2024",
    flow: "2 500 000",
    currency: "USD",
    fxRate: "1.1053",
    impactQ42023: "-",
    impactQ22024: "- 95 157",
    impactQ42024: "- 101 965",
    impactInception: "- 101 965",
  },
  {
    id: "fx2-total",
    type: "total",
    date: "Total",
    flow: "10 500 000",
    currency: "",
    fxRate: "1.0964",
    impactQ42023: "-",
    impactQ22024: "131 048",
    impactQ42024: "113 229",
    impactInception: "113 229",
  },
];

// FX – Investment #3
const FX_INVESTMENT_3_ROWS = [
  {
    id: 1,
    type: "row",
    date: "18/06/2021",
    flow: "100 000 000",
    currency: "MAD",
    fxRate: "10.8801",
    impactQ42023: "210 547",
    impactQ22024: "- 50 785",
    impactQ42024: "210 547",
    impactInception: "150 875",
  },
  {
    id: 2,
    type: "row",
    date: "23/10/2021",
    flow: "20 000 000",
    currency: "MAD",
    fxRate: "10.8554",
    impactQ42023: "310 025",
    impactQ22024: "- 100 875",
    impactQ42024: "310 025",
    impactInception: "225 365",
  },
  {
    id: "fx3-total",
    type: "total",
    date: "Total",
    flow: "120 000 000",
    currency: "",
    fxRate: "10.8762",
    impactQ42023: "520 572",
    impactQ22024: "- 160 660",
    impactQ42024: "520 572",
    impactInception: "376 240",
  },
];

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "fx" | "limits" | "compare"
  const [fxBreakdown, setFxBreakdown] = useState("deals"); // "deals" | "portfolio" | "charts"

  // ستايل إجباري للأيقونات علشان تبان مهما كان الثيم
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

  return (
    <div className="portfolio-page">
      {/* Top bar */}
      

      {/* Main content */}
      <main className="portfolio-content">
        {/* Title */}
        <h1 className="financials-title">Portfolio</h1>

        {/* Tabs */}
        <div className="financials-tabs portfolio-tabs">
          <button
            className={`tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Portfolio summary
          </button>
          <button
            className={`tab ${activeTab === "fx" ? "active" : ""}`}
            onClick={() => setActiveTab("fx")}
          >
            Portfolio FX
          </button>
          <button
            className={`tab ${activeTab === "limits" ? "active" : ""}`}
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
          <button
            className={`tab ${activeTab === "compare" ? "active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >
            Compare
          </button>
        </div>

        {/* Toolbar – only for summary + fx */}
        {activeTab !== "limits" && activeTab !== "compare" && (
          <div className="portfolio-toolbar">
            <div className="toolbar-left">
              <button className="timeframe-btn">
                <span>Q2 2024</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
            </div>

            <div className="toolbar-right">
              <button className="ghost-btn">
                <ArrowUpTrayIcon className="icon-svg" style={iconStyle} />
                <span>Upload</span>
              </button>
              <button className="ghost-btn">
                <ArrowDownTrayIcon className="icon-svg" style={iconStyle} />
                <span>Download</span>
              </button>
              <button className="primary-btn">+ New investment</button>
            </div>
          </div>
        )}

        {/* ================= SUMMARY TAB ================= */}
        {activeTab === "summary" && (
          <>
            {/* Unrealized portfolio */}
            <section className="portfolio-section">
              <div className="portfolio-table-card">
                <div className="portfolio-section-header">
                  <h2 className="portfolio-section-title">
                    Unrealized portfolio{" "}
                    <span className="portfolio-count">5</span>
                  </h2>
                  <div className="portfolio-table-tools">
                    <button className="icon-circle-btn">
                      <MagnifyingGlassIcon
                        className="icon-svg"
                        style={iconStyle}
                      />
                    </button>
                    <button className="icon-circle-btn">
                      <FunnelIcon className="icon-svg" style={iconStyle} />
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
                      {UNREALIZED_ROWS.map((row) =>
                        row.type === "subtotal" ? (
                          <tr key={row.id} className="portfolio-subtotal-row">
                            <td className="subtotal-name-cell">
                              <ArrowTrendingUpIcon
                                className="icon-svg subtotal-icon"
                                style={iconStyle}
                              />
                              <span>Sub Total</span>
                            </td>
                            <td />
                            <td className="col-number">-</td>
                            <td className="col-number">{row.cost}</td>
                            <td className="col-number">{row.dividends}</td>
                            <td className="col-number">{row.moic}</td>
                            <td className="col-number">{row.irr}</td>
                            <td className="col-number col-highlight">
                              {row.fairValue}
                            </td>
                            <td className="col-number col-highlight">
                              {row.unrealizedGain}
                            </td>
                          </tr>
                        ) : (
                          <tr key={row.id}>
                            <td className="name-cell">
                              <div className="name-main link-like">
                                {row.name}
                              </div>
                              <div className="name-sub">{row.sector}</div>
                            </td>
                            <td>
                              <span className="flag">{row.countryFlag}</span>
                              <span className="geo-label">{row.country}</span>
                            </td>
                            <td className="col-number">{row.ownership}</td>
                            <td className="col-number">{row.cost}</td>
                            <td className="col-number">{row.dividends}</td>
                            <td className="col-number">{row.moic}</td>
                            <td className="col-number">{row.irr}</td>
                            <td className="col-number col-highlight">
                              {row.fairValue}
                            </td>
                            <td className="col-number col-highlight">
                              {row.unrealizedGain}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Realized portfolio */}
            <section className="portfolio-section">
              <div className="portfolio-table-card">
                <div className="portfolio-section-header">
                  <h2 className="portfolio-section-title">
                    Realized portfolio{" "}
                    <span className="portfolio-count">2</span>
                  </h2>
                  <div className="portfolio-table-tools">
                    <button className="icon-circle-btn">
                      <MagnifyingGlassIcon
                        className="icon-svg"
                        style={iconStyle}
                      />
                    </button>
                    <button className="icon-circle-btn">
                      <FunnelIcon className="icon-svg" style={iconStyle} />
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
                      {REALIZED_ROWS.map((row) =>
                        row.type === "subtotal" ? (
                          <tr key={row.id} className="portfolio-subtotal-row">
                            <td className="subtotal-name-cell">
                              <ArrowTrendingUpIcon
                                className="icon-svg subtotal-icon"
                                style={iconStyle}
                              />
                              <span>Sub Total</span>
                            </td>
                            <td />
                            <td className="col-number">-</td>
                            <td className="col-number">{row.cost}</td>
                            <td className="col-number">{row.dividends}</td>
                            <td className="col-number">{row.moic}</td>
                            <td className="col-number">{row.irr}</td>
                            <td className="col-number col-highlight">
                              {row.exitValue}
                            </td>
                            <td className="col-number col-highlight">
                              {row.realized}
                            </td>
                          </tr>
                        ) : (
                          <tr key={row.id}>
                            <td className="name-cell">
                              <div className="name-main link-like">
                                {row.name}
                              </div>
                              <div className="name-sub">{row.sector}</div>
                            </td>
                            <td>
                              <span className="flag">{row.countryFlag}</span>
                              <span className="geo-label">{row.country}</span>
                            </td>
                            <td className="col-number">{row.ownership}</td>
                            <td className="col-number">{row.cost}</td>
                            <td className="col-number">{row.dividends}</td>
                            <td className="col-number">{row.moic}</td>
                            <td className="col-number">{row.irr}</td>
                            <td className="col-number col-highlight">
                              {row.exitValue}
                            </td>
                            <td className="col-number col-highlight">
                              {row.realized}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Total bar */}
            <section className="portfolio-total-section">
              <table className="portfolio-table total-table">
                <tbody>
                  <tr className="portfolio-subtotal-row total-row">
                    <td className="subtotal-name-cell">
                      <ArrowTrendingUpIcon
                        className="icon-svg subtotal-icon"
                        style={iconStyle}
                      />
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

        {/* ================= FX TAB ================= */}
        {activeTab === "fx" && (
          <>
            {/* FX breakdown pills */}
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
                          {FX_INVESTMENT_1_ROWS.map((row) =>
                            row.type === "total" ? (
                              <tr key={row.id} className="fx-total-row">
                                <td className="fx-total-label">{row.date}</td>
                                <td className="col-number">{row.flow}</td>
                                <td />
                                <td className="col-number">{row.fxRate}</td>
                                <td className="col-number">
                                  {row.impactQ42023}
                                </td>
                                <td className="col-number">
                                  {row.impactQ22024}
                                </td>
                                <td className="col-number">
                                  {row.impactQ42024}
                                </td>
                                <td className="col-number">
                                  {row.impactInception}
                                </td>
                              </tr>
                            ) : (
                              <tr key={row.id}>
                                <td>{row.date}</td>
                                <td className="col-number">{row.flow}</td>
                                <td>{row.currency}</td>
                                <td className="col-number">{row.fxRate}</td>
                                <td className="col-number">
                                  {row.impactQ42023}
                                </td>
                                <td className="col-number">
                                  {row.impactQ22024}
                                </td>
                                <td className="col-number">
                                  {row.impactQ42024}
                                </td>
                                <td className="col-number">
                                  {row.impactInception}
                                </td>
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
                          {FX_INVESTMENT_2_ROWS.map((row) =>
                            row.type === "total" ? (
                              <tr key={row.id} className="fx-total-row">
                                <td className="fx-total-label">{row.date}</td>
                                <td className="col-number">{row.flow}</td>
                                <td />
                                <td className="col-number">{row.fxRate}</td>
                                <td className="col-number">
                                  {row.impactQ42023}
                                </td>
                                <td className="col-number">
                                  {row.impactQ22024}
                                </td>
                                <td className="col-number">
                                  {row.impactQ42024}
                                </td>
                                <td className="col-number">
                                  {row.impactInception}
                                </td>
                              </tr>
                            ) : (
                              <tr key={row.id}>
                                <td>{row.date}</td>
                                <td className="col-number">{row.flow}</td>
                                <td>{row.currency}</td>
                                <td className="col-number">{row.fxRate}</td>
                                <td className="col-number">
                                  {row.impactQ42023}
                                </td>
                                <td className="col-number">
                                  {row.impactQ22024}
                                </td>
                                <td className="col-number">
                                  {row.impactQ42024}
                                </td>
                                <td className="col-number">
                                  {row.impactInception}
                                </td>
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
                          {FX_INVESTMENT_3_ROWS.map((row) =>
                            row.type === "total" ? (
                              <tr key={row.id} className="fx-total-row">
                                <td className="fx-total-label">{row.date}</td>
                                <td className="col-number">{row.flow}</td>
                                <td />
                                <td className="col-number">{row.fxRate}</td>
                                <td className="col-number">
                                  {row.impactQ42023}
                                </td>
                                <td className="col-number">
                                  {row.impactQ22024}
                                </td>
                                <td className="col-number">
                                  {row.impactQ42024}
                                </td>
                                <td className="col-number">
                                  {row.impactInception}
                                </td>
                              </tr>
                            ) : (
                              <tr key={row.id}>
                                <td>{row.date}</td>
                                <td className="col-number">{row.flow}</td>
                                <td>{row.currency}</td>
                                <td className="col-number">{row.fxRate}</td>
                                <td className="col-number">
                                  {row.impactQ42023}
                                </td>
                                <td className="col-number">
                                  {row.impactQ22024}
                                </td>
                                <td className="col-number">
                                  {row.impactQ42024}
                                </td>
                                <td className="col-number">
                                  {row.impactInception}
                                </td>
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

            {fxBreakdown !== "deals" && (
              <div className="fx-placeholder">
                {fxBreakdown === "portfolio"
                  ? "Portfolio FX breakdown (portfolio view) can be wired later."
                  : "FX charts view can be wired later."}
              </div>
            )}
          </>
        )}

        {/* ================= LIMITS TAB ================= */}
        {activeTab === "limits" && (
          <section className="limits-section">
            {/* Filters row */}
            <div className="limits-filters-row">
              <div className="limits-filters-left">
                <button className="dropdown-btn">
                  <span>Q2 2024</span>
                  <ChevronDownIcon
                    className="icon-svg caret-icon"
                    style={smallIconStyle}
                  />
                </button>

                <button className="dropdown-btn">
                  <span>Scenario Opti...</span>
                  <ChevronDownIcon
                    className="icon-svg caret-icon"
                    style={smallIconStyle}
                  />
                </button>
              </div>

              <button className="new-limit-btn">+ New limit</button>
            </div>

            {/* Limits table */}
            <div className="limits-table-wrapper">
              <table className="limits-table">
                <thead>
                  <tr>
                    <th>
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
                      Scenario Optimi…{" "}
                      <span className="sort-indicator">↕</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {LIMITS_ROWS.map((row) => (
                    <tr key={row.id}>
                      <td className="name-cell">
                        <div className="name-main">{row.name}</div>
                        <div className="name-sub limits-link">
                          {row.article}
                        </div>
                      </td>
                      <td>{row.description}</td>
                      <td className="col-number">{row.limit}</td>
                      <td className="col-number">{row.q4}</td>
                      <td
                        className={`col-number ${
                          row.isBreach ? "breach-red" : ""
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
        )}

        {/* ================= COMPARE TAB ================= */}
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
