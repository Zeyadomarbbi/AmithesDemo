import React, { useState, useEffect, useMemo } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import { usePortfolio } from "../../../../../../../hooks/Portfolio/usePortfolio.js";
import { usePortfolioTransactionTypes } from "../../../../../../../hooks/Reference/usePortfolioTransactionTypes.js";
import { useScenarioPortfolioProjections } from "../../../../../../../hooks/Scenarios/useScenarioPortfolioProjections.js";
import { useShareClasses } from "../../../../../../../hooks/useShareClass.js";
import { executeDeferredUpdates } from "./ScenarioPortfolioHelpers.js";
import { useTargetMode } from "./TargetSelectionModal/useTargetMode.js";
// Components
import { PlusIcon, ChevronDoubleLeftIcon } from "./Icons"; // Ensure ChevronDoubleLeftIcon is imported
import InvestmentDetailsDrawer from "./NewInvestment/InvestmentDetails/InvestmentDetailsDrawer.jsx";
import NewInvestmentModal from "./NewInvestment/NewInvestmentPopup/NewInvestmentModal.jsx";
import Toast from '../../../../../../../components/Toast/Toast.jsx';

// Portfolio Tables
import RealizedPortfolio from "./PortfolioTables/RealizedPortfolio.jsx";
import InvestedPortfolio from "./PortfolioTables/InvestedPortfolio.jsx";
import ProjectedPortfolio from "./PortfolioTables/ProjectedPortfolio.jsx";
import TargetSelectionModal from "./TargetSelectionModal/TargetSelectionModal";
import TargetFinalizationModal from "./TargetSelectionModal/TargetFinalizationModal.jsx";
// Simulation Results
import SimulationResults from "./SimulationResults/SimulationResults.jsx"; 

import "./Portfolio.css";

// --- [HELPER FUNCTIONS] ---
const cleanNumber = (v) => {
  if (typeof v === "number") return v;
  const str = String(v ?? "").replace(/[^0-9.-]/g, ""); 
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return null;
    const hasPos = cashflows.some((c) => c.amount > 0);
    const hasNeg = cashflows.some((c) => c.amount < 0);
    if (!hasPos || !hasNeg) return null;
    return xirrLib(cashflows);
  } catch (err) {
    console.error("XIRR Lib Error:", err);
    return null;
  }
};

const calculateRowMetrics = (flows, exitDate, exitValue) => {
  let dividends = 0;
  
  const cashflows = flows.map(f => {
    const type = (f.transaction_name || f.transaction_type_name || f.type || "").toLowerCase();
    const amt = cleanNumber(f.amount); 
    
    if (type.includes("dividend") || type.includes("interest")) {
      dividends += Math.abs(amt);
    }

    let signedAmount = 0;
    if (type.includes("invest") && !type.includes("divest")) {
      signedAmount = -Math.abs(amt);
    } else {
      signedAmount = Math.abs(amt);
    }

    return { date: new Date(f.date), amount: signedAmount };
  });

  if (exitDate && exitValue) {
    const termVal = cleanNumber(exitValue);
    if (termVal !== 0) {
      cashflows.push({ 
        date: new Date(exitDate),
        amount: Math.abs(termVal) 
      });
    }
  }

  cashflows.sort((a, b) => a.date - b.date);
  const validCashflows = cashflows.filter(cf => cf.date instanceof Date && !isNaN(cf.date));

  const irrResult = safeXirr(validCashflows);
  
  return { 
    irr: irrResult, 
    dividends: dividends 
  };
};

