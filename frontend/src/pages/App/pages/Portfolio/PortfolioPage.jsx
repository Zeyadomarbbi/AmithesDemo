// PortfolioPage.jsx
import React, { useState } from "react";
import "./PortfolioPage.css";


import PortfolioSummaryTab from "./components/PortfolioSummaryTab";
import PortfolioFxTab from "./components/PortfolioFxTab";
import PortfolioLimitsTab from "./components/PortfolioLimitsTab";
import PortfolioCompareTab from "./components/PortfolioCompareTab";
import CompareDetailPanel from "./components/CompareDetailPanel";

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedCompareRow, setSelectedCompareRow] = useState(null);

  return (
    <div className="portfolio-page">
      <main className="portfolio-content">
       <h1 className="portfolio-title">Portfolio</h1>
    


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

        {/* Tabs content */}
        {activeTab === "summary" && (
          <PortfolioSummaryTab onSelectInvestment={setSelectedCompareRow} />
        )}

        {activeTab === "fx" && <PortfolioFxTab />}

        {activeTab === "limits" && <PortfolioLimitsTab />}

        {activeTab === "compare" && (
          <PortfolioCompareTab onSelectInvestment={setSelectedCompareRow} />
        )}

        {/* Right detail panel (shared بين summary & compare) */}
        {selectedCompareRow && (
          <CompareDetailPanel
            investment={selectedCompareRow}
            onClose={() => setSelectedCompareRow(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Portfolio;
