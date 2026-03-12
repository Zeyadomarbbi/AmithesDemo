import React, { useState, useEffect, useMemo } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import { usePortfolio } from "../../../../../../../hooks/Portfolio/usePortfolio.js";
import { usePortfolioTransactionTypes } from "../../../../../../../hooks/Reference/usePortfolioTransactionTypes.js";
import { useScenarioPortfolioProjections } from "../../../../../../../hooks/Scenarios/useScenarioPortfolioProjections.js";
import { useShareClasses } from "../../../../../../../hooks/useShareClass.js";
import { executeDeferredUpdates } from "../../../../../../../hooks/Scenarios/ScenarioPortfolioHelpers.js";
import { PermissionGate } from "../../../../../../../../../hooks/Auth/PermissionGate.jsx";
import { PageSpinner, PageError } from "../../../../../../../../../components/LoadingScreens/LoadingScreens.jsx"
// Components
import { PlusIcon } from '/src/components/Icons/InteractiveIcons';
import { ChevronDoubleLeftIcon } from '/src/components/Icons/DirectionIcons';
import InvestmentDetailsDrawer from "./NewInvestment/InvestmentDetails/InvestmentDetailsDrawer.jsx";
import NewInvestmentModal from "./NewInvestment/NewInvestmentPopup/NewInvestmentModal.jsx";
import Toast from '../../../../../../../components/Toast/Toast.jsx';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../components/useFormatter';

