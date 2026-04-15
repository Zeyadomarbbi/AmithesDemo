import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector";
import { TimeframeProvider, useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import NewInvestmentModal from "./components/NewInvestmentModal/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";
import { PermissionGate } from "../../../../../../hooks/Auth/PermissionGate";
import { exportPortfolioSummary } from "../../../../../../components/Export/exportPortfolio";

import { useToast } from "../../../../components/Toast/useToast";
import { useTableSort } from "../../../../../../components/Sort/TableSort";
import { DownloadIcon, PlusIconWhite } from "../../../../../../components/Icons/InteractiveIcons";
import { PageSpinner, PageNoData } from "/src/components/LoadingScreens/LoadingScreens";
import { classifyInvestmentsByTimeframe, calculatePortfolioMetrics, calculateSubtotalMetrics } from "./PortfolioHelpers";
import {
  PortfolioTable,
  useColumnOptions,
  DEFAULT_VISIBLE_COLUMN_KEYS,
} from "./components/PortfolioTable/PortfolioTable";
import Toast from "../../../../components/Toast/Toast";

import "./PortfolioSummaryTab.css";

const toNumber = (v) => Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

const ownershipToDbValue = (ownershipPercent) => {
  const n = toNumber(ownershipPercent);
  return Number(Math.max(0, Math.min(100, n)).toFixed(4));
};

function PortfolioSummaryTabContent() {
  const { fundId, portfolio, countries, currencies } = useOutletContext();
  const { investments, loading } = portfolio;
  const numericFundId = Number(fundId);
  const { toast, showToast, closeToast } = useToast();

  const { quarters } = useTimeframeContext();
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const [sectionVisibleKeys, setSectionVisibleKeys] = useState({
    unrealized: DEFAULT_VISIBLE_COLUMN_KEYS,
    realized: DEFAULT_VISIBLE_COLUMN_KEYS,
    unallocated: DEFAULT_VISIBLE_COLUMN_KEYS,
    summary: DEFAULT_VISIBLE_COLUMN_KEYS
  });

  const selectedQuarterObj = quarters.find((q) => Number(q.id) === Number(selectedQuarter));
  const latestQuarterObj = quarters.length ? quarters[quarters.length - 1] : null;
  const activeQuarterObj = selectedQuarterObj || latestQuarterObj || null;

  const selectedTimeframeDate = activeQuarterObj?.rawDate || activeQuarterObj?.date || null;
  const metricsCutoffDate = selectedTimeframeDate || "9999-12-31";
  const effectiveTimeframe = activeQuarterObj || null;

  const getFlagUrl = useCallback((countryNameOrId) => {
    if (!countryNameOrId || !countries) return null;
    const countryData = countries.find((c) =>
      String(c.name).toLowerCase() === String(countryNameOrId).toLowerCase() ||
      Number(c.id) === Number(countryNameOrId)
    );
    if (!countryData?.iso2) return null;
    return `https://flagcdn.com/40x30/${countryData.iso2.toLowerCase()}.png`;
  }, [countries]);

  const columnOptions = useColumnOptions(getFlagUrl);

  useEffect(() => {
    if (!quarters.length) return;
    const hasSelected = quarters.some((q) => Number(q.id) === Number(selectedQuarter));
    if (!hasSelected) setSelectedQuarter(Number(quarters[quarters.length - 1].id));
  }, [quarters, selectedQuarter]);

  const tableData = useMemo(() => {
    if (!investments || !metricsCutoffDate) return [];
    const classified = classifyInvestmentsByTimeframe(investments, metricsCutoffDate);
    return calculatePortfolioMetrics(classified, metricsCutoffDate);
  }, [investments, metricsCutoffDate]);

  const rawUnrealized = useMemo(() => tableData.filter((r) => r.status === "unrealized"), [tableData]);
  const rawRealized = useMemo(() => tableData.filter((r) => r.status === "realized"), [tableData]);
  const rawUnallocated = useMemo(() => tableData.filter((r) => r.status === "unallocated"), [tableData]);

  const unrealizedSubtotal = useMemo(() => calculateSubtotalMetrics(rawUnrealized), [rawUnrealized]);
  const realizedSubtotal = useMemo(() => calculateSubtotalMetrics(rawRealized), [rawRealized]);
  const unallocatedSubtotal = useMemo(() => calculateSubtotalMetrics(rawUnallocated), [rawUnallocated]);
  const totalSummary = useMemo(() => calculateSubtotalMetrics(tableData), [tableData]);

  const { sorted: sortedUnrealized, sortKey: sortKeyU, toggleSort: toggleSortU } = useTableSort(rawUnrealized, "name");
  const { sorted: sortedRealized, sortKey: sortKeyR, toggleSort: toggleSortR } = useTableSort(rawRealized, "name");
  const { sorted: sortedUnallocated, sortKey: sortKeyA, toggleSort: toggleSortA } = useTableSort(rawUnallocated, "name");

  const handleAddInvestment = async ({ name, sector, countryId, currencyId, ownership }) => {
    if (!name || !String(name).trim()) {
      showToast({ type: "error", title: "Create failed", message: "Please enter an investment name." });
      return false;
    }
    const ownershipValue = Number(String(ownership).replace(/,/g, "").trim());
    if (!Number.isFinite(ownershipValue) || ownershipValue < 0 || ownershipValue > 100) {
      showToast({ type: "error", title: "Create failed", message: "Ownership must be between 0 and 100." });
      return false;
    }
    try {
      const createdInvestment = await portfolio.createInvestment(null, {
        name, sector,
        ownership: ownershipToDbValue(ownershipValue),
        country_id: Number(countryId),
        currency_id: Number(currencyId),
      });

      setIsNewInvestmentOpen(false);
      setSelectedInvestment(createdInvestment);
      showToast({ type: "success", title: "Investment created", message: `"${name}" has been created successfully.` });
      return createdInvestment;
    } catch (err) {
      console.error("Create investment failed:", err.message);
      showToast({
        type: "error",
        title: "Create failed",
        message: err.message?.toLowerCase().includes("duplicate")
          ? "Investment name already exists for this fund. Please choose another name."
          : "Failed to create investment. Please check your input.",
      });
      return false;
    }
  };

  const handleUpdateInvestment = async (investmentId, { name, sector, countryId, currencyId, ownership }) => {
    if (!name || !String(name).trim()) throw new Error("Please enter an investment name.");
    const ownershipValue = Number(String(ownership).replace(/,/g, "").trim());
    if (!Number.isFinite(ownershipValue) || ownershipValue < 0 || ownershipValue > 100) {
      throw new Error("Ownership must be between 0 and 100.");
    }
    
    const response = await portfolio.updateInvestment(null, investmentId, {
      name, sector,
      ownership: ownershipToDbValue(ownershipValue),
      country_id: Number(countryId),
      currency_id: Number(currencyId),
    });
    console.log("Updated investment response:", response);
    setSelectedInvestment(response);
    showToast({ type: "success", title: "Investment updated", message: `"${name}" has been updated successfully.` });
    return response;
  };

  const handleDeleteInvestment = async (investmentId) => {
    await portfolio.deleteInvestment(null, investmentId);
    setSelectedInvestment(null);
    showToast({ type: "success", title: "Investment deleted", message: "The investment has been deleted." });
  };

  const handleOpenInvestmentDetails = async (row) => {
    if (!Number.isFinite(Number(row?.originalId))) {
      showToast({ type: "error", title: "Open failed", message: "Please save the investment before opening details." });
      return;
    }
    try {
      const freshInvestmentRaw = (portfolio?.investments || []).find((i) => Number(i.id ?? i.investment_id) === Number(row.originalId));
      if(freshInvestmentRaw) {
        setSelectedInvestment(freshInvestmentRaw);
      }
    } catch (err) {
      showToast({ type: "error", title: "Open failed", message: err.message || "Failed to load investment details." });
    }
  };

  const tableSections = [
    {
      key: "unrealized",
      title: "Unrealized portfolio",
      rows: sortedUnrealized,
      subtotal: unrealizedSubtotal,
      sortKey: sortKeyU,
      toggleSort: toggleSortU,
      gainLabel: "Unrealized Gain",
    },
    {
      key: "realized",
      title: "Realized portfolio",
      rows: sortedRealized,
      subtotal: realizedSubtotal,
      sortKey: sortKeyR,
      toggleSort: toggleSortR,
      gainLabel: "Realized Gain",
    },
    {
      key: "unallocated",
      title: "Unallocated portfolio",
      rows: sortedUnallocated,
      subtotal: unallocatedSubtotal,
      sortKey: sortKeyA,
      toggleSort: toggleSortA,
      gainLabel: "Unallocated Gain",
    }
  ];

  const handleDownloadExcel = () => {
    const filename = `portfolio-summary-fund-${numericFundId}.xlsx`;
    exportPortfolioSummary(filename, tableSections, totalSummary, sectionVisibleKeys);
  };

  const sharedTableProps = {
    columnOptions,
    sectionVisibleKeys,
    setSectionVisibleKeys,
    onRowClick: handleOpenInvestmentDetails,
  };

  const isPortfolioEmpty = !investments || investments.length === 0;

  return (
    <>
      <div className="portfolio-toolbar">
        <div className="toolbar-left">
          <TimeframeSelector
            selected={selectedQuarter}
            onChange={(id) => setSelectedQuarter(Number(id))}
            isSingle={true}
          />
        </div>
        <div className="toolbar-right">
          <button className="export-action-trigger" onClick={handleDownloadExcel}>
            <DownloadIcon /><span className="export-title">Download</span>
          </button>
          <PermissionGate>
          <button className="investment-create-action" onClick={() => setIsNewInvestmentOpen(true)}>
            <PlusIconWhite /><span className="investment-title">New Investment</span>
          </button>
          </PermissionGate>
        </div>
      </div>

      {loading ? (
        <PageSpinner label="Loading portfolio..." />
      ) : isPortfolioEmpty ? (
        <PageNoData message="No investments found for this fund." />
      ) : (
        <PortfolioTable
          {...sharedTableProps}
          sections={tableSections}
          summary={totalSummary}
        />
      )}

      {isNewInvestmentOpen && (
        <NewInvestmentModal
          onClose={() => setIsNewInvestmentOpen(false)}
          onSave={handleAddInvestment}
          countries={countries}
          currencies={currencies}
        />
      )}

      {selectedInvestment && (
        <InvestmentDetailsDrawer
          investment={selectedInvestment}
          timeframe={effectiveTimeframe}
          fundId={numericFundId}
          portfolio={portfolio}
          countries={countries}
          currencies={currencies}
          onClose={() => setSelectedInvestment(null)}
          onSaved={async () => {
            if (typeof portfolio?.fetchInvestments === "function") {
              await portfolio.fetchInvestments(null);
            }
          }}
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
          showToast={showToast}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </>
  );
}

const PortfolioSummaryTab = () => {
  const { fundId } = useOutletContext();
  return (
    <TimeframeProvider fundId={Number(fundId)}>
      <PortfolioSummaryTabContent />
    </TimeframeProvider>
  );
};

export default PortfolioSummaryTab;