export const processPortfolioData = (investments, projections, targetDate, activeScenarioId) => {
  const results = { realized: [], unrealized: [], projected: [] };

  investments.forEach((inv) => {
    const proj = projections.find(p => p.investment === inv.investment_id) || {};
    const rowData = { ...inv, ...proj, id: inv.investment_id };

    let finalExitDate = rowData.exit_date;
    let finalExitValue = rowData.exit_value;

    if (rowData.first_investment_date && rowData.input_duration) {
       const d = new Date(rowData.first_investment_date);
       const dur = cleanNumber(rowData.input_duration);
       d.setFullYear(d.getFullYear() + Math.floor(dur));
       d.setMonth(d.getMonth() + Math.round((dur % 1) * 12));
       finalExitDate = d.toISOString().split('T')[0];
    }

    if (rowData.cost && rowData.input_moic) {
       const cost = cleanNumber(rowData.cost);
       const moic = cleanNumber(rowData.input_moic);
       finalExitValue = cost * moic;
    }

    const flows = (inv.transaction_flows || []).filter(f => {
      const isNotDeleted = !f.is_deleted;
      const matchesScenario = (f.scenario_id === null || f.scenario_id == activeScenarioId);
      return isNotDeleted && matchesScenario;
    });

    const metrics = calculateRowMetrics(flows, finalExitDate, finalExitValue);
    
    const enrichedData = { 
        ...rowData, 
        irr: metrics.irr ? (metrics.irr * 100).toFixed(2) + "%" : "0.00%",
        dividends_interests: metrics.dividends,
        exit_value: finalExitValue,
        exit_date: finalExitDate
    };

    if (inv.scenario_id !== null) {
      results.projected.push({ ...enrichedData, current_status: "Projected" });
      return;
    }

    if (flows.length === 0) {
      results.unrealized.push({ ...enrichedData, current_status: "Unallocated" });
      return;
    }

    let totalExitPct = flows.reduce((sum, f) => sum + cleanNumber(f.divestment_percentage), 0);
    
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
  const [showNewInvestmentModal, setShowNewInvestmentModal] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
  const [simRefreshTrigger, setSimRefreshTrigger] = useState(0);
  const [lockedRows, setLockedRows] = useState([]);
  const { data: shareClassesData } = useShareClasses(fundId);

    // 2. Extract just the names for the modal columns
    // Assuming your API returns objects like { id: 1, share_class_name: "Class A", ... }
    const availableShareClasses = useMemo(() => {
        if (!shareClassesData) return [];
        return shareClassesData.map(sc => sc.share_class_name || sc.name); 
    }, [shareClassesData]);
  // --- Simulation Panel State ---
  // Default to false (collapsed) or true based on preference
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingFlows, setPendingFlows] = useState([]);
  const [localEditedProjections, setLocalEditedProjections] = useState({});

  const { investments, fetchInvestments, createFlow, loading: loadInv } = usePortfolio(fundId);
  const { transactionTypes } = usePortfolioTransactionTypes();
  const { projections, fetchProjections, updateProjection, loading: loadProj } = useScenarioPortfolioProjections(fundId, scenarioId);
  const { executeTargetMode, loading: targetLoading } = useTargetMode(fundId, scenarioId);
  const handleToggleLock = (rowId) => {
        setLockedRows(prev => 
            prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
        );
    };
  useEffect(() => {
    fetchInvestments();
    fetchProjections();
  }, [fundId, scenarioId, fetchInvestments, fetchProjections]);

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

  const viewingInvestment = useMemo(() => {
    if (!selectedInvestmentId) return null;
    return [...investedData, ...projectedData].find(inv => inv.id === selectedInvestmentId);
  }, [selectedInvestmentId, investedData, projectedData]);

  /* ===== HANDLERS ===== */

  const handleCreationSuccess = () => {
    fetchInvestments();
    fetchProjections();
    setToast({ type: "success", title: "Created", message: "New investment added successfully." });
  };

  const handleUpdateInput = (investmentId, field, value) => {
    const proj = projections.find(p => p.investment == investmentId);
    if (!proj) return;

    setLocalEditedProjections(prev => ({
      ...prev,
      [proj.projection_id]: { 
        ...(prev[proj.projection_id] || {}), 
        [field]: value 
      }
    }));
  };

  const handleSave = async () => {
    if (Object.keys(localEditedProjections).length === 0 && pendingFlows.length === 0) return;
    setIsSaving(true);
    try {
      await executeDeferredUpdates(pendingFlows, localEditedProjections, { createFlow, updateProjection });
      setPendingFlows([]);
      setLocalEditedProjections({});
      setToast({ type: "success", title: "Portfolio Saved", message: "Updated Projections Successfully." });
      fetchInvestments();
      fetchProjections();
      setSimRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setToast({ type: "error", title: "Save Error", message: "A database conflict occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (mode) => setActiveMode((prev) => (prev === mode ? null : mode));
  const unlockedPortfolios = useMemo(() => {
        const allDeals = [...investedData, ...projectedData];
        return allDeals.filter(inv => !lockedRows.includes(inv.id));
    }, [investedData, projectedData, lockedRows]);

  const handleTargetSave = ({ success, error }) => {
        if (success) {
            setToast({ type: "success", title: "Target Reached", message: "MOICs have been updated successfully." });
            // Refresh tables
            fetchInvestments();
            fetchProjections();
            setSimRefreshTrigger(prev => prev + 1);
        } else {
            setToast({ type: "error", title: "Target Error", message: error?.message || "Could not reach target with available deals." });
        }
    };
  // Drawer Data Prep
  const drawerData = useMemo(() => {
      if (!viewingInvestment) return null;
      // ... logic for computing computedExitDate/Value if needed ...
      return viewingInvestment; 
  }, [viewingInvestment]);

  if ((loadInv || loadProj) && investments.length === 0) return <div>Loading...</div>;

  return (
    <div className="portfolio-tab-container" style={{ padding: 0 }}>
      <div className={`portfolio-split-layout ${isSimPanelOpen ? 'sim-open' : ''}`}>

        <div className="portfolio-main-column">
            <div className="portfolio-content-inner">
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
                    <button className="destructive-btn-md" onClick={() => setIsTargetModalOpen(true)}>Choose a Target</button>
                    )}
                </div>

                <RealizedPortfolio 
                  fundId={fundId}
                  scenarioId={scenarioId}
                  realizedData={realizedData} 
                />
                
                <InvestedPortfolio 
                    fundId={fundId}
                    scenarioId={scenarioId}
                    activeMode={activeMode} 
                    investedData={investedData} 
                    onChangeRow={handleUpdateInput}
                    onRowClick={(row) => setSelectedInvestmentId(row.id)}
                    lockedRows={lockedRows}
                    onToggleLock={handleToggleLock}
                />
                
                <ProjectedPortfolio 
                    fundId={fundId}
                    scenarioId={scenarioId}
                    activeMode={activeMode} 
                    rows={projectedData} 
                    onChangeRow={handleUpdateInput}
                    onRowClick={(row) => setSelectedInvestmentId(row.id)} 
                    lockedRows={lockedRows}
                    onToggleLock={handleToggleLock}
                />

                <button className="proj-add-btn" onClick={() => setShowNewInvestmentModal(true)}>
                    <PlusIcon /> <span>New deal</span>
                </button>
                
                <div className="scenario-portfolio-footer">
                  <div className="scenario-portfolio-actions">
                  <button 
                      className="scenario-portfolio-btn-save" 
                      onClick={handleSave}
                      disabled={isSaving || (Object.keys(localEditedProjections).length === 0 && pendingFlows.length === 0)}
                  >
                      {isSaving ? "Saving..." : "Save"}
                  </button>
                  {toast && <Toast {...toast} onClose={() => setToast(null)} />}
                  </div>
              </div>
            </div>

            {/* Footer Actions */}

        </div>

        {/* --- RIGHT COLUMN: SIMULATION RESULTS --- */}
        {/* Always rendered. Width controlled by CSS based on isSimPanelOpen */}
        <div className="simulation-side-panel">
            {/* SimulationResults manages the internal content logic */}
            <SimulationResults 
                fundId={fundId} 
                scenarioId={scenarioId} 
                isOpen={isSimPanelOpen}
                onToggle={() => setIsSimPanelOpen(!isSimPanelOpen)}
                refreshTrigger={simRefreshTrigger}
            />
        </div>

      </div>

      {/* --- OVERLAYS --- */}
      {showNewInvestmentModal && (
        <NewInvestmentModal 
          fundId={fundId}
          scenarioId={scenarioId}
          onClose={() => setShowNewInvestmentModal(false)} 
          onSuccess={handleCreationSuccess} 
        />
      )}

      {drawerData && (
        <InvestmentDetailsDrawer
          investment={drawerData}
          fundId={fundId}
          scenarioId={scenarioId}
          transactionTypes={transactionTypes}
          exitDate={drawerData.exit_date} 
          exitValue={drawerData.exit_value} 
          onClose={() => setSelectedInvestmentId(null)}
          onSaved={() => {
            fetchInvestments();
            fetchProjections();
          }}
        />
      )}

        <TargetSelectionModal 
          isOpen={isTargetModalOpen} 
          onClose={() => setIsTargetModalOpen(false)} 
          onSave={handleTargetSave}
          shareClasses={availableShareClasses}
          fundId={fundId}                     // Passed down
          scenarioId={scenarioId}             // Passed down
          unlockedPortfolios={unlockedPortfolios}
        />

        <TargetFinalizationModal 
          isOpen={isFinalizationOpen}
          onClose={() => setIsFinalizationOpen(false)}
          onSave={handleFinalSave}
          result={targetResults}
          fundId={fundId}
          scenarioId={scenarioId}
        />
      
    </div>
  );
}

export default Portfolio;