// frontend/src/pages/App/pages/All Funds/AllFundsPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import FundList from "./components/FundList";
import NewFundModal from "./components/NewFundModal";
import KPIsTable from "./components/KPIsTable";
import Toast from "./components/Toast";

import "./AllFundsPageStyles.css";

/* Search icon used in the toolbar search box */
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

/**
 * Expected fund shape for future API
 */
const MOCK_FUNDS = [
  {
    id: 1,
    name: "Asterium Fund I",
    createdOn: "15/03/2025",
    country: "France",
    strategyCountries: ["France", "Italy", "Spain"],
    badgeText: "Investment period",
    badgeTone: "info",
    grossIrr: "16.78%",
    netIrr: "10.23%",
    deals: 5,
    dpi: "0.00x",
    rvpi: "1.25x",
    tvpi: "1.25x",
  },
  {
    id: 2,
    name: "Silvergate Ventures",
    createdOn: "20/07/2023",
    country: "UAE",
    strategyCountries: ["UAE", "Saudi Arabia", "Qatar"],
    badgeText: "Investment period",
    badgeTone: "info",
    grossIrr: "8.12%",
    netIrr: "5.78%",
    deals: 4,
    dpi: "0.11x",
    rvpi: "1.19x",
    tvpi: "1.30x",
  },
  {
    id: 3,
    name: "Northpoint PE Fund",
    createdOn: "18/06/2022",
    country: "Germany",
    strategyCountries: ["Germany", "Netherlands"],
    badgeText: "Investment period",
    badgeTone: "info",
    grossIrr: "5.87%",
    netIrr: "3.08%",
    deals: 3,
    dpi: "0.75x",
    rvpi: "0.85x",
    tvpi: "1.60x",
  },
  {
    id: 4,
    name: "Lynx Capital II",
    createdOn: "23/10/2021",
    country: "UK",
    strategyCountries: ["UK", "Ireland"],
    badgeText: "Divestment period",
    badgeTone: "warn",
    grossIrr: "13.20%",
    netIrr: "10.23%",
    deals: 7,
    dpi: "1.05x",
    rvpi: "0.85x",
    tvpi: "1.90x",
  },
  {
    id: 5,
    name: "Huron Growth Fund",
    createdOn: "30/06/2019",
    country: "Canada",
    strategyCountries: ["Canada", "USA"],
    badgeText: "Divestment period",
    badgeTone: "warn",
    grossIrr: "12.45%",
    netIrr: "7.23%",
    deals: 7,
    hasAlert: true,
    dpi: "0.22x",
    rvpi: "1.02x",
    tvpi: "1.24x",
  },
  {
    id: 6,
    name: "Orion Partners III",
    createdOn: "20/10/2018",
    country: "USA",
    strategyCountries: ["USA", "Mexico"],
    badgeText: "Closed",
    badgeTone: "success",
    grossIrr: "18.60%",
    netIrr: "10.54%",
    deals: 10,
    dpi: "0.40x",
    rvpi: "1.10x",
    tvpi: "1.50x",
  },
  {
    id: 7,
    name: "Pioneer Equity I",
    createdOn: "18/01/2017",
    country: "Switzerland",
    strategyCountries: ["Switzerland", "Austria"],
    badgeText: "Closed",
    badgeTone: "success",
    grossIrr: "24.37%",
    netIrr: "15.03%",
    deals: 12,
    dpi: "1.30x",
    rvpi: "0.60x",
    tvpi: "1.90x",
  },
];

export default function AllFundsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("funds");
  const [query, setQuery] = useState("");
  const [isNewFundOpen, setIsNewFundOpen] = useState(false);

  // funds live in state (so we can add new ones)
  const [funds, setFunds] = useState(MOCK_FUNDS);

  // toast state (null = hidden)
  const [toast, setToast] = useState(null);

  const normalizedQuery = (query || "").toLowerCase().trim();

  const filteredFunds = useMemo(() => {
    if (!normalizedQuery) return funds;
    return funds.filter((f) =>
      (f.name || "").toLowerCase().includes(normalizedQuery)
    );
  }, [funds, normalizedQuery]);

  const handleCardClick = (fundId) => {
    navigate(`/funds/${fundId}/dashboard`);
  };

  /**
   * Called by <NewFundModal /> when user clicks "Create"
   * payload = { legalName, shortName, formationDate, currency }
   */
  const handleCreateFund = (payload) => {
    const nextId =
      funds.length === 0
        ? 1
        : Math.max(...funds.map((f) => Number(f.id) || 0)) + 1;

    const newFund = {
      id: nextId,
      // use legal name as main display name
      name: payload.legalName || payload.shortName || "",
      createdOn: payload.formationDate || "",
      country: payload.country || "",
      strategyCountries: payload.strategyCountries || [],

      badgeText: payload.badgeText || "Investment period",
      badgeTone: payload.badgeTone || "info",

      grossIrr: payload.grossIrr || "–",
      netIrr: payload.netIrr || "–",
      deals: payload.deals ?? 0,

      dpi: payload.dpi || "–",
      rvpi: payload.rvpi || "–",
      tvpi: payload.tvpi || "–",

      hasAlert: payload.hasAlert || false,
    };

    // add to top of list
    setFunds((prev) => [newFund, ...prev]);
    // close modal
    setIsNewFundOpen(false);
    // show toast
    setToast({
      title: "Fund created",
      message: "The fund has been created successfully",
    });
  };

  return (
    <div className="allfunds-page">
      {/* ===== Header ===== */}
      <header className="allfunds-header">
        <h1 className="allfunds-title">All funds</h1>

        <div className="allfunds-tabs">
          <span
            className={`tab-link ${activeTab === "funds" ? "active" : ""}`}
            onClick={() => setActiveTab("funds")}
          >
            Funds list
          </span>
          <span
            className={`tab-link ${activeTab === "kpis" ? "active" : ""}`}
            onClick={() => setActiveTab("kpis")}
          >
            KPIs
          </span>
        </div>

        <div className="tabs-underline" />
      </header>

      {/* ===== Toolbar ===== */}
      <div className="allfunds-toolbar">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            <SearchIcon />
          </span>

          <input
            className="search-input"
            placeholder="Search by fund name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          className="new-fund-btn"
          onClick={() => setIsNewFundOpen(true)}
        >
          <span className="plus-icon">+</span>
          New fund
        </button>
      </div>

      {/* ===== Content ===== */}
      {activeTab === "funds" ? (
        <FundList funds={filteredFunds} onCardClick={handleCardClick} />
      ) : (
        <KPIsTable funds={filteredFunds} onFundClick={handleCardClick} />
      )}

      {/* ===== Modal ===== */}
      <NewFundModal
        open={isNewFundOpen}
        onClose={() => setIsNewFundOpen(false)}
        onCreate={handleCreateFund}
      />

      {/* ===== Toast ===== */}
      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </div>
  );
}
