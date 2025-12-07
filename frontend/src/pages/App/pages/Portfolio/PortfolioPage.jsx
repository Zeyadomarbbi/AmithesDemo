import React, { useState } from "react";
import "./PortfolioPage.css";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";





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

// ======== COMPARE TAB DATA =========
const COMPARE_ROWS = [
  {
    id: 1,
    name: "Alyra BioTech",
    sector: "BioTech",
    costQ1: "8 000 000",
    costQ2: "8 000 000",
    diff: "-",
    fvQ1: "15 000 000",
    fvQ2: "16 500 000",
    change: "- 1 500 000",
    moicQ1: "1.88x",
    moicQ2: "2.06x",
  },
  {
    id: 2,
    name: "SBM Health Healthcare",
    sector: "Healthcare",
    costQ1: "10 000 000",
    costQ2: "9 000 000",
    diff: "1 000 000",
    fvQ1: "16 000 000",
    fvQ2: "12 000 000",
    change: "4 000 000",
    moicQ1: "1.60x",
    moicQ2: "1.33x",
  },
  {
    id: 3,
    name: "Vantech AI",
    sector: "AI",
    costQ1: "9 000 000",
    costQ2: "8 500 000",
    diff: "500 000",
    fvQ1: "18 000 000",
    fvQ2: "15 000 000",
    change: "3 000 000",
    moicQ1: "2.00x",
    moicQ2: "1.76x",
  },
  {
    id: 4,
    name: "Medisis Industry",
    sector: "Industry",
    costQ1: "9 000 000",
    costQ2: "9 000 000",
    diff: "-",
    fvQ1: "13 000 000",
    fvQ2: "13 000 000",
    change: "-",
    moicQ1: "1.44x",
    moicQ2: "1.44x",
  },
];

const COMPARE_TOTAL_ROW = {
  costQ1: "36 000 000",
  costQ2: "34 500 000",
  diff: "1 500 000",
  fvQ1: "62 000 000",
  fvQ2: "59 500 000",
  change: "5 500 000",
  moicQ1: "1.72x",
  moicQ2: "1.72x",
};
// ======== FX – Portfolio view (one table) =========
const FX_PORTFOLIO_ROWS = [
  {
    id: 1,
    name: "Investment #1",
    cost: "12 104 000",
    currency: "USD",
    fxEntry: "1.0578",
    impactQ42023: "127 934",
    impactQ22024: "- 42 385",
    impactQ42024: "98 415",
    impactInception: "92 814",
  },
  {
    id: 2,
    name: "Investment #2",
    cost: "11 323 000",
    currency: "USD",
    fxEntry: "1.1065",
    impactQ42023: "- 96 517",
    impactQ22024: "117 300",
    impactQ42024: "137 982",
    impactInception: "54 772",
  },
  {
    id: 3,
    name: "Investment #3",
    cost: "14 949 000",
    currency: "EUR",
    fxEntry: "1.0000",
    impactQ42023: "84 209",
    impactQ22024: "- 31 458",
    impactQ42024: "- 42 376",
    impactInception: "112 009",
  },
  {
    id: 4,
    name: "Investment #4",
    cost: "13 300 000",
    currency: "GBP",
    fxEntry: "0.8801",
    impactQ42023: "- 61 239",
    impactQ22024: "- 26 811",
    impactQ42024: "122 594",
    impactInception: "- 26 435",
  },
  {
    id: 5,
    name: "Investment #5",
    cost: "13 191 000",
    currency: "MAD",
    fxEntry: "10.8700",
    impactQ42023: "72 011",
    impactQ22024: "- 15 073",
    impactQ42024: "- 18 706",
    impactInception: "78 660",
  },
  {
    id: 6,
    name: "Investment #6",
    cost: "14 727 000",
    currency: "ZAR",
    fxEntry: "20.7820",
    impactQ42023: "- 42 286",
    impactQ22024: "- 5 874",
    impactQ42024: "76 801",
    impactInception: "- 31 728",
  },
  {
    id: 7,
    name: "Investment #7",
    cost: "9 047 000",
    currency: "EUR",
    fxEntry: "1.0000",
    impactQ42023: "35 188",
    impactQ22024: "- 16 048",
    impactQ42024: "62 307",
    impactInception: "50 221",
  },
  {
    id: 8,
    name: "Investment #8",
    cost: "12 392 000",
    currency: "GBP",
    fxEntry: "0.8554",
    impactQ42023: "- 64 385",
    impactQ22024: "- 3 653",
    impactQ42024: "83 555",
    impactInception: "45 927",
  },
];

const FX_PORTFOLIO_TOTAL = {
  cost: "97 257 000",
  fxEntry: "0.8762",
  impactQ42023: "52 572",
  impactQ22024: "- 16 660",
  impactQ42024: "520 572",
  impactInception: "376 240",
};


