// AllFundsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFundData } from "../../hooks/Core/FundContext"; 
import { PermissionGate } from "../../../../hooks/Auth/PermissionGate.jsx";
import FundList from "./components/FundLists/FundList";
import NewFundModal from "./components/NewFund/NewFundModal";
import KPIsTable from "./components/Kpi/KPIsTable";
import Toast from "../../components/Toast/Toast";
import SearchBar from "../../../../components/SearchBar/SearchBar";
import { PlusIcon } from '/src/components/Icons/InteractiveIcons';
import { PageSpinner, PageError } from "../../../../components/LoadingScreens/LoadingScreens";
import "./AllFundsPage.css";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllFundsPage() {
  const navigate = useNavigate();
  const { funds, isLoading, error, initializeFund, setActiveFundId } = useFundData();

  const [activeTab, setActiveTab] = useState("funds");
  const [query, setQuery] = useState("");
  const [isNewFundOpen, setIsNewFundOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (setActiveFundId) setActiveFundId(null);
  }, [setActiveFundId]);

  const normalizedQuery = (query || "").toLowerCase().trim();
  const filteredFunds = useMemo(() => {
    return funds.filter((f) => (f.name || "").toLowerCase().includes(normalizedQuery));
  }, [funds, normalizedQuery]);

  const handleCardClick = (fundId) => navigate(`/funds/${fundId}/dashboard`);

  const handleCreateFund = async (payload) => {
    const result = await initializeFund(payload);
    if (result.success && result.id) {
      setIsNewFundOpen(false);
      navigate(`/funds/${result.id}/settings/fund-identity`);
      setToast({ title: "Fund Initialized", message: "The new fund has been created successfully." });
    } else {
      setToast({ title: "Error", message: result.error || "Could not initialize fund." });
    }
  };

  const renderContent = () => {
    if (isLoading) return <PageSpinner label="Loading fund data…" />;
    if (error) return <PageError message={error} />;

    if (activeTab === "funds") {
      return (
        <FundList
          funds={filteredFunds}
          onCardClick={handleCardClick}
        />
      );
    }

    return (
      <KPIsTable
        funds={filteredFunds}
        onFundClick={handleCardClick}
      />
    );
  };

  return (
    <div className="allfunds-page">
      <header className="allfunds-header">
        <h1 className="allfunds-title">All funds</h1>
        <div className="allfunds-tabs">
          <span className={`tab-link ${activeTab === "funds" ? "active" : ""}`} onClick={() => setActiveTab("funds")}>
            Funds list
          </span>
          <span className={`tab-link ${activeTab === "kpis" ? "active" : ""}`} onClick={() => setActiveTab("kpis")}>
            KPIs
          </span>
        </div>
        <div className="tabs-underline" />
      </header>

      <div className="allfunds-toolbar">
        <SearchBar
          placeholder="Search by fund name..."
          onSearch={setQuery}
        />
      <PermissionGate>
        <button className="new-fund-btn" onClick={() => setIsNewFundOpen(true)}>
          <PlusIcon />
          <span>New fund</span>
        </button>
      </PermissionGate>
      </div>

      {renderContent()}

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