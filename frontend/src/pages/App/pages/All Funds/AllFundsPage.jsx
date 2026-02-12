import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFundData } from "../../hooks/Core/FundContext"; 
import FundList from "./components/FundLists/FundList";
import NewFundModal from "./components/NewFund/NewFundModal";
import KPIsTable from "./components/Kpi/KPIsTable";
import Toast from "../../components/Toast/Toast";
import { PlusIcon, SearchIcon} from "../../../../components/Icons";

import "./AllFundsPage.css";

export default function AllFundsPage() {
  /** Call calculatefundportfolioKPI.js */
  const navigate = useNavigate();
  
  // Access state and actions from the Context
  const { funds, isLoading, error, initializeFund, setActiveFundId } = useFundData();

  const [activeTab, setActiveTab] = useState("funds");
  const [query, setQuery] = useState("");
  const [isNewFundOpen, setIsNewFundOpen] = useState(false);
  const [toast, setToast] = useState(null);

  /**
   * Effect: Ensure no fund is globally active when visiting this page.
   * This clears the active context so the SidePanel hides fund-specific links.
   */
  useEffect(() => {
    if (setActiveFundId) {
      setActiveFundId(null);
    }
  }, [setActiveFundId]);

  const normalizedQuery = (query || "").toLowerCase().trim();

  const filteredFunds = useMemo(() => {
    return funds.filter((f) =>
      (f.name || "").toLowerCase().includes(normalizedQuery)
    );
  }, [funds, normalizedQuery]);

  const handleCardClick = (fundId) => {
    // Existing funds go to Dashboard
    // The Guard will only stop them if they never finished the identity save
    navigate(`/funds/${fundId}/dashboard`);
  };

  const handleCreateFund = async (payload) => {
    const result = await initializeFund(payload);
    
    if (result.success && result.id) {
      // 1. Close the modal
      setIsNewFundOpen(false);
      
      // 2. Redirect to the specific settings tab for the new fund
      navigate(`/funds/${result.id}/settings/fund-identity`);
      
      // 3. Optional: show toast on the new page
      setToast({
        title: "Fund Initialized",
        message: "The new fund has been created successfully.",
      });
    } else {
      setToast({
        title: "Error",
        message: result.error || "Could not initialize fund.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="allfunds-page allfunds-flex-center">
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allfunds-page allfunds-flex-center allfunds-error">
        <p>Error loading funds: {error}</p>
      </div>
    );
  }

  return (
    <div className="allfunds-page">
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

      {activeTab === "funds" ? (
        <FundList funds={filteredFunds} onCardClick={handleCardClick} />
      ) : (
        <KPIsTable funds={filteredFunds} onFundClick={handleCardClick} />
      )}

      <NewFundModal
        open={isNewFundOpen}
        onClose={() => setIsNewFundOpen(false)}
        onCreate={handleCreateFund}
      />

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