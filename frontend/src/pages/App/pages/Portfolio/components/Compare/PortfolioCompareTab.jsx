import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import { PORTFOLIO_COMPARE_DATA } from "../../portfolioData";

// Hooks and Components
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import SearchBar from "../../../../../../components/SearchBar/SearchBar.jsx";
import { ChevronDownIcon } from "../../icons.jsx";
import {
  buildTotalRow,
  diffBetweenNewestAndOldest,
  formatCompareMoney,
  getCompareChartMetricOptions,
  getCompareTableColumnOptions,
  getCompareValueByColumn,
  useCompareRows,
  useCompareTimeframes,
} from "./comparebackwork";

import PortfolioCompareTable from "./components/PortfolioCompareTable";
import PortfolioCompareChart from "./components/PortfolioCompareChart";
import "./PortfolioCompareTab.css";

function PortfolioCompareTabContent({ onSelectInvestment }) {
  const { fundId, portfolioDataset } = useOutletContext();
  const {
    isLoading,
    selectedTimeframeIds,
    activeQuarters,
    handleToggleTimeframe,
  } = useCompareTimeframes(2);

  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState([]);
  const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);
  const [investmentSearchTerm, setInvestmentSearchTerm] = useState("");
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [selectedCompareColumn, setSelectedCompareColumn] = useState(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState([]);

  const fallbackInvestments = PORTFOLIO_COMPARE_DATA[fundId] || [];
  const { rows: compareRows, isLoading: isCompareLoading, error: compareError } = useCompareRows(
    fundId,
    activeQuarters,
    fallbackInvestments,
    portfolioDataset
  );
  const fundInvestments = compareRows;

  // Block all derived work until both data sources are ready
  const isFetching = isLoading || isCompareLoading;

  useEffect(() => {
    if (!fundInvestments.length) return;
    setSelectedInvestmentIds((prev) => {
      const next = prev.filter((id) => fundInvestments.some((inv) => String(inv.id) === String(id)));
      if (next.length === prev.length && next.every((id, idx) => String(id) === String(prev[idx]))) return prev;
      return next;
    });
  }, [fundInvestments]);

  useEffect(() => {
    if (!isInvDropdownOpen && investmentSearchTerm) setInvestmentSearchTerm("");
  }, [isInvDropdownOpen, investmentSearchTerm]);

  const visibleRows = useMemo(() => {
    if (selectedInvestmentIds.length === 0) return fundInvestments;
    return fundInvestments.filter((inv) => selectedInvestmentIds.some((id) => String(id) === String(inv.id)));
  }, [fundInvestments, selectedInvestmentIds]);

  // 4. Calculate Total Row
  const totalRow = useMemo(() => {
    return buildTotalRow(visibleRows, activeQuarters);
  }, [visibleRows, activeQuarters]);

  // --- CHART DATA CALCULATION ---
  const tableColumnOptions = useMemo(
    () => getCompareTableColumnOptions(activeQuarters),
    [activeQuarters]
  );

  const compareOptions = useMemo(
    () => getCompareChartMetricOptions(),
    []
  );

  useEffect(() => {
    const validKeys = new Set(tableColumnOptions.map((opt) => opt.key));
    setVisibleColumnKeys((prev) => {
      const filtered = prev.filter((key) => validKeys.has(key));
      if (filtered.length) return filtered;
      return tableColumnOptions.map((opt) => opt.key);
    });
  }, [tableColumnOptions]);

  const effectiveCompareColumn =
    selectedCompareColumn && compareOptions.some((opt) => opt.key === selectedCompareColumn)
      ? selectedCompareColumn
      : compareOptions[0]?.key || null;

  const chartData = useMemo(() => {
    if (!effectiveCompareColumn) return [];
    return visibleRows.map((row) => ({
      name: row.name,
      value: Number((getCompareValueByColumn(row, effectiveCompareColumn, activeQuarters) / 1000000).toFixed(2)),
    }));
  }, [activeQuarters, effectiveCompareColumn, visibleRows]);

  const activeInvLabel = (() => {
    if (selectedInvestmentIds.length === 0) return "All Investments";
    if (selectedInvestmentIds.length === 1) {
      return fundInvestments.find((i) => String(i.id) === String(selectedInvestmentIds[0]))?.name || "1 Investment";
    }
    return `Investments (${selectedInvestmentIds.length})`;
  })();

  const filteredInvestmentOptions = useMemo(() => {
    const q = String(investmentSearchTerm || "").trim().toLowerCase();
    if (!q) return fundInvestments;
    return fundInvestments.filter((inv) => String(inv?.name || "").toLowerCase().includes(q));
  }, [fundInvestments, investmentSearchTerm]);

  if (isFetching) return <PageSpinner label="Loading portfolio data..." />;
  if (compareError) return <PageError message={compareError.message ?? compareError} />;

  return (
    <section className="compare-section">
      <div className="compare-timeframes-row">
        <div className="quarter-selector-container">
          <div
            className={`quarter-selector-button ${isInvDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsInvDropdownOpen(!isInvDropdownOpen)}
          >
            <div className="quarter-text-group">
              <span className="quarter-part">{activeInvLabel}</span>
            </div>
            
            {isInvDropdownOpen && (
                <div className="quarter-dropdown">
                    <div className="quarter-search-wrapper">
                      <SearchBar
                        key={isInvDropdownOpen ? "compare-investment-search-open" : "compare-investment-search-closed"}
                        placeholder="Search investment..."
                        onSearch={setInvestmentSearchTerm}
                        containerClassName="search-bar compare-dropdown-search"
                        className="compare-dropdown-search-input"
                      />
                    </div>
                    <div className="quarter-list">
                        <div 
                            className={`quarter-item ${selectedInvestmentIds.length === 0 ? 'selected' : ''}`}
                            onClick={() => { setSelectedInvestmentIds([]); setIsInvDropdownOpen(false); }}
                        >
                            <span className="item-label-bold">All Investments</span>
                        </div>
                        {filteredInvestmentOptions.map((inv) => (
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
                        {!filteredInvestmentOptions.length && (
                          <div className="quarter-no-results">No matches found</div>
                        )}
                    </div>
                </div>
                {filteredInvestmentOptions.map((inv) => (
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
                {!filteredInvestmentOptions.length && (
                  <div className="quarter-no-results">No matches found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="limits-period-wrapper">
          <TimeframeSelector
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            isSingle={false}
            maxSelections={2}
          />
        </div>

        <div className="quarter-selector-container">
          <div
            className={`quarter-selector-button ${isColumnDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
          >
            <div className="quarter-text-group">
              <span className="quarter-part">Columns ({visibleColumnKeys.length})</span>
            </div>
            <div className={`quarter-icon ${isColumnDropdownOpen ? 'open' : ''}`}>
              <ChevronDownIcon />
            </div>
          </div>

          {isColumnDropdownOpen && (
            <div className="quarter-dropdown">
              <div className="quarter-list">
                {tableColumnOptions.map((option) => {
                  const isSelected = visibleColumnKeys.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      className={`quarter-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setVisibleColumnKeys((prev) =>
                          prev.includes(option.key)
                            ? prev.filter((key) => key !== option.key)
                            : [...prev, option.key]
                        );
                      }}
                    >
                      <span className="item-label-bold">{option.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <PortfolioCompareTable
        activeQuarters={activeQuarters}
        visibleRows={visibleRows}
        totalRow={totalRow}
        visibleColumnKeys={visibleColumnKeys}
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
}

const PortfolioCompareTab = ({ onSelectInvestment }) => {
  const { fundId } = useOutletContext();
  return (
    <TimeframeProvider fundId={Number(fundId)}>
      <PortfolioCompareTabContent onSelectInvestment={onSelectInvestment} />
    </TimeframeProvider>
  );
};

export default PortfolioCompareTab;