import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from 'react-router-dom';

import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector";
import SearchBar from "../../../../../../components/SearchBar/SearchBar.jsx";
import { ChevronDownIcon } from "../../icons.jsx";
import { CheckMarkIcon } from "../../../../../../components/Icons/InteractiveIcons.jsx";
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

const PortfolioCompareTab = ({ onSelectInvestment }) => {
  const { fundId, portfolioDataset } = useOutletContext();
  const { selectedTimeframeIds, activeQuarters, handleToggleTimeframe } = useCompareTimeframes(fundId, 2);

  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState([]);
  const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);
  const [investmentSearchTerm, setInvestmentSearchTerm] = useState("");
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [columnSearchTerm, setColumnSearchTerm] = useState("");
  const [selectedCompareColumn, setSelectedCompareColumn] = useState(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState([]);

  const { rows: compareRows } = useCompareRows(fundId, activeQuarters, [], portfolioDataset);
  const fundInvestments = compareRows;

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

  useEffect(() => {
    if (!isColumnDropdownOpen && columnSearchTerm) setColumnSearchTerm("");
  }, [isColumnDropdownOpen, columnSearchTerm]);

  const visibleRows = useMemo(() => {
    if (selectedInvestmentIds.length === 0 || selectedInvestmentIds.length === fundInvestments.length)
      return fundInvestments;
    return fundInvestments.filter((inv) =>
      selectedInvestmentIds.some((id) => String(id) === String(inv.id))
    );
  }, [fundInvestments, selectedInvestmentIds]);

  const totalRow = useMemo(() => buildTotalRow(visibleRows, activeQuarters), [visibleRows, activeQuarters]);
  const tableColumnOptions = useMemo(() => getCompareTableColumnOptions(activeQuarters), [activeQuarters]);
  const compareOptions = useMemo(() => getCompareChartMetricOptions(), []);

  useEffect(() => {
    const validKeys = new Set(tableColumnOptions.map((opt) => opt.key));
    setVisibleColumnKeys((prev) => {
      const filtered = prev.filter((key) => validKeys.has(key));
      if (filtered.length) return filtered;
      return tableColumnOptions.map((opt) => opt.key);
    });
  }, [tableColumnOptions]);

  const allInvestmentsSelected = selectedInvestmentIds.length === fundInvestments.length && fundInvestments.length > 0;
  const allColumnsSelected = visibleColumnKeys.length === tableColumnOptions.length && tableColumnOptions.length > 0;

  const filteredColumnOptions = useMemo(() => {
    const q = columnSearchTerm.trim().toLowerCase();
    if (!q) return tableColumnOptions;
    return tableColumnOptions.filter((opt) => String(opt.label || "").toLowerCase().includes(q));
  }, [tableColumnOptions, columnSearchTerm]);

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
    if (selectedInvestmentIds.length === 0 || allInvestmentsSelected) return "All Investments";
    if (selectedInvestmentIds.length === 1)
      return fundInvestments.find((i) => String(i.id) === String(selectedInvestmentIds[0]))?.name || "1 Investment";
    return `Investments (${selectedInvestmentIds.length})`;
  })();

  const filteredInvestmentOptions = useMemo(() => {
    const q = String(investmentSearchTerm || "").trim().toLowerCase();
    if (!q) return fundInvestments;
    return fundInvestments.filter((inv) => String(inv?.name || "").toLowerCase().includes(q));
  }, [fundInvestments, investmentSearchTerm]);

  return (
    <section className="compare-section">
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
              <div className="quarter-search-wrapper">
                <SearchBar
                  key={isInvDropdownOpen ? "open" : "closed"}
                  placeholder="Search investment..."
                  onSearch={setInvestmentSearchTerm}
                  containerClassName="search-bar compare-dropdown-search"
                  className="compare-dropdown-search-input"
                />
              </div>
              <div className="quarter-list">
                <div
                  className={`quarter-item ${allInvestmentsSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (allInvestmentsSelected) {
                      setSelectedInvestmentIds([]);
                    } else {
                      setSelectedInvestmentIds(fundInvestments.map((inv) => inv.id));
                    }
                  }}
                >
                  <div className="quarter-item-content">
                    <div className={`qs-checkbox ${allInvestmentsSelected ? 'checked' : ''}`}>
                      {allInvestmentsSelected && <CheckMarkIcon />}
                    </div>
                    <span className="item-label-bold">All Investments</span>
                  </div>
                </div>
                {filteredInvestmentOptions.map((inv) => {
                  const isSelected = selectedInvestmentIds.some(id => String(id) === String(inv.id));
                  return (
                    <div
                      key={inv.id}
                      className={`quarter-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedInvestmentIds((prev) =>
                          prev.some((id) => String(id) === String(inv.id))
                            ? prev.filter((id) => String(id) !== String(inv.id))
                            : [...prev, inv.id]
                        );
                      }}
                    >
                      <div className="quarter-item-content">
                        <div className={`qs-checkbox ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <CheckMarkIcon />}
                        </div>
                        <span className="item-label-bold">{inv.name}</span>
                      </div>
                    </div>
                  );
                })}
                {!filteredInvestmentOptions.length && (
                  <div className="quarter-no-results">No matches found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TIMEFRAME SELECTOR */}
        <div className="limits-period-wrapper">
          <TimeframeSelector
            selected={selectedTimeframeIds}
            onChange={handleToggleTimeframe}
            isSingle={false}
            maxSelections={2}
          />
        </div>

        {/* COLUMNS DROPDOWN */}
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
            <div className="quarter-dropdown compare-columns-dropdown">
              <div className="quarter-search-wrapper">
                <SearchBar
                  key={isColumnDropdownOpen ? "open" : "closed"}
                  placeholder="Search columns..."
                  onSearch={setColumnSearchTerm}
                  containerClassName="search-bar compare-dropdown-search"
                  className="compare-dropdown-search-input"
                />
              </div>
              <div className="quarter-list">
                <div
                  className={`quarter-item ${allColumnsSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (allColumnsSelected) {
                      setVisibleColumnKeys([]);
                    } else {
                      setVisibleColumnKeys(tableColumnOptions.map((opt) => opt.key));
                    }
                  }}
                >
                  <div className="quarter-item-content">
                    <div className={`qs-checkbox ${allColumnsSelected ? 'checked' : ''}`}>
                      {allColumnsSelected && <CheckMarkIcon />}
                    </div>
                    <span className="item-label-bold">All Columns</span>
                  </div>
                </div>
                {filteredColumnOptions.map((option) => {
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
                      <div className="quarter-item-content">
                        <div className={`qs-checkbox ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <CheckMarkIcon />}
                        </div>
                        <span className="item-label-bold">{option.label}</span>
                      </div>
                    </div>
                  );
                })}
                {!filteredColumnOptions.length && (
                  <div className="quarter-no-results">No matches found</div>
                )}
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
};

export default PortfolioCompareTab;