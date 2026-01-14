// frontend/src/pages/App/pages/All Funds/AllFundsPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFundData } from "../../hooks/useFundData.js";
import FundList from "./components/FundLists/FundList";
import NewFundModal from "./components/NewFund/NewFundModal";
import KPIsTable from "./components/Kpi/KPIsTable";
import Toast from "./components/NewFund/Toast";
import { PlusIcon, SearchIcon} from "../../../../components/Icons";

import "./AllFundsPage.css";

export default function AllFundsPage() {
  const navigate = useNavigate();
  
  // 1. Initialize the custom hook
  const { funds, setFunds, isLoading, error, initializeFund } = useFundData();

  const [activeTab, setActiveTab] = useState("funds");
  const [query, setQuery] = useState("");
  const [isNewFundOpen, setIsNewFundOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const normalizedQuery = (query || "").toLowerCase().trim();

  // 2. Filter data provided by the hook
  const filteredFunds = useMemo(() => {
    return funds.filter((f) =>
      (f.name || "").toLowerCase().includes(normalizedQuery)
    );
  }, [funds, normalizedQuery]);

  const handleCardClick = (fundId) => {
    navigate(`/funds/${fundId}/dashboard`);
  };

  const handleCreateFund = async (payload) => {
    // payload contains: legalName, shortName, formationDate, currency_id
    const result = await initializeFund(payload);

    if (result.success) {
      setToast({
        title: "Fund Initialized",
        message: "The new fund has been created successfully.",
      });
    } else {
      // Show error toast if initialization fails
      setToast({
        title: "Error",
        message: result.error || "Could not initialize fund.",
      });
    }
  };

  // 3. Handle Loading and Error states
  if (isLoading) {
    return (
      <div className="allfunds-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allfunds-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', color: 'red' }}>
        <p>Error loading funds: {error}</p>
      </div>
    );
  }

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
          <PlusIcon />
          <span>New fund</span>
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