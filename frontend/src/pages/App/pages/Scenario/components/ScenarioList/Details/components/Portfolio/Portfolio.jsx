import React, { useState } from "react";
import "./Portfolio.css";

// Portfolios
import RealizedPortfolio from "./RealizedPortfolio/RealizedPortfolio";
import InvestedPortfolio from "./InvestedPortfolio/InvestedPortfolio";
import ProjectedPortfolio from "./ProjectedPortfolio/ProjectedPortfolio";

// New Investment Flow
import {
  NewInvestmentStep,
  InvestmentDetailsStep,
} from "./NewInvestment";

const PlusIcon = ({ className }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 4V16M4 10H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);


// Modals
import TargetSelectionModal from "./TargetSelectionModal/TargetSelectionModal";

/* =========================
   Static Data
========================== */

const DEFAULT_REALIZED_DATA = [
  {
    id: 1,
    name: "Terapia Group",
    date: "30.06.20",
    duration: "5 yrs",
    cost: "6 000 000",
    exitVal: "12 000 000",
    dividends: "1 000 000",
    exitDate: "30.06.2025",
    irr: "12.54%",
    moic: "2.00x",
  },
];

const MOCK_INVESTED_DATA = [
  {
    id: 1,
    name: "Vantech AI",
    date: "30.06.21",
    duration: "3 yrs",
    cost: "8 000 000",
    exit_value: "20 000 000",
    dividends: "-",
    irr: "18.40%",
    moic: "2.50x",
    exitDate: "07.08.26",
  },
];

/* =========================
   Component
========================== */

function Portfolio() {
  const [activeMode, setActiveMode] = useState(null);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [showInvestmentDetails, setShowInvestmentDetails] = useState(false);

  /* ===== Handlers ===== */

  const handleToggle = (mode) => {
    setActiveMode((prev) => (prev === mode ? null : mode));
  };

  const handleNewDeal = () => {
    setShowNewInvestment(true);
  };

  const handleNextFromNewInvestment = () => {
    setShowNewInvestment(false);
    setShowInvestmentDetails(true);
  };

  const handleCloseDetails = () => {
    setShowInvestmentDetails(false);
  };

  return (
    <div className="portfolio-tab-container">
      {/* ===== HEADER ===== */}
      <div className="portfolio-controls-header">
        <div className="control-toggles-group">
          <div
            className="toggle-group"
            onClick={() => handleToggle("sensitivity")}
          >
            <div
              className={`toggle-track ${
                activeMode === "sensitivity" ? "active" : ""
              }`}
            >
              <div className="toggle-knob" />
            </div>
            <span className="toggle-label">Sensitivity table</span>
          </div>

          <div
            className="toggle-group"
            onClick={() => handleToggle("target")}
          >
            <div
              className={`toggle-track ${
                activeMode === "target" ? "active" : ""
              }`}
            >
              <div className="toggle-knob" />
            </div>
            <span className="toggle-label">Target mode</span>
          </div>
        </div>

        {activeMode === "target" && (
          <button
            className="destructive-btn-md"
            onClick={() => setIsTargetModalOpen(true)}
          >
            Choose a Target
          </button>
        )}
      </div>

      {/* ===== TABLES ===== */}
      <RealizedPortfolio realizedData={DEFAULT_REALIZED_DATA} />

      <InvestedPortfolio
        activeMode={activeMode}
        investedData={MOCK_INVESTED_DATA}
      />

      <ProjectedPortfolio activeMode={activeMode} rows={[]} />

      {/* ✅ NEW DEAL BUTTON (نفس Projected بالظبط) */}
      <button className="proj-add-btn" onClick={handleNewDeal}>
        <PlusIcon className="proj-plus-icon" />
        <span>New deal</span>
      </button>

      {/* ===== NEW INVESTMENT ===== */}
      {showNewInvestment && (
        <NewInvestmentStep
          onClose={() => setShowNewInvestment(false)}
          onNext={handleNextFromNewInvestment}
        />
      )}

      {/* ===== DETAILS DRAWER ===== */}
      {showInvestmentDetails && (
        <InvestmentDetailsStep onClose={handleCloseDetails} />
      )}

      {/* ===== TARGET MODAL ===== */}
      <TargetSelectionModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
}

export default Portfolio;
