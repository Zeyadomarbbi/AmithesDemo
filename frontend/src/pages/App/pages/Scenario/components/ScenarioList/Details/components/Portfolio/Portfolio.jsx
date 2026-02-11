import React, { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "../../../../../../../hooks/Portfolio/usePortfolio.js";
import { useScenarioPortfolioProjections } from "../../../../../../../hooks/Scenarios/useScenarioPortfolioProjections.js";

// Portfolios
import { PlusIcon } from "./Icons";
import { NewInvestmentStep, InvestmentDetailsStep } from "./NewInvestment";
import { NewInvestmentModal } from "./NewInvestment/NewInvestmentPopup/NewInvestmentModal";
import Toast from '../../../../../../../components/Toast/Toast.jsx';

import RealizedPortfolio from "./PortfolioTables/RealizedPortfolio.jsx";
import InvestedPortfolio from "./PortfolioTables/InvestedPortfolio.jsx";
import ProjectedPortfolio from "./PortfolioTables/ProjectedPortfolio.jsx";
import TargetSelectionModal from "./TargetSelectionModal/TargetSelectionModal";
import "./Portfolio.css";

/**
 * AUTHORITATIVE SPLITTER LOGIC
 */
export const processPortfolioData = (investments, projections, targetDate, activeScenarioId) => {
  const results = { realized: [], unrealized: [], projected: [] };

  investments.forEach((inv) => {
    // Match investment with its calculated projection row
    const proj = projections.find(p => p.investment === inv.investment_id) || {};
    
    // 1. PROJECTED CATEGORY (Synthetic investments)
    if (inv.scenario_id !== null) {
      results.projected.push({ ...inv, ...proj, id: inv.investment_id, current_status: "Projected" });
      return;
    }

    // 2. FILTER FLOWS BY TIMEFRAME (For Status Logic)
    const flows = (inv.transaction_flows || []).filter(f => 
      !f.is_deleted && new Date(f.date) <= new Date(targetDate) &&
      (f.scenario_id === null || f.scenario_id === activeScenarioId)
    );

    if (flows.length === 0) {
      results.unrealized.push({ ...inv, ...proj, id: inv.investment_id, current_status: "Unallocated" });
      return;
    }

    let totalExitPct = flows.reduce((sum, f) => sum + parseFloat(f.divestment_percentage || 0), 0);
    const enrichedData = { ...inv, ...proj, id: inv.investment_id, total_exit_pct: totalExitPct };

    // 3. THE SPLITTER
    if (totalExitPct >= 100) {
      results.realized.push(enrichedData);
    } else if (totalExitPct > 0 && totalExitPct < 100) {
      results.realized.push({ ...enrichedData, is_partial: true });
      results.unrealized.push({ ...enrichedData, is_partial: true });
    } else {
      results.unrealized.push(enrichedData);
    }
  });

  return results;
};

function Portfolio({ fundId, scenarioId, timeframeDate }) {
  const [activeMode, setActiveMode] = useState(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [showInvestmentDetails, setShowInvestmentDetails] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // localEditedProjections stores the changes until 'Save' is clicked
  const [localEditedProjections, setLocalEditedProjections] = useState({});

  const { investments, fetchInvestments, loading: loadInv } = usePortfolio(fundId);
  const { projections, fetchProjections, updateProjection, loading: loadProj } = useScenarioPortfolioProjections(fundId, scenarioId);

  useEffect(() => {
    fetchInvestments();
    fetchProjections();
  }, [fundId, scenarioId, fetchInvestments, fetchProjections]);

  // Merge original projections with local edits for UI rendering
  const mergedProjections = useMemo(() => {
    return projections.map(proj => ({
      ...proj,
      ...(localEditedProjections[proj.projection_id] || {})
    }));
  }, [projections, localEditedProjections]);

  const { realizedData, investedData, projectedData } = useMemo(() => {
    const targetDate = timeframeDate || new Date().toISOString().split('T')[0];
    const processed = processPortfolioData(investments, mergedProjections, targetDate, scenarioId);
    
    return { 
        realizedData: processed.realized, 
        investedData: processed.unrealized, 
        projectedData: processed.projected 
    };
  }, [investments, mergedProjections, scenarioId, timeframeDate]);

  /**
   * Updates only the frontend state. No API call here.
   */
  const handleUpdateInput = (investmentId, field, value) => {
    const proj = projections.find(p => p.investment === investmentId);
    if (!proj) return;

    setLocalEditedProjections(prev => ({
      ...prev,
      [proj.projection_id]: {
        ...(prev[proj.projection_id] || {}),
        [field]: value
      }
    }));
  };

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

  /**
   * Handles the actual Database Save operation
   */
  const handleSave = async () => {
    const editCount = Object.keys(localEditedProjections).length;
    if (editCount === 0) return;

    setIsSaving(true);
    try {
      // Loop through all edited projections and save them
      const savePromises = Object.entries(localEditedProjections).map(([id, payload]) => 
        updateProjection(id, payload)
      );

      await Promise.all(savePromises);
      
      // Clear local edits after successful save
      setLocalEditedProjections({});
      
      setToast({
        type: "success",
        title: "Portfolio Saved",
        message: `${editCount} investment(s) updated successfully.`,
      });
      
      // Refresh data to get calculated fields (exit_value, exit_date) from backend
      fetchProjections();
    } catch (err) {
      setToast({
        type: "error",
        title: "Save Failed",
        message: "An unexpected error occurred while saving the changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if ((loadInv || loadProj) && investments.length === 0) return <div>Loading Data...</div>;

  return (
    <div className="portfolio-tab-container">
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

      <RealizedPortfolio realizedData={realizedData} />

      <InvestedPortfolio 
        activeMode={activeMode} 
        investedData={investedData} 
        onChangeRow={handleUpdateInput} 
      />

      <ProjectedPortfolio 
        activeMode={activeMode} 
        rows={projectedData} 
        onChangeRow={handleUpdateInput}
      />

      <button className="proj-add-btn" onClick={handleNewDeal}>
        <PlusIcon />
        <span>New deal</span>
      </button>

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
      
      <div className="scenario-portfolio-footer">
        <div className="scenario-portfolio-actions">
          {/* Save button now handles all local state commit to DB */}
          <button 
            className="scenario-portfolio-btn-save" 
            onClick={handleSave}
            disabled={isSaving || Object.keys(localEditedProjections).length === 0}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          {toast && (
            <Toast
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;