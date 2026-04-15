import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from 'react-router-dom';

import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector";
import SimpleDropdown from "../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
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
  // Switched portfolioDataset to portfolio to match the new usePortfolio hook implementation
  const { fundId, portfolio } = useOutletContext();
  const { selectedTimeframeIds, activeQuarters, handleToggleTimeframe } = useCompareTimeframes(fundId, 2);

  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState([]);
  const [selectedCompareColumn, setSelectedCompareColumn] = useState(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState([]);

  // Passing portfolio instead of portfolioDataset
  const { rows: compareRows } = useCompareRows(fundId, activeQuarters, [], portfolio);
  const fundInvestments = compareRows;
  console.log("Fund Investments:", fundInvestments);
  useEffect(() => {
    if (!fundInvestments.length) return;
    setSelectedInvestmentIds((prev) => {
      const next = prev.filter((id) => fundInvestments.some((inv) => String(inv.id) === String(id)));
      if (next.length === prev.length && next.every((id, idx) => String(id) === String(prev[idx]))) return prev;
      return next;
    });
  }, [fundInvestments]);

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

  const visibleRows = useMemo(() => {
    if (selectedInvestmentIds.length === 0 || selectedInvestmentIds.length === fundInvestments.length)
      return fundInvestments;
    return fundInvestments.filter((inv) =>
      selectedInvestmentIds.some((id) => String(id) === String(inv.id))
    );
  }, [fundInvestments, selectedInvestmentIds]);

  const totalRow = useMemo(() => buildTotalRow(visibleRows, activeQuarters), [visibleRows, activeQuarters]);

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

  const investmentOptions = useMemo(() =>
    fundInvestments.map((inv) => ({ id: inv.id, name: inv.name })),
    [fundInvestments]
  );

  const columnDropdownOptions = useMemo(() =>
    tableColumnOptions.map((opt) => ({ id: opt.key, name: opt.label })),
    [tableColumnOptions]
  );

  return (
    <section className="compare-section">
      <div className="compare-timeframes-row">
        <div className="compare-selectors-group">
          <SimpleDropdown
            options={investmentOptions}
            value={selectedInvestmentIds}
            onChange={setSelectedInvestmentIds}
            placeholder="All Investments"
            isSingle={false}
            searchLabel="Search investment..."
          />

          <div className="limits-period-wrapper">
            <TimeframeSelector
              selected={selectedTimeframeIds}
              onChange={handleToggleTimeframe}
              isSingle={false}
              maxSelections={2}
            />
          </div>

          <SimpleDropdown
            options={columnDropdownOptions}
            value={visibleColumnKeys}
            onChange={setVisibleColumnKeys}
            placeholder={`Columns (${visibleColumnKeys.length})`}
            isSingle={false}
            searchLabel="Search columns..."
          />
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
        chartData={visibleRows}
        options={compareOptions}
        selectedKey={effectiveCompareColumn}
        setSelectedKey={setSelectedCompareColumn}
        activeQuarters={activeQuarters}
      />
    </section>
  );
};

export default PortfolioCompareTab;