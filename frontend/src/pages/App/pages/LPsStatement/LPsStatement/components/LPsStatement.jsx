// src/pages/App/pages/LPsStatement/components/LPsStatement.jsx
import React from "react";
import "./lPsStatement.css";

import CapitalFlows from "./CapitalFlows.jsx";
import CapitalAccountStatement from "./CapitalAccountStatement.jsx";
import Limits from "./Limits.jsx";

export const INITIAL_LPS = [
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

/* -------- helpers -------- */
function parseAmount(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/\s/g, "");
  return Number(cleaned) || 0;
}

function parsePercent(value) {
  if (!value) return 0;
  const cleaned = String(value).replace("%", "");
  return Number(cleaned) || 0;
}

function formatAmount(num) {
  return (Number(num) || 0).toLocaleString("fr-FR");
}

function formatPercent(num) {
  return `${(Number(num) || 0).toFixed(2)}%`;
}

/* Small sort icon placeholder used in headers */
const Sort = () => <span className="sort-icon" />;

/* 🔍 Search icon – Figma SVG you provided */
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_21781_20960)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.33301 2.66732C4.75568 2.66732 2.66634 4.75666 2.66634 7.33398C2.66634 9.91131 4.75568 12.0007 7.33301 12.0007C8.5903 12.0007 9.73147 11.5034 10.5706 10.6949C10.5881 10.6721 10.6074 10.6501 10.6283 10.6292C10.6492 10.6083 10.6711 10.5891 10.6939 10.5716C11.5025 9.73245 11.9997 8.59128 11.9997 7.33398C11.9997 4.75666 9.91034 2.66732 7.33301 2.66732ZM12.0209 11.0791C12.842 10.0527 13.333 8.75066 13.333 7.33398C13.333 4.02028 10.6467 1.33398 7.33301 1.33398C4.0193 1.33398 1.33301 4.02028 1.33301 7.33398C1.33301 10.6477 4.0193 13.334 7.33301 13.334C8.74968 13.334 10.0517 12.843 11.0781 12.0219L13.5283 14.4721C13.7886 14.7324 14.2107 14.7324 14.4711 14.4721C14.7314 14.2117 14.7314 13.7896 14.4711 13.5292L12.0209 11.0791Z"
        fill="#375A89"
      />
    </g>
    <defs>
      <clipPath id="clip0_21781_20960">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

/* ====================================================== */
/* =============== COMPONENT START ======================= */
/* ====================================================== */

