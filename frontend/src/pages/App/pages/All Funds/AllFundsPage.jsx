// frontend/src/pages/App/pages/All Funds/AllFundsPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FundList from "./components/FundList";
import NewFundModal from "./components/NewFundModal";
import KPIsTable from "./components/KPIsTable";
import "./AllFundsPageStyles.css";


const MOCK_FUNDS = [
  {
    id: 1,
    name: "Asterium Fund I",
    createdOn: "15/03/2025",
    badgeText: "Investment period",
    badgeTone: "info",
    grossIrr: "16.78%",
    netIrr: "10.23%",
    deals: 5,

    // KPI fields (mock for now)
    dpi: "0.00x",
    rvpi: "1.25x",
    tvpi: "1.25x",
  },
  {
    id: 2,
    name: "Silvergate Ventures",
    createdOn: "20/07/2023",
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

  const [activeTab, setActiveTab] = useState("funds"); // "funds" | "kpis"
  const [query, setQuery] = useState("");
  const [isNewFundOpen, setIsNewFundOpen] = useState(false);

  const normalizedQuery = (query || "").toLowerCase().trim();

  const filteredFunds = useMemo(() => {
    if (!normalizedQuery) return MOCK_FUNDS;
    return MOCK_FUNDS.filter((f) =>
      f.name.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const handleCardClick = (fundId) => {
    navigate(`/funds/${fundId}/dashboard`);
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
          <span className="search-icon" />
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
        onCreate={(payload) => {
          console.log("Create fund:", payload);
          setIsNewFundOpen(false);
        }}
      />
    </div>
  );
}
