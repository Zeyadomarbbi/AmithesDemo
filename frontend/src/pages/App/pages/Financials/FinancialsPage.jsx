import React, { useState } from "react";
import PnLTab from "./components/PnLTab";
import LimitsTab from "./components/LimitsTab";
import "./FinancialsLayout.css";

const FinancialsPage = () => {
  const [activeTab, setActiveTab] = useState("pnl");

  return (
    <div className="financials-page">
      <main className="financials-content">
        <h1 className="financials-title">Financials</h1>

        {/* TABS Navigation */}
        <div className="financials-tabs">
          <button
            className={`tab ${activeTab === "pnl" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("pnl")}
          >
            P&L
          </button>

          <button
            className={`tab ${activeTab === "limits" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("limits")}
          >
            Limits
          </button>
        </div>

        {/* VIEW RENDERER */}
        {activeTab === "pnl" && <PnLTab />}
        {activeTab === "limits" && <LimitsTab />}
      </main>
    </div>
  );
};

export default FinancialsPage;