const Portfolio = () => {
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "fx" | "limits" | "compare"
  const [fxBreakdown, setFxBreakdown] = useState("deals");
  const [selectedCompareRow, setSelectedCompareRow] = useState(null); 
  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);// "deals" | "portfolio" | "charts"

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
        {activeTab === "summary" && (
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
                <button
    className="primary-btn"
    onClick={() => setIsNewInvestmentOpen(true)}
  >
    + New investment
  </button>

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
                              <div className="name-main">{row.name}</div>
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
                              <div className="name-main">{row.name}</div>
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
                Impact Q4 2023 (€) <span className="sort-indicator">↕</span>
              </th>
              <th className="col-number">
                Impact Q2 2024 (€) <span className="sort-indicator">↕</span>
              </th>
              <th className="col-number">
                Impact Q4 2024 (€) <span className="sort-indicator">↕</span>
              </th>
              <th className="col-number">
                Impact Inception (€) <span className="sort-indicator">↕</span>
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

            {/* Total row باللون الأزرق */}
            <tr className="fx-total-row">
              <td className="fx-total-label">Total</td>
              <td className="col-number">{FX_PORTFOLIO_TOTAL.cost}</td>
              <td></td>
              <td className="col-number">{FX_PORTFOLIO_TOTAL.fxEntry}</td>
              <td className="col-number">{FX_PORTFOLIO_TOTAL.impactQ42023}</td>
              <td className="col-number">{FX_PORTFOLIO_TOTAL.impactQ22024}</td>
              <td className="col-number">{FX_PORTFOLIO_TOTAL.impactQ42024}</td>
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
    {/* الفلاتر فوق التشارت */}
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

    {/* كارت التشارت */}
    <div className="fx-charts-card">
      <div className="fx-charts-header">
        <div className="fx-charts-title">FX Gains / Losses (m€)</div>

        <button className="fx-charts-menu-btn">…</button>
      </div>

      <div className="fx-charts-body">
        {/* هنا placeholder للتشارت – ممكن بعدين نركّب Recharts أو Chart.js */}
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
          <section className="compare-section">
            {/* Timeframe selectors */}
            <div className="compare-timeframes-row">
              <button className="dropdown-btn">
                <span>Q2 2024</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
              <button className="dropdown-btn">
                <span>Q2 2025</span>
                <ChevronDownIcon
                  className="icon-svg caret-icon"
                  style={smallIconStyle}
                />
              </button>
            </div>

            {/* Compare table */}
            <div className="portfolio-table-card compare-table-card">
              <div className="portfolio-table-scroll">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th className="col-name">
                        Name <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Cost Q2 2024 (€){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Cost Q2 2025 (€){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number col-highlight">
                        Difference (€){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Fair value Q2 2024 (€){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        Fair value Q2 2025 (€){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number col-highlight">
                        Change (€) <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        MOIC Q2 2024 (net){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                      <th className="col-number">
                        MOIC Q2 2025 (net){" "}
                        <span className="sort-indicator">↕</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((row) => (
                                      <tr key={row.id} onClick={() => setSelectedCompareRow(row)}>
                                        <td className="name-cell compare-name-cell">
                                          <div className="name-main">{row.name}</div>
                                          <div className="name-sub">{row.sector}</div>
                                        </td>

                                            <td className="col-number">{row.costQ1}</td>
                        <td className="col-number">{row.costQ2}</td>
                        <td className="col-number col-highlight">{row.diff}</td>
                        <td className="col-number">{row.fvQ1}</td>
                        <td className="col-number">{row.fvQ2}</td>
                        <td className="col-number col-highlight">
                          {row.change}
                        </td>
                        <td className="col-number">{row.moicQ1}</td>
                        <td className="col-number">{row.moicQ2}</td>
                      </tr>
                    ))}

                    {/* Total row */}
                    <tr className="portfolio-subtotal-row total-row">
                      <td className="subtotal-name-cell">
                        <ArrowTrendingUpIcon
                          className="icon-svg subtotal-icon"
                          style={iconStyle}
                        />
                        <span>Total</span>
                      </td>
                      <td className="col-number">{COMPARE_TOTAL_ROW.costQ1}</td>
                      <td className="col-number">{COMPARE_TOTAL_ROW.costQ2}</td>
                      <td className="col-number col-highlight">
                        {COMPARE_TOTAL_ROW.diff}
                      </td>
                      <td className="col-number">{COMPARE_TOTAL_ROW.fvQ1}</td>
                      <td className="col-number">{COMPARE_TOTAL_ROW.fvQ2}</td>
                      <td className="col-number col-highlight">
                        {COMPARE_TOTAL_ROW.change}
                      </td>
                      <td className="col-number">{COMPARE_TOTAL_ROW.moicQ1}</td>
                      <td className="col-number">{COMPARE_TOTAL_ROW.moicQ2}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compare chart card */}
            <section className="compare-chart-section">
              <div className="compare-chart-card">
                <div className="compare-chart-header">
                  <span className="compare-chart-title">m€</span>
                  <div className="compare-chart-filters">
                    <button className="dropdown-btn">
                      <span>Select an investment</span>
                      <ChevronDownIcon
                        className="icon-svg caret-icon"
                        style={smallIconStyle}
                      />
                    </button>
                    <button className="dropdown-btn">
                      <span>Cost</span>
                      <ChevronDownIcon
                        className="icon-svg caret-icon"
                        style={smallIconStyle}
                      />
                    </button>
                    <button className="dropdown-btn">
                      <span>Timeframe (2)</span>
                      <ChevronDownIcon
                        className="icon-svg caret-icon"
                        style={smallIconStyle}
                      />
                    </button>
                  </div>
                </div>

                <div className="compare-chart-placeholder">
                  {/* Placeholder للـ area chart – ممكن يتستبدل بريـتشارتس/تشارت.js بعدين */}
                </div>
              </div>
              {selectedCompareRow && (
  <div
    className="compare-detail-overlay"
    onClick={() => setSelectedCompareRow(null)}
  >
    <aside
      className="compare-detail-panel"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ===== Header (اسم الاستثمار + الزرار الورا + أيقونات) ===== */}
      <div className="compare-detail-header">
        <button
          className="compare-back-btn"
          onClick={() => setSelectedCompareRow(null)}
        >
          <ArrowLeftIcon className="icon-svg" style={smallIconStyle} />
        </button>

        <div className="compare-investment-header">
          <div className="compare-investment-name">
            {selectedCompareRow.name}
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

      {/* ===== Summary tiles (Investment / Dividends / ... ) ===== */}
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

      {/* ===== Fair value block ===== */}
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

      {/* ===== Flows table ===== */}
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
              {/* صف 1 */}
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

              {/* تقدر تكرر الصف ده كام مرة كـ dummy rows */}
              {/* صف 2 */}
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

              {/* تقدر تزود باقي الصفوف بنفس الطريقة */}
            </tbody>
          </table>
        </div>

        <button className="new-flow-btn">+ New Flow</button>
      </section>

      {/* ===== Footer (Performance + Save/Cancel) ===== */}
      <section className="compare-footer-section">
        <div className="performance-title">Performance</div>

        <div className="compare-footer-actions">
          <button
            className="compare-cancel-btn"
            onClick={() => setSelectedCompareRow(null)}
          >
            Cancel
          </button>
          <button className="compare-save-btn">Save</button>
        </div>
      </section>
    </aside>
  </div>
)}


            </section>
          </section>
        )}
              {/* ===== New investment modal ===== */}
      {isNewInvestmentOpen && (
        <div
          className="investment-modal-overlay"
          onClick={() => setIsNewInvestmentOpen(false)}
        >
          <div
            className="investment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="investment-modal-header">
              <div className="investment-modal-icon">
                <DocumentIcon className="icon-svg" style={iconStyle} />
              </div>

              <div className="investment-modal-title-block">
                <h2 className="investment-modal-title">
                  Create a new investment
                </h2>
                <p className="investment-modal-subtitle">Description</p>
              </div>

              <button
                className="investment-modal-close"
                onClick={() => setIsNewInvestmentOpen(false)}
              >
                <XMarkIcon className="icon-svg" style={iconStyle} />
              </button>
            </div>

            {/* Body */}
            <div className="investment-modal-body">
              {/* Investment name */}
              <div className="investment-field">
                <label className="investment-label">
                  Investment name*
                </label>
                <input
                  className="investment-input"
                  type="text"
                  placeholder="Please enter the investment name..."
                />
              </div>

              {/* Sector / Geography */}
              <div className="investment-row">
                <div className="investment-field">
                  <label className="investment-label">Sector*</label>
                  <button className="investment-select">
                    <span>Select a sector</span>
                    <ChevronDownIcon
                      className="icon-svg caret-icon"
                      style={iconStyle}
                    />
                  </button>
                </div>

                <div className="investment-field">
                  <label className="investment-label">Geography*</label>
                  <button className="investment-select">
                    <span>Select a country</span>
                    <ChevronDownIcon
                      className="icon-svg caret-icon"
                      style={iconStyle}
                    />
                  </button>
                </div>
              </div>

              {/* Ownership / Local currency */}
              <div className="investment-row">
                <div className="investment-field">
                  <label className="investment-label">Ownership*</label>
                  <input
                    className="investment-input"
                    type="text"
                    placeholder="Please enter the ownership..."
                  />
                </div>

                <div className="investment-field">
                  <label className="investment-label">Local Currency*</label>
                  <button className="investment-select">
                    <span>Select a currency</span>
                    <ChevronDownIcon
                      className="icon-svg caret-icon"
                      style={iconStyle}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="investment-modal-footer">
              <button
                className="investment-cancel-btn"
                onClick={() => setIsNewInvestmentOpen(false)}
              >
                Cancel
              </button>
              <button className="investment-save-btn">Save</button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
};

export default Portfolio;
