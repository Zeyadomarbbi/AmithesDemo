// src/pages/App/pages/LPsStatement/components/LPsStatement.jsx
import React from "react";
import CapitalFlows from "./CapitalFlows.jsx";
import "../LPsStatementPage.css"; // ✅ correct path (go up 1 folder)


const MOCK_LPS = [
  {
    initials: "AR",
    name: "Alice Right",
    class: "Class A1",
    classColor: "tag-purple",
    shares: "2 000",
    commitment: "2 000 000",
    ownership: "3.28%",
    firstClosing: "2 000 000",
    secondClosing: "2 000 000",
    createdOn: "April 18, 2024",
    address: "19 rue des Archives",
    city: "Paris",
    zip: "75003",
    country: "France",
    iban: "FR 3930 1234 5678 910",
    bank: "BNP Paribas",
    bic: "SWIFTXXX",
  },
  {
    initials: "AA",
    name: "AKA Partners",
    class: "Class A1",
    classColor: "tag-purple",
    shares: "25 000",
    commitment: "25 000 000",
    ownership: "40.98%",
    firstClosing: "20 000 000",
    secondClosing: "20 000 000",
  },
  {
    initials: "VD",
    name: "Vasco Durand",
    class: "Class B",
    classColor: "tag-yellow",
    shares: "500",
    commitment: "500 000",
    ownership: "0.82%",
    firstClosing: "500 000",
    secondClosing: "500 000",
  },
  {
    initials: "AF",
    name: "AST Feeder",
    class: "Class B",
    classColor: "tag-yellow",
    shares: "500",
    commitment: "500 000",
    ownership: "0.82%",
    firstClosing: "500 000",
    secondClosing: "500 000",
  },
  {
    initials: "CV",
    name: "CVC Capital",
    class: "Class A2",
    classColor: "tag-green",
    shares: "3 000",
    commitment: "3 000 000",
    ownership: "4.92%",
    firstClosing: "1 000 000",
    secondClosing: "1 000 000",
  },
  {
    initials: "JD",
    name: "Jean Dupont",
    class: "Class A2",
    classColor: "tag-green",
    shares: "20 000",
    commitment: "20 000 000",
    ownership: "32.79%",
    firstClosing: "15 000 000",
    secondClosing: "20 000 000",
  },
];

const Sort = () => <span className="sort-icon" />;

export default function LPsStatement({
  onOpenTransfer,
  onOpenNewLp,
  onOpenPeriod,
  onSelectLP,
}) {
  const [activeTab, setActiveTab] = React.useState("register");

  return (
    <section className="lp-page">
      {/* TITLE */}
      <h1 className="lp-page-title">LPs Statement</h1>

      {/* TABS */}
      {/* ✅ ONLY ADDITION: wrapper for full-width grey line + moving yellow underline */}
      <div className="lp-tabs-wrapper">
        <div className="lp-tabs">
          <button
            className={`lp-tab ${activeTab === "register" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            LPs Register
          </button>

          <button
            className={`lp-tab ${activeTab === "flows" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("flows")}
          >
            Capital flows
          </button>

          <button
            className={`lp-tab ${activeTab === "cas" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("cas")}
          >
            Capital Account Statement
          </button>

          <button
            className={`lp-tab ${activeTab === "limits" ? "lp-tab-active" : ""}`}
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
        </div>
      </div>

      {/* ========================== */}
      {/* LP REGISTER PAGE (DEFAULT) */}
      {/* ========================== */}
      {activeTab === "register" && (
        <>
          {/* SEARCH + CHIPS + BUTTONS */}
          <div className="lp-toolbar">
            <div className="lp-toolbar-left">
              <div className="search-input-wrapper">
                <span className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Search by LP..."
                />
              </div>

              {/* ✅ YOUR CODE kept exactly */}
              <div className="lp-class-filter chip-under-search">
                <button className="lp-chip lp-chip-active">Class A1</button>
                <button className="lp-chip">Class B</button>
                <button className="lp-chip">Class A2</button>
              </div>
            </div>

            <div className="lp-toolbar-right">
              <button
                className="btn-secondary btn-transfer"
                onClick={onOpenTransfer}
              >
                <span className="btn-transfer__icon" aria-hidden="true" />
                Add transfer
              </button>

              <button className="btn-newlp-grey" onClick={onOpenNewLp}>
                <span className="btn-plus">+</span>
                New LP
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="lp-table-row">
            <div className="lp-table-container">
              <table className="lp-table">
                <thead>
                  <tr>
                    <th className="th-left">LPs <Sort /></th>
                    <th className="th-left">Share class <Sort /></th>
                    <th className="th-right">Nb of sh... <Sort /></th>
                    <th className="th-right">Commitment (€) <Sort /></th>
                    <th className="th-right">Ownership <Sort /></th>
                    <th className="th-right">1st closing (€) <Sort /></th>
                    <th className="th-right">2nd closing (€) <Sort /></th>
                  </tr>
                </thead>

                <tbody>
                  {MOCK_LPS.map((lp) => (
                    <tr
                      key={lp.name}
                      className="lp-row-clickable"
                      onClick={() => onSelectLP(lp)}
                    >
                      <td className="td-left lp-cell">
                        <div className="lp-avatar">{lp.initials}</div>
                        <span className="lp-name">{lp.name}</span>
                      </td>

                      <td className="td-left">
                        <span className={`tag ${lp.classColor}`}>{lp.class}</span>
                      </td>

                      <td className="td-right">{lp.shares}</td>
                      <td className="td-right">{lp.commitment}</td>
                      <td className="td-right">{lp.ownership}</td>
                      <td className="td-right">{lp.firstClosing}</td>
                      <td className="td-right">{lp.secondClosing}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="lp-total-row">
                    <td className="td-left">Total</td>
                    <td />
                    <td className="td-right">61 000</td>
                    <td className="td-right">61 000 000</td>
                    <td className="td-right">100.00%</td>
                    <td className="td-right">38 000 000</td>
                    <td className="td-right">43 000 000</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button
              className="side-plus-btn"
              type="button"
              onClick={onOpenPeriod}
            >
              +
            </button>
          </div>
        </>
      )}

      {/* =================== */}
      {/* CAPITAL FLOWS PAGE */}
      {/* =================== */}
      {activeTab === "flows" && (
        <CapitalFlows onNewOperation={() => console.log("new operation")} />
      )}
    </section>
  );
}
