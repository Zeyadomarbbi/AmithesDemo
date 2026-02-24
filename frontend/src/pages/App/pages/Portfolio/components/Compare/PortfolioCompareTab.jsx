import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import { PORTFOLIO_COMPARE_DATA } from "../../portfolioData";

// Hooks and Components
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { ChevronDownIcon } from "../../icons.jsx";
import {
  buildTotalRow,
  diffBetweenNewestAndOldest,
  formatCompareMoney,
  getCompareColumnOptions,
  getCompareValueByColumn,
  useCompareRows,
  useCompareTimeframes,
} from "./comparebackwork";

// Sub-components
import PortfolioCompareTable from "./components/PortfolioCompareTable";
import PortfolioCompareChart from "./components/PortfolioCompareChart";

import "./PortfolioCompareTab.css";

const PortfolioCompareTab = ({ onSelectInvestment }) => {
  const { fundId, portfolioDataset } = useOutletContext();
  const {
    quarters,
    isLoading,
    selectedTimeframeIds,
    activeQuarters,
    handleToggleTimeframe,
    handleSaveTimeframe,
  } = useCompareTimeframes(fundId, 2);

  // Local UI State
  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState([]);
  const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);
  
  const [selectedCompareColumn, setSelectedCompareColumn] = useState(null);

  // --- DATA PROCESSING ---

  // 2. Resolve Investment Data
  const fallbackInvestments = PORTFOLIO_COMPARE_DATA[fundId] || [];
  const { rows: compareRows, isLoading: isCompareLoading } = useCompareRows(
    fundId,
    activeQuarters,
    fallbackInvestments,
    portfolioDataset
  );
  const fundInvestments = compareRows;

  useEffect(() => {
    if (!fundInvestments.length) return;
    setSelectedInvestmentIds((prev) => {
      const next = prev.filter((id) =>
        fundInvestments.some((inv) => String(inv.id) === String(id))
      );
      if (next.length === prev.length && next.every((id, idx) => String(id) === String(prev[idx]))) {
        return prev;
      }
      return next;
    });
  }, [fundInvestments]);
  
  // 3. Filter Rows
  const visibleRows = useMemo(() => {
    if (selectedInvestmentIds.length === 0) return fundInvestments;
    return fundInvestments.filter((inv) =>
      selectedInvestmentIds.some((id) => String(id) === String(inv.id))
    );
  }, [fundInvestments, selectedInvestmentIds]);

  // 4. Calculate Total Row
  const totalRow = useMemo(() => {
    return buildTotalRow(visibleRows, activeQuarters);
  }, [visibleRows, activeQuarters]);

  // --- CHART DATA CALCULATION ---
  const compareOptions = useMemo(
    () => getCompareColumnOptions(activeQuarters),
    [activeQuarters]
  );

  const effectiveCompareColumn =
    selectedCompareColumn && compareOptions.some((opt) => opt.key === selectedCompareColumn)
      ? selectedCompareColumn
      : compareOptions[0]?.key || null;

  const chartData = useMemo(() => {
    if (!effectiveCompareColumn) return [];
    return visibleRows.map((row) => {
      const value = getCompareValueByColumn(row, effectiveCompareColumn, activeQuarters);
      return {
        name: row.name,
        value: Number((value / 1000000).toFixed(2)),
      };
    });
  }, [activeQuarters, effectiveCompareColumn, visibleRows]);


  const activeInvLabel = (() => {
    if (selectedInvestmentIds.length === 0) return "All Investments";
    if (selectedInvestmentIds.length === 1) {
      return (
        fundInvestments.find((i) => String(i.id) === String(selectedInvestmentIds[0]))?.name ||
        "1 Investment"
      );
    }
    return `Investments (${selectedInvestmentIds.length})`;
  })();

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
                            className={`quarter-item ${selectedInvestmentIds.length === 0 ? 'selected' : ''}`}
                            onClick={() => { setSelectedInvestmentIds([]); setIsInvDropdownOpen(false); }}
                        >
                            <span className="item-label-bold">All Investments</span>
                        </div>
                        {fundInvestments.map((inv) => (
                            <div 
                                key={inv.id} 
                                className={`quarter-item ${selectedInvestmentIds.some(id => String(id) === String(inv.id)) ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedInvestmentIds((prev) =>
                                    prev.some((id) => String(id) === String(inv.id))
                                      ? prev.filter((id) => String(id) !== String(inv.id))
                                      : [...prev, inv.id]
                                  );
                                }}
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
            onSaveNew={handleSaveTimeframe}
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
        formatMoney={formatCompareMoney}
        getDiff={(row, key) => diffBetweenNewestAndOldest(row, key, activeQuarters)}
      />

      <PortfolioCompareChart 
        chartData={chartData}
        options={compareOptions}
        selectedKey={effectiveCompareColumn}
        setSelectedKey={setSelectedCompareColumn}
      />
    </section>
  );
};

export default PortfolioCompareTab;
