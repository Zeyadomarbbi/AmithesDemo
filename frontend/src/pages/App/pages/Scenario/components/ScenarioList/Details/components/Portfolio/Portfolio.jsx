import React, { useState, useEffect, useMemo } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import { usePortfolio } from "../../../../../../../hooks/Portfolio/usePortfolio.js";
import { usePortfolioTransactionTypes } from "../../../../../../../hooks/Reference/usePortfolioTransactionTypes.js";
import { useScenarioPortfolioProjections } from "../../../../../../../hooks/Scenarios/useScenarioPortfolioProjections.js";
import { executeDeferredUpdates } from "./ScenarioPortfolioHelpers.js";

// Components
import { PlusIcon } from "./Icons";
import InvestmentDetailsDrawer from "./NewInvestment/InvestmentDetails/InvestmentDetailsDrawer.jsx";
import NewInvestmentModal from "./NewInvestment/NewInvestmentPopup/NewInvestmentModal.jsx";
import Toast from '../../../../../../../components/Toast/Toast.jsx';

import RealizedPortfolio from "./PortfolioTables/RealizedPortfolio.jsx";
import InvestedPortfolio from "./PortfolioTables/InvestedPortfolio.jsx";
import ProjectedPortfolio from "./PortfolioTables/ProjectedPortfolio.jsx";
import TargetSelectionModal from "./TargetSelectionModal/TargetSelectionModal";
import "./Portfolio.css";

const cleanNumber = (v) => {
  if (typeof v === "number") return v;
  const str = String(v ?? "").replace(/[^0-9.-]/g, ""); 
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

// --- HELPER: Safe XIRR ---
const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return null;
    const hasPos = cashflows.some((c) => c.amount > 0);
    const hasNeg = cashflows.some((c) => c.amount < 0);
    if (!hasPos || !hasNeg) return null;
    
    // Some versions require: xirrLib(cashflows, { guess: 0.1 })
    return xirrLib(cashflows);
  } catch (err) {
    console.error("XIRR Lib Error:", err); // Log the actual error to see why it fails
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

    // FIX: Ensure this returns a valid Date object
    return { date: new Date(f.date), amount: signedAmount };
  });

  if (exitDate && exitValue) {
    const termVal = cleanNumber(exitValue);
    if (termVal !== 0) {
      cashflows.push({ 
        date: new Date(exitDate), // FIX: Ensure native Date object
        amount: Math.abs(termVal) 
      });
    }
  }

  // 1. Sort
  cashflows.sort((a, b) => a.date - b.date);

  // 2. Validate Dates (Remove invalid dates that might cause XIRR to fail)
  const validCashflows = cashflows.filter(cf => cf.date instanceof Date && !isNaN(cf.date));

  // 3. Log to verify types
  console.log("Cashflows for XIRR:", validCashflows.map(cf => ({
    date: cf.date.toISOString(),
    type: typeof cf.date, // Should be 'object' (Date)
    amount: cf.amount
  })));

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

    // 2. Calculate Exit Data (Dynamic based on Duration/MOIC)
    let finalExitDate = rowData.exit_date;
    let finalExitValue = rowData.exit_value;

    // Recalculate Date
    if (rowData.first_investment_date && rowData.input_duration) {
       const d = new Date(rowData.first_investment_date);
       const dur = cleanNumber(rowData.input_duration); // FIX: Use cleanNumber
       d.setFullYear(d.getFullYear() + Math.floor(dur));
       d.setMonth(d.getMonth() + Math.round((dur % 1) * 12));
       finalExitDate = d.toISOString().split('T')[0];
    }

    // Recalculate Exit Value
    if (rowData.cost && rowData.input_moic) {
       const cost = cleanNumber(rowData.cost);       // FIX: Use cleanNumber
       const moic = cleanNumber(rowData.input_moic); // FIX: Use cleanNumber
       finalExitValue = cost * moic;
    }

    // 3. Get Relevant Flows
    const flows = (inv.transaction_flows || []).filter(f => {
      const isNotDeleted = !f.is_deleted;
      
      // Use loose equality (==) in case one is a string and the other a number
      const matchesScenario = (f.scenario_id === null || f.scenario_id == activeScenarioId);

      return isNotDeleted && matchesScenario;
    });

    // DEBUG LOGS - These will tell us exactly why the list is empty
    // 4. CALCULATE METRICS (IRR / DIVIDENDS)
    const metrics = calculateRowMetrics(flows, finalExitDate, finalExitValue);
    // 5. Enrich the Data Object
    const enrichedData = { 
        ...rowData, 
        irr: metrics.irr ? (metrics.irr * 100).toFixed(2) + "%" : "0.00%",
        dividends_interests: metrics.dividends,
        exit_value: finalExitValue,
        exit_date: finalExitDate
    };

    // 6. Bucket Sorting
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
  
  // FIX 1: Store ID only, not the static object
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
  
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingFlows, setPendingFlows] = useState([]);
  const [localEditedProjections, setLocalEditedProjections] = useState({});

  const { investments, fetchInvestments, createFlow, loading: loadInv } = usePortfolio(fundId);
  const { transactionTypes, isLoading: loadingTypes } = usePortfolioTransactionTypes();
  const { projections, fetchProjections, updateProjection, loading: loadProj } = useScenarioPortfolioProjections(fundId, scenarioId);

  useEffect(() => {
    fetchInvestments();
    fetchProjections();
  }, [fundId, scenarioId, fetchInvestments, fetchProjections]);

  // 1. Merge DB Data + Local Unsaved Inputs
  const mergedProjections = useMemo(() => {
    return projections.map(proj => ({
      ...proj,
      ...(localEditedProjections[proj.projection_id] || {})
    }));
  }, [projections, localEditedProjections]);

  // 2. Process Tables (Recalculates Exit Values based on merged data)
  const { realizedData, investedData, projectedData } = useMemo(() => {
    const targetDate = timeframeDate || new Date().toISOString().split('T')[0];
    const processed = processPortfolioData(investments, mergedProjections, targetDate, scenarioId);
    
    // Note: The tables might calculate display values, but the underlying data
    // in mergedProjections contains the raw input_moic / input_duration
    return { 
        realizedData: processed.realized, 
        investedData: processed.unrealized, 
        projectedData: processed.projected 
    };
  }, [investments, mergedProjections, scenarioId, timeframeDate]);

  // FIX 2: Dynamically resolve the "Viewing" object from the latest processed data
  // This ensures that if investedData updates (because you typed a new MOIC),
  // viewingInvestment updates immediately.
  const viewingInvestment = useMemo(() => {
    if (!selectedInvestmentId) return null;
    const found = [...investedData, ...projectedData].find(inv => inv.id === selectedInvestmentId);
    
    // Log the data that is about to be sent to the drawer
    if (found) {
        console.log("Drawer View Data Updated:", { 
            id: found.id, 
            moic: found.input_moic, 
            exitVal: found.exit_value 
        });
    }
    
    return found;
  }, [selectedInvestmentId, investedData, projectedData]);

  /* ===== HANDLERS ===== */

  const handleCreationSuccess = () => {
    fetchInvestments();
    fetchProjections();
    setToast({ type: "success", title: "Created", message: "New investment added successfully." });
  };

  const handleUpdateInput = (investmentId, field, value) => {
    console.log("Update Input Triggered:", investmentId, field, value);

    // FIX: Use '==' to match string "30" with number 30
    const proj = projections.find(p => p.investment == investmentId);
    
    if (!proj) {
        console.error("❌ Projection NOT found for ID:", investmentId, "Available Projections:", projections);
        return;
    }

    console.log("✅ Projection found:", proj.projection_id, "Updating state...");

    setLocalEditedProjections(prev => ({
      ...prev,
      [proj.projection_id]: { 
        ...(prev[proj.projection_id] || {}), 
        [field]: value 
      }
    }));
  };

  const handleSave = async () => {
    const editCount = Object.keys(localEditedProjections).length;
    const flowCount = pendingFlows.length;

    if (editCount === 0 && flowCount === 0) return;

    setIsSaving(true);
    try {
      await executeDeferredUpdates(
        pendingFlows,
        localEditedProjections,
        { createFlow, updateProjection }
      );

      setPendingFlows([]);
      setLocalEditedProjections({});
      
      setToast({ 
        type: "success", 
        title: "Portfolio Saved", 
        message: "Refinements committed sequentially to prevent conflicts." 
      });
      
      fetchProjections();
    } catch (err) {
      setToast({ 
        type: "error", 
        title: "Save Error", 
        message: "A database conflict occurred. Please try again." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (mode) => setActiveMode((prev) => (prev === mode ? null : mode));

  // Helper to Calculate Live Exit Values for the Drawer
  // (Since the drawer expects 'exit_value' and 'exit_date' to be computed)
  const getComputedInvestmentForDrawer = (inv) => {
    if (!inv) return null;
    
    // 1. Calculate Exit Date
    let computedExitDate = inv.exit_date;
    if (inv.first_investment_date && inv.input_duration) {
      const d = new Date(inv.first_investment_date);
      const totalMonths = Math.round(parseFloat(inv.input_duration) * 12);
      d.setMonth(d.getMonth() + totalMonths);
      computedExitDate = d.toISOString().split('T')[0];
    }

    // 2. Calculate Exit Value
    let computedExitValue = inv.exit_value;
    if (inv.cost && inv.input_moic) {
       const c = parseFloat(inv.cost) || 0;
       const m = parseFloat(inv.input_moic) || 0;
       computedExitValue = c * m;
    }

    return {
        ...inv,
        exit_date: computedExitDate,
        exit_value: computedExitValue
    };
  };

  const drawerData = useMemo(() => getComputedInvestmentForDrawer(viewingInvestment), [viewingInvestment]);

  if ((loadInv || loadProj) && investments.length === 0) return <div>Loading...</div>;

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
          <button className="destructive-btn-md" onClick={() => setIsTargetModalOpen(true)}>Choose a Target</button>
        )}
      </div>

      <RealizedPortfolio realizedData={realizedData} />
      
      <InvestedPortfolio 
        activeMode={activeMode} 
        investedData={investedData} 
        onChangeRow={handleUpdateInput}
        onRowClick={(row) => setSelectedInvestmentId(row.id)} // Pass ID
      />
      
      <ProjectedPortfolio 
        activeMode={activeMode} 
        rows={projectedData} 
        onChangeRow={handleUpdateInput}
        onRowClick={(row) => setSelectedInvestmentId(row.id)} // Pass ID
      />

      <button className="proj-add-btn" onClick={() => setShowNewInvestmentModal(true)}>
        <PlusIcon /> <span>New deal</span>
      </button>

      {showNewInvestmentModal && (
        <NewInvestmentModal 
          fundId={fundId}
          scenarioId={scenarioId}
          onClose={() => setShowNewInvestmentModal(false)} 
          onSuccess={handleCreationSuccess} 
        />
      )}

      {/* DRAWER INTEGRATION */}
      {drawerData && (
        <InvestmentDetailsDrawer
          investment={drawerData}
          fundId={fundId}
          scenarioId={scenarioId}
          transactionTypes={transactionTypes}
          
          // Pass the live calculated values
          exitDate={drawerData.exit_date} 
          exitValue={drawerData.exit_value} 
          
          onClose={() => setSelectedInvestmentId(null)}
          onSaved={() => {
            fetchInvestments();
            fetchProjections();
          }}
        />
      )}

      <TargetSelectionModal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} onSave={() => {}} />
      
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
  );
}

export default Portfolio;