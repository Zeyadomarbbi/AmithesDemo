import React, { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "../../../../../../../hooks/Portfolio/usePortfolio.js";

// Portfolios
import RealizedPortfolio from "./RealizedPortfolio/RealizedPortfolio";
import InvestedPortfolio from "./InvestedPortfolio/InvestedPortfolio";
import ProjectedPortfolio from "./ProjectedPortfolio/ProjectedPortfolio";
import { PlusIcon } from "./Icons";
import { NewInvestmentStep, InvestmentDetailsStep } from "./NewInvestment";
import TargetSelectionModal from "./TargetSelectionModal/TargetSelectionModal";
import "./Portfolio.css";

function Portfolio({ fundId, scenarioId }) {
  const [activeMode, setActiveMode] = useState(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [showInvestmentDetails, setShowInvestmentDetails] = useState(false);

  // Hook now returns enriched investments (including transaction_flows)
  const { investments, fetchInvestments, loading } = usePortfolio(fundId);

  /* ===== 1. DATA FETCHING ===== */
  useEffect(() => {
    fetchInvestments(); 
  }, [fundId, fetchInvestments]);

  /* ===== 2. AGGREGATE CLASSIFICATION LOGIC ===== */
  const { realizedData, investedData, projectedData } = useMemo(() => {
    const realized = [];
    const invested = [];
    const projected = [];

    investments.forEach((inv) => {
      // Extract nested flows
      const flows = inv.transaction_flows || [];
      
      // Calculate Total Cost dynamically from nested flows
      // Assuming 'amount' is the field we sum
      const totalCost = flows
        .filter(f => !f.is_deleted)
        .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

      // Enrich the object for table consumption
      const enrichedInv = {
        ...inv,
        id: inv.investment_id,
        cost: totalCost,
        flows: flows,
      };

      // Classification
      if (inv.scenario_id !== null) {
        // Any item linked to a scenario goes to Projected
        projected.push(enrichedInv);
      } else {
        // Master logic: Split by exit status or existence of a Divestment flow
        const hasDivestment = flows.some(f => f.transaction_name === "Divestment");
        
        if (inv.is_realized || inv.exit_date || hasDivestment) {
          realized.push(enrichedInv);
        } else {
          invested.push(enrichedInv);
        }
      }
    });

    return { realizedData: realized, investedData: invested, projectedData: projected };
  }, [investments]);

  console.log(realizedData)
  console.log(investedData)
  console.log(projectedData)
  /* ===== HANDLERS ===== */
  const handleToggle = (mode) => {
    setActiveMode((prev) => (prev === mode ? null : mode));
  };

  const handleNewDeal = () => setShowNewInvestment(true);

  const handleNextFromNewInvestment = () => {
    setShowNewInvestment(false);
    setShowInvestmentDetails(true);
  };

  const handleCloseDetails = () => {
    setShowInvestmentDetails(false);
    fetchInvestments(); 
  };

  if (loading && investments.length === 0) return <div>Loading Portfolio...</div>;

  return (
    <div className="portfolio-tab-container">
      {/* ===== HEADER ===== */}
      <div className="portfolio-controls-header">
        <div className="control-toggles-group">
          <div className="toggle-group" onClick={() => handleToggle("sensitivity")}>
            <div className={`toggle-track ${activeMode === "sensitivity" ? "active" : ""}`}>
              <div className="toggle-knob" />
            </div>
            <span className="toggle-label">Sensitivity table</span>
          </div>

          <div className="toggle-group" onClick={() => handleToggle("target")}>
            <div className={`toggle-track ${activeMode === "target" ? "active" : ""}`}>
              <div className="toggle-knob" />
            </div>
            <span className="toggle-label">Target mode</span>
          </div>
        </div>

        {activeMode === "target" && (
          <button className="destructive-btn-md" onClick={() => setIsTargetModalOpen(true)}>
            Choose a Target
          </button>
        )}
      </div>

      {/* ===== TABLES ===== */}
      <RealizedPortfolio realizedData={realizedData} />

      <InvestedPortfolio 
        activeMode={activeMode} 
        investedData={investedData} 
      />

      <ProjectedPortfolio 
        activeMode={activeMode} 
        rows={projectedData} 
      />

      {/* NEW DEAL BUTTON */}
      <button className="proj-add-btn" onClick={handleNewDeal}>
        <PlusIcon className="proj-plus-icon" />
        <span>New deal</span>
      </button>

      {/* MODALS & STEPS */}
      {showNewInvestment && (
        <NewInvestmentStep
          fundId={fundId}
          scenarioId={scenarioId}
          onClose={() => setShowNewInvestment(false)}
          onNext={handleNextFromNewInvestment}
        />
      )}

      {showInvestmentDetails && (
        <InvestmentDetailsStep 
          fundId={fundId}
          scenarioId={scenarioId}
          onClose={handleCloseDetails} 
        />
      )}

      <TargetSelectionModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
}

export default Portfolio;