export default function LPsStatement({
  lps = INITIAL_LPS,
  onOpenTransfer,
  onOpenNewLp,
  onOpenPeriod,
  onSelectLP,
}) {
  const [activeTab, setActiveTab] = React.useState("register");

  /* FILTER STATES */
  const [activeClass, setActiveClass] = React.useState(null); // null = show all (no filter)
  const [searchTerm, setSearchTerm] = React.useState("");

  /* FILTERED LP LIST */
  const filteredLps = React.useMemo(() => {
    let list = [...lps];

    // CLASS FILTER (only if something is selected)
    if (activeClass) {
      list = list.filter((lp) =>
        lp.class.toLowerCase().includes(activeClass.toLowerCase())
      );
    }

    // SEARCH FILTER
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter((lp) => lp.name.toLowerCase().includes(term));
    }

    return list;
  }, [lps, activeClass, searchTerm]);

  /* TOTALS (based on filtered list) */
  const totals = React.useMemo(() => {
    let shares = 0,
      commitment = 0,
      ownership = 0,
      first = 0,
      second = 0;

    filteredLps.forEach((lp) => {
      shares += parseAmount(lp.shares);
      commitment += parseAmount(lp.commitment);
      ownership += parsePercent(lp.ownership);
      first += parseAmount(lp.firstClosing);
      second += parseAmount(lp.secondClosing);
    });

    return {
      shares: formatAmount(shares),
      commitment: formatAmount(commitment),
      ownership: formatPercent(ownership),
      firstClosing: formatAmount(first),
      secondClosing: formatAmount(second),
    };
  }, [filteredLps]);

  // small X inside active chip: clear filter, back to default
  const clearClassFilter = (e) => {
    e.stopPropagation(); // don't re-trigger chip click
    setActiveClass(null);
  };

  return (
    <section className="lp-page">
      {/* TITLE */}
      <h1 className="lp-page-title">LPs Statement</h1>

      {/* TABS */}
      <div className="lp-tabs-wrapper">
        <div className="lp-tabs">
          <button
            className={`lp-tab ${
              activeTab === "register" ? "lp-tab-active" : ""
            }`}
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
            className={`lp-tab ${
              activeTab === "limits" ? "lp-tab-active" : ""
            }`}
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
        </div>
      </div>

      {/* REGISTER TAB */}
      {activeTab === "register" && (
        <>
          {/* SEARCH + CHIPS + BUTTONS */}
          <div className="lp-toolbar">
            <div className="lp-toolbar-left">
              {/* SEARCH */}
              <div className="search-input-wrapper">
                <span className="search-icon">
                  <SearchIcon />
                </span>
                <input
                  className="search-input"
                  placeholder="Search by LP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* CLASS FILTER (chips with small X when active) */}
              <div className="lp-class-filter">
                <button
                  className={`lp-chip ${
                    activeClass === "A1" ? "lp-chip-active" : ""
                  }`}
                  onClick={() => setActiveClass("A1")}
                  type="button"
                >
                  <span className="lp-chip-label">Class A1</span>
                  {activeClass === "A1" && (
                    <span
                      className="lp-chip-clear"
                      onClick={clearClassFilter}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.79981 0.800781L0.799805 8.80078M0.799805 0.800781L8.79981 8.80078"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>

                <button
                  className={`lp-chip ${
                    activeClass === "B" ? "lp-chip-active" : ""
                  }`}
                  onClick={() => setActiveClass("B")}
                  type="button"
                >
                  <span className="lp-chip-label">Class B</span>
                  {activeClass === "B" && (
                    <span
                      className="lp-chip-clear"
                      onClick={clearClassFilter}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.79981 0.800781L0.799805 8.80078M0.799805 0.800781L8.79981 8.80078"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>

                <button
                  className={`lp-chip ${
                    activeClass === "A2" ? "lp-chip-active" : ""
                  }`}
                  onClick={() => setActiveClass("A2")}
                  type="button"
                >
                  <span className="lp-chip-label">Class A2</span>
                  {activeClass === "A2" && (
                    <span
                      className="lp-chip-clear"
                      onClick={clearClassFilter}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.79981 0.800781L0.799805 8.80078M0.799805 0.800781L8.79981 8.80078"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="lp-toolbar-right">
              {/* Add transfer button (unchanged) */}
              <button
                className="btn-add-transfer"
                type="button"
                onClick={onOpenTransfer}
              >
                <span className="icon-transfer">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 12 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.19526 0.195262C8.45561 -0.0650874 8.87772 -0.0650874 9.13807 0.195262L11.8047 2.86193C12.0651 3.12228 12.0651 3.54439 11.8047 3.80474L9.13807 6.4714C8.87772 6.73175 8.45561 6.73175 8.19526 6.4714C7.93491 6.21105 7.93491 5.78894 8.19526 5.5286L9.72386 4H0.666667C0.298477 4 0 3.70152 0 3.33333C0 2.96514 0.298477 2.66667 0.666667 2.66667H9.72386L8.19526 1.13807C7.93491 0.877722 7.93491 0.455612 8.19526 0.195262ZM3.80474 6.86193C4.06509 7.12228 4.06509 7.54439 3.80474 7.80474L2.27614 9.33333H11.3333C11.7015 9.33333 12 9.63181 12 10C12 10.3682 11.7015 10.6667 11.3333 10.6667H2.27614L3.80474 12.1953C4.06509 12.4556 4.06509 12.8777 3.80474 13.1381C3.54439 13.3984 3.12228 13.3984 2.86193 13.1381L0.195262 10.4714C-0.0650874 10.2111 -0.0650874 9.78894 0.195262 9.5286L2.86193 6.86193C3.12228 6.60158 3.54439 6.60158 3.80474 6.86193Z"
                      fill="#7B7D7E"
                    />
                  </svg>
                </span>
                Add transfer
              </button>

              {/* New LP button (unchanged) */}
              <button
                className="btn-newlp"
                type="button"
                onClick={onOpenNewLp}
              >
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
                    <th className="th-left">
                      LPs <Sort />
                    </th>
                    <th className="th-left">
                      Share class <Sort />
                    </th>
                    {/* removed Nb of shares column */}
                    <th className="th-right">
                      Commitment (€) <Sort />
                    </th>
                    <th className="th-right">
                      Ownership <Sort />
                    </th>
                    <th className="th-right">
                      1st closing (€) <Sort />
                    </th>
                    <th className="th-right">
                      2nd closing (€) <Sort />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLps.map((lp) => (
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
                        <span className={`tag ${lp.classColor}`}>
                          {lp.class}
                        </span>
                      </td>

                      {/* removed nb of shares cell */}
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
                    {/* removed totals.shares cell */}
                    <td className="td-right">{totals.commitment}</td>
                    <td className="td-right">{totals.ownership}</td>
                    <td className="td-right">{totals.firstClosing}</td>
                    <td className="td-right">{totals.secondClosing}</td>
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

      {/* OTHER TABS */}
      {activeTab === "flows" && <CapitalFlows />}

      {activeTab === "cas" && <CapitalAccountStatement />}

      {activeTab === "limits" && <Limits />}
    </section>
  );
}
