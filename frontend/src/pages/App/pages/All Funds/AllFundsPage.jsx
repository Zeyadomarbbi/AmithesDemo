// AllFundsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFundData } from "../../hooks/Core/FundContext"; 
import FundList from "./components/FundLists/FundList";
import NewFundModal from "./components/NewFund/NewFundModal";
import KPIsTable from "./components/Kpi/KPIsTable";
import Toast from "../../components/Toast/Toast";
import SearchBar from "../../../../components/SearchBar/SearchBar";
import { PlusIcon } from "../../../../components/Icons";
import "./AllFundsPage.css";

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function PageSpinner({ label = "Loading..." }) {
  return (
    <>
      <style>{`
        @keyframes allfunds-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        minHeight: 320,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '2.5px solid #e5e7eb',
          borderTopColor: '#6b7280',
          animation: 'allfunds-spin 0.75s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, letterSpacing: '0.02em' }}>
          {label}
        </span>
      </div>
    </>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function PageError({ message }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 320,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        color: '#ef4444',
      }}>
        !
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
        Failed to load funds
      </span>
      {message && (
        <span style={{ fontSize: 12, color: '#9ca3af', maxWidth: 320, textAlign: 'center' }}>
          {message}
        </span>
      )}
    </div>
  );
}

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
        <button className="new-fund-btn" onClick={() => setIsNewFundOpen(true)}>
          <PlusIcon />
          <span>New fund</span>
        </button>
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