// Portfolio Tables
import PortfolioSection from "./PortfolioTables/PortfolioSection";

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
  const [isFinalizationOpen, setIsFinalizationOpen] = useState(false); // NEW
  const [targetResults, setTargetResults] = useState(null);
  const [showNewInvestmentModal, setShowNewInvestmentModal] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
  const [simRefreshTrigger, setSimRefreshTrigger] = useState(0);
  const [lockedRows, setLockedRows] = useState([]);
  const formatNumber  = useNumberFormatter();
  const formatPercent = usePercentageFormatter();
  const formatDate    = useDateFormatter();
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
  const handleToggleLock = (rowId) => {
        setLockedRows(prev => 
            prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
        );
    };
  useEffect(() => {
    fetchInvestments(scenarioId);
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

  const overallSummary = useMemo(() => {
    let sum = { cost: 0, exit: 0, dividends: 0 };
    let aggregateCashflows = [];
    const allData = [...realizedData, ...investedData, ...projectedData];

    allData.forEach(r => {
        const cost = cleanNumber(r.display_cost || r.cost);
        const exitValue = cleanNumber(r.exit_value);
        const exitDate = r.exit_date;
        const dividends = cleanNumber(r.dividends_interests);

        sum.cost += cost;
        sum.exit += exitValue;
        sum.dividends += dividends;

        const flows = r.transaction_flows || [];
        flows.forEach(f => {
            if (f.is_deleted) return;
            const type = (f.transaction_name || f.transaction_type_name || f.type || "").toLowerCase();
            const amt = cleanNumber(f.amount); 
            
            let signedAmount = 0;
            if (type.includes("invest") && !type.includes("divest")) {
                signedAmount = -Math.abs(amt);
            } else {
                signedAmount = Math.abs(amt);
            }
            
            aggregateCashflows.push({ date: new Date(f.date), amount: signedAmount });
        });

        if (exitDate && exitValue !== 0) {
            aggregateCashflows.push({
                date: new Date(exitDate),
                amount: Math.abs(exitValue)
            });
        }
    });

    const totalMoic = sum.cost > 0 ? (sum.exit + sum.dividends) / sum.cost : 0;
    
    aggregateCashflows.sort((a, b) => a.date - b.date);
    const validCashflows = aggregateCashflows.filter(cf => cf.date instanceof Date && !isNaN(cf.date));
    const totalIrr = safeXirr(validCashflows) || 0;

    return {
        totalCost: sum.cost,
        totalExitVal: sum.exit,
        totalDividends: sum.dividends,
        totalIrr: totalIrr,
        totalMoic: totalMoic,
    };
  }, [realizedData, investedData, projectedData]);
  /* ===== HANDLERS ===== */

  const handleCreationSuccess = async () => {
      await fetchInvestments(scenarioId);
      await fetchProjections();
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
      
      // Await both fetches before clearing local state
      await Promise.all([
        fetchInvestments(scenarioId),
        fetchProjections()
      ]);

      // Clear local state only after fresh data is in place
      setPendingFlows([]);
      setLocalEditedProjections({});
      
      setToast({ type: "success", title: "Portfolio Saved", message: "Updated Projections Successfully." });
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

  // Drawer Data Prep
  const drawerData = useMemo(() => {
      if (!viewingInvestment) return null;
      // ... logic for computing computedExitDate/Value if needed ...
      return viewingInvestment; 
  }, [viewingInvestment]);

  const handleTargetNext = (results) => {
    setTargetResults(results);
    setIsTargetModalOpen(false);
    setIsFinalizationOpen(true);
};

  const handleTargetFinalSave = async ({ success, error }) => {
      if (success) {
          await Promise.all([fetchInvestments(scenarioId), fetchProjections()]);
          setToast({ type: "success", title: "Target Applied", message: "All unlocked portfolio MOICs have been updated." });
          setSimRefreshTrigger(prev => prev + 1);
      } else {
          setToast({ type: "error", title: "Update Failed", message: error?.message || "An error occurred while saving targets." });
      }
  };

  if (loadInv || loadProj) return <PageSpinner label="Loading portfolio..." />;
  const hasActions = activeMode === 'target' || activeMode === 'sensitivity';

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

                <div className="scenario-pf-table-container no-borders">
                    <table className="scenario-pf-main-table">
                      <PortfolioSection
                          title="Realized portfolio"
                          rows={realizedData}
                          readOnly
                          hasActions={hasActions}
                      />
                      <tbody className="table-section-spacer"><tr aria-hidden="true"><td colSpan="100%"></td></tr></tbody>
                      <PortfolioSection
                          title="Invested portfolio"
                          fundId={fundId}
                          scenarioId={scenarioId}
                          rows={investedData}
                          activeMode={activeMode}
                          hasActions={hasActions}
                          onChangeRow={handleUpdateInput}
                          onRowClick={(row) => setSelectedInvestmentId(row.id)}
                          lockedRows={lockedRows}
                          onToggleLock={handleToggleLock}
                      />
                      <tbody className="table-section-spacer"><tr aria-hidden="true"><td colSpan="100%"></td></tr></tbody>
                      <PortfolioSection
                          title="Projected portfolio"
                          fundId={fundId}
                          scenarioId={scenarioId}
                          rows={projectedData}
                          activeMode={activeMode}
                          hasActions={hasActions}
                          onChangeRow={handleUpdateInput}
                          onRowClick={(row) => setSelectedInvestmentId(row.id)}
                          lockedRows={lockedRows}
                          onToggleLock={handleToggleLock}
                      />
                      <tbody className="table-section-spacer"><tr aria-hidden="true"><td colSpan="100%"></td></tr></tbody>
                      <tfoot className="overall-total-footer">
                          <tr className="scenario-pf-summary-row">
                              <td className="scenario-pf-left" >Overall Total</td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value="-" readOnly />
                              </td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value={formatNumber(overallSummary.totalCost)} readOnly />
                              </td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value={formatNumber(overallSummary.totalExitVal)} readOnly />
                              </td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value={formatNumber(overallSummary.totalDividends)} readOnly />
                              </td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value={formatPercent(overallSummary.totalIrr*100)} readOnly />
                              </td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value={`${overallSummary.totalMoic.toFixed(2)}x`} readOnly />
                              </td>
                              <td className="scenario-pf-center">
                                  <input className="scenario-pf-input" value="-" readOnly />
                              </td>
                              {hasActions && <td className="scenario-pf-center" />}
                          </tr>
                      </tfoot>
                  </table>


                </div>
                <PermissionGate>
                  <button className="proj-add-btn" onClick={() => setShowNewInvestmentModal(true)}>
                      <PlusIcon /> <span>New deal</span>
                  </button>
                </PermissionGate>
                <PermissionGate>
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
              </PermissionGate>
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
              fetchInvestments(scenarioId); // pass scenarioId
              fetchProjections();
          }}
        />
      )}

        <TargetSelectionModal 
          isOpen={isTargetModalOpen} 
          onClose={() => setIsTargetModalOpen(false)} 
          onNext={handleTargetNext}
          onError={(msg) => {
              setIsTargetModalOpen(false);  // close modal so toast is visible
              setToast({ type: "error", title: "Target Mode Failed", message: msg });
          }}
          shareClasses={availableShareClasses}
          fundId={fundId} 
          scenarioId={scenarioId}
          unlockedPortfolios={unlockedPortfolios}
        />

        <TargetFinalizationModal 
          isOpen={isFinalizationOpen}
          onClose={() => setIsFinalizationOpen(false)}
          onSave={handleTargetFinalSave}
          result={targetResults}
          fundId={fundId}
          scenarioId={scenarioId}
        />
      
    </div>
  );
}

export default Portfolio;