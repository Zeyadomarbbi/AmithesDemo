import React, { useState, useMemo } from "react";
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { PORTFOLIO_COMPARE_DATA } from "../../portfolioData";

// Hooks and Components
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter, saveNewTimeframe, useTimeframeNavigation } from '../../../../../../components/QuarterSelection/useTimeframes';
import { ChevronDownIcon } from "../../icons.jsx";

// Sub-components
import PortfolioCompareTable from "./components/PortfolioCompareTable";
import PortfolioCompareChart from "./components/PortfolioCompareChart";

import "./PortfolioCompareTab.css";

// --- Helpers ---
const formatMoney = (val) => {
  if (val === undefined || val === null) return "-";
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val).replace(/,/g, " ");
};

const PortfolioCompareTab = ({ onSelectInvestment }) => {
  const { fundId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const { quarters, isLoading, setQuarters } = useTimeframes(fundId);

  // URL State
  const queryParams = new URLSearchParams(location.search);
  const selectedTimeframeIds = queryParams.get("timeframes")?.split(",").map(Number).filter(id => !isNaN(id)) || [];
  const selectedCount = selectedTimeframeIds.length;

  // Local UI State
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("all");
  const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);
  
  // --- Chart Metric State ('fv' or 'cost') ---
  const [chartMetric, setChartMetric] = useState("fv");

  // --- REMOVED DEFAULT SELECTION EFFECT ---
  // The component now starts with empty selection [] unless URL has params.
  const { toggleTimeframe } = useTimeframeNavigation(location, navigate);
  const handleSaveNew = async (newTimeframe) => {
      try {
          const formatted = await saveNewTimeframe(fundId, newTimeframe);
          setQuarters(prev => [...prev, formatted]);
          toggleTimeframe(selectedTimeframeIds, formatted.id);
      } catch (error) {
          console.error("Compare Tab: Persistence error:", error);
      }
  };

  const handleToggleTimeframe = (id) => {
    toggleTimeframe(selectedTimeframeIds, id);
};

  // --- DATA PROCESSING ---

  // 1. Get Active Quarters sorted by Date (Newest first)
  const activeQuarters = useMemo(() => {
    return quarters
      .filter(q => selectedTimeframeIds.includes(q.id))
      .sort((a, b) => new Date(b.full_date || b.date) - new Date(a.full_date || a.date)); 
  }, [quarters, selectedTimeframeIds]);

  // 2. Resolve Investment Data
  const fundInvestments = PORTFOLIO_COMPARE_DATA[fundId] || [];
  
  // 3. Filter Rows
  const visibleRows = useMemo(() => {
    if (selectedInvestmentId === "all") return fundInvestments;
    return fundInvestments.filter(inv => String(inv.id) === String(selectedInvestmentId));
  }, [fundInvestments, selectedInvestmentId]);

  // 4. Calculate Total Row
  const totalRow = useMemo(() => {
    const totals = { name: "Total", isTotal: true, timeframes: {} };
    activeQuarters.forEach(q => {
      let costSum = 0;
      let fvSum = 0;
      visibleRows.forEach(row => {
        const tfData = row.timeframes[q.id] || {};
        costSum += (tfData.cost || 0);
        fvSum += (tfData.fv || 0);
      });
      totals.timeframes[q.id] = { cost: costSum, fv: fvSum, moic: costSum ? (fvSum / costSum).toFixed(2) : 0 };
    });
    return totals;
  }, [visibleRows, activeQuarters]);

  // Helper: Diff = Newest - Oldest
  const getDiff = (row, key) => {
    // If fewer than 2 quarters are selected, we cannot calculate a difference
    if (activeQuarters.length < 2) return "-";
    
    const newestId = activeQuarters[0].id;
    const oldestId = activeQuarters[activeQuarters.length - 1].id;
    
    const newestVal = row.timeframes[newestId]?.[key] || 0;
    const oldestVal = row.timeframes[oldestId]?.[key] || 0;
    return formatMoney(newestVal - oldestVal);
  };

  // --- CHART DATA CALCULATION ---
  const chartData = useMemo(() => {
    if (activeQuarters.length < 2) return [];

    const newestId = activeQuarters[0].id;
    const oldestId = activeQuarters[activeQuarters.length - 1].id;

    return visibleRows.map(row => {
        const newestVal = row.timeframes[newestId]?.[chartMetric] || 0;
        const oldestVal = row.timeframes[oldestId]?.[chartMetric] || 0;
        const delta = newestVal - oldestVal;

        return {
            name: row.name,
            value: Number((delta / 1000000).toFixed(2)) 
        };
    });
  }, [activeQuarters, visibleRows, chartMetric]);


  const activeInvLabel = selectedInvestmentId === "all" 
    ? "All Investments" 
    : fundInvestments.find(i => String(i.id) === String(selectedInvestmentId))?.name || "Select";

  return (
    <section className="compare-section">
      {/* FILTER ROW */}
      <div className="compare-timeframes-row">
        {/* INVESTMENT DROPDOWN */}
        <div className="quarter-selector-container">
           <div 
                className={`quarter-selector-button ${isInvDropdownOpen ? 'active' : ''}`} 
                onClick={() => setIsInvDropdownOpen(!isInvDropdownOpen)}
            >
                <div className="quarter-text-group">
                    <span className="quarter-part">{activeInvLabel}</span>
                </div>
                <div className={`quarter-icon ${isInvDropdownOpen ? 'open' : ''}`}>
                    <ChevronDownIcon />
                </div>
            </div>
            
            {isInvDropdownOpen && (
                <div className="quarter-dropdown">
                    <div className="quarter-list">
                        <div 
                            className={`quarter-item ${selectedInvestmentId === 'all' ? 'selected' : ''}`}
                            onClick={() => { setSelectedInvestmentId("all"); setIsInvDropdownOpen(false); }}
                        >
                            <span className="item-label-bold">All Investments</span>
                        </div>
                        {fundInvestments.map((inv) => (
                            <div 
                                key={inv.id} 
                                className={`quarter-item ${String(selectedInvestmentId) === String(inv.id) ? 'selected' : ''}`}
                                onClick={() => { setSelectedInvestmentId(inv.id); setIsInvDropdownOpen(false); }}
                            >
                                <span className="item-label-bold">{inv.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* TIMEFRAME SELECTOR */}
        <div className="limits-period-wrapper">
          <QuarterSelector 
            options={quarters}
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            onSaveNew={handleSaveNew}
            isLoading={isLoading}
            isSingle={false}
            maxSelections={2}
          />
        </div>
      </div>

      <PortfolioCompareTable 
        activeQuarters={activeQuarters}
        visibleRows={visibleRows}
        totalRow={totalRow}
        onSelectInvestment={onSelectInvestment}
        formatMoney={formatMoney}
        getDiff={getDiff}
      />

      <PortfolioCompareChart 
        chartData={chartData}
        metric={chartMetric}
        setMetric={setChartMetric}
      />
    </section>
  );
};

export default PortfolioCompareTab;