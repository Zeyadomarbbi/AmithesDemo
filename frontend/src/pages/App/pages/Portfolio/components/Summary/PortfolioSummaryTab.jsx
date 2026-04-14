import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { xirr as xirrLib } from "@webcarrot/xirr";
import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector";
import { TimeframeProvider, useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import NewInvestmentModal from "./components/NewInvestmentModal/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";
import { PermissionGate } from "../../../../../../hooks/Auth/PermissionGate";
import { exportWorkbook } from "../../../../../../components/Export/exportExcel";
import { usePortfolioFlows } from "../../../../hooks/Portfolio/usePortfolioFlows";

import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import { useTableSort } from "../../../../../../components/Sort/TableSort";
import { DownloadIcon, PlusIconWhite } from "../../../../../../components/Icons/InteractiveIcons";
import { PageSpinner, PageNoData, PageError } from "/src/components/LoadingScreens/LoadingScreens";
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from "../../../../../../components/useFormatter";

import {
  PortfolioTable,
  useColumnOptions,
  DEFAULT_VISIBLE_COLUMN_KEYS,
  calcValue,
  calcDividendsTotal,
  calcGain,
  calcMoicIncl,
} from "./components/PortfolioTable/PortfolioTable";

import "./PortfolioSummaryTab.css";

const toNumber = (v) =>
  Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

const formatCurrencyDisplay = (name, code, symbol) => {
  const safeName = String(name || "").trim();
  const safeCode = String(code || "").trim();
  const safeSymbol = String(symbol || "").trim();
  if (safeName && safeCode && safeSymbol) return `${safeName} (${safeCode}) ${safeSymbol}`;
  if (safeName && safeCode) return `${safeName} (${safeCode})`;
  if (safeCode && safeSymbol) return `${safeCode} ${safeSymbol}`;
  return safeName || safeCode || safeSymbol || "";
};

const ownershipToDbValue = (ownershipPercent) => {
  const n = toNumber(ownershipPercent);
  return Number(Math.max(0, Math.min(100, n)).toFixed(4));
};

const ownershipFromDbValue = (storedOwnership) => {
  const n = toNumber(storedOwnership);
  return Number(n.toFixed(4));
};

const partialDivestmentFromBackend = (value) => {
  const n = toNumber(value);
  return Number.isFinite(n) ? n * 10 : 0;
};

const canonicalType = (type) => {
  const t = String(type || "").trim().toLowerCase();
  if (t === "dividends" || t === "dividend") return "Dividend";
  if (t === "interests" || t === "interest") return "Interest";
  if (t === "partial divestment") return "Partial divestment";
  if (t === "divestment") return "Divestment";
  if (t === "investment") return "Investment";
  return "Other";
};

const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return null;
    const hasPos = cashflows.some((c) => c.amount > 0);
    const hasNeg = cashflows.some((c) => c.amount < 0);
    if (!hasPos || !hasNeg) return null;
    return xirrLib(cashflows);
  } catch (err) {
    console.error("XIRR calculation failed:", err);
    return null;
  }
};

function PortfolioSummaryTabContent() {
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();

  const { fundId, portfolio, countries, currencies } = useOutletContext();
  const { investments, loading } = portfolio;
  console.log("PortfolioSummaryTab render", { investments, loading });
  const portfolioFlows = usePortfolioFlows(fundId, null);

  const numericFundId = Number(fundId);
  const { toast, showToast, closeToast } = useToast();

  const { quarters } = useTimeframeContext();
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(DEFAULT_VISIBLE_COLUMN_KEYS);
  const [openColumnsMenu, setOpenColumnsMenu] = useState(null);

  const selectedQuarterObj = quarters.find((q) => Number(q.id) === Number(selectedQuarter));
  const latestQuarterObj = quarters.length ? quarters[quarters.length - 1] : null;
  const activeQuarterObj = selectedQuarterObj || latestQuarterObj || null;

  const [unrealizedRows, setUnrealizedRows] = useState([]);
  const [realizedRows, setRealizedRows] = useState([]);
  const [unallocatedRows, setUnallocatedRows] = useState([]);

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

  const visibleColumns = useMemo(
    () => columnOptions.filter((col) => visibleColumnKeys.includes(col.key)),
    [columnOptions, visibleColumnKeys]
  );

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(columnKey)
        ? prev.filter((k) => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const normalizeRow = (row) => ({
    id: row.investment_id ?? row.id ?? row.investmentId ?? row.portfolio_investment_id,
    name: row.name,
    sector: row.sector,
    countryId: row.country_id ?? row.countryId ?? "",
    country: row.country_name ?? row.country ?? row.countryName,
    ownership: ownershipFromDbValue(row.ownership),
    currencyId: row.currency_id ?? row.currencyId ?? "",
    currencyCode: row.currency_code ?? row.currencyCode ?? row.currency ?? "",
    currencyName: row.currency_name ?? row.currencyName ?? "",
    currencySymbol: row.currency_symbol ?? row.currencySymbol ?? "",
    currency: formatCurrencyDisplay(
      row.currency_name ?? row.currencyName,
      row.currency_code ?? row.currencyCode ?? row.currency,
      row.currency_symbol ?? row.currencySymbol
    ) || row.currency_code || row.currency || row.currencyCode,
    cost: row.cost ?? row.total_cost ?? row.total_cost_lc ?? 0,
    dividends: row.dividends ?? row.total_dividends ?? 0,
    interests: row.interests ?? row.interest ?? row.total_interests ?? 0,
    moicExcl: row.moicExcl ?? row.moic_excl ?? 0,
    moicIncl: row.moicIncl ?? row.moic_lc_incl ?? 0,
    irr: row.irr ?? 0,
    fairValue: row.fair_value ?? row.fairValue ?? row.valuation ?? row.amount ?? 0,
    unrealizedGain: row.unrealized_gain ?? row.unrealizedGain ?? 0,
    exitValue: row.exit_value ?? row.exitValue ?? row.amount ?? 0,
    realized: row.realized ?? row.realized_gain ?? row.realizedGain ?? 0,
    status: row.status ?? row.investment_status ?? row.portfolio_status ?? null,
    transaction_flows: row.transaction_flows || [],
    fair_value_flows: row.fair_value_flows || [],
  });

  const computeStatusFromFlows = useCallback((flows, date) => {
    try {
      if (!flows.length) return { status: "unallocated", include: true };
      const flowsWithDate = flows
        .filter((f) => f?.date)
        .filter((f) => new Date(f.date) <= new Date(date));
      if (!flowsWithDate.length) return { status: null, include: false };

      let totalExitPct = 0;
      let hasFullDivestment = false;

      flowsWithDate.forEach((f) => {
        const typeName = String(
          f.transaction_name ?? f.transaction_type_name ?? f.transaction_type?.name ?? f.transaction_type ?? f.type ?? ""
        ).trim().toLowerCase();
        const isPartial = typeName.includes("partial") && typeName.includes("divest");
        const isDivestment = typeName.includes("divest") && !typeName.includes("partial");
        if (isDivestment) { hasFullDivestment = true; totalExitPct = 100; }
        else if (isPartial) { totalExitPct += partialDivestmentFromBackend(f.divestment_percentage); }
      });

      if (hasFullDivestment || totalExitPct >= 100) return { status: "realized", include: true };
      if (totalExitPct > 0) return { status: "partial", include: true };
      return { status: "unrealized", include: true };
    } catch (err) {
      console.error("Failed to compute status:", err);
      return { status: "unrealized", include: true };
    }
  }, []);

  const computeMetricsFromFlows = useCallback((flows, fairValues, date) => {
    const cutoff = new Date(date);
    const flowsWithDate = flows.filter((f) => f?.date).filter((f) => new Date(f.date) <= cutoff);

    let costEur = 0;
    let dividendsEur = 0;
    const cashflows = [];

    flowsWithDate.forEach((f) => {
      const typeName = canonicalType(
        f.transaction_name ?? f.transaction_type_name ?? f.transaction_type?.name ?? f.transaction_type ?? f.type ?? ""
      );
      const amountLc = toNumber(f.amount_lc ?? f.amountLC ?? f.amount);
      const fxRate = toNumber(f.fx_rate ?? f.fxRate);
      const amountEur = fxRate ? amountLc / fxRate : toNumber(f.amount ?? 0);

      if (typeName === "Investment") {
        costEur += Math.abs(amountEur);
        cashflows.push({ date: new Date(f.date), amount: -Math.abs(amountEur) });
      } else if (typeName === "Dividend" || typeName === "Interest") {
        dividendsEur += Math.abs(amountEur);
        cashflows.push({ date: new Date(f.date), amount: Math.abs(amountEur) });
      } else if (typeName === "Divestment" || typeName === "Partial divestment" || typeName === "Other") {
        cashflows.push({ date: new Date(f.date), amount: Math.abs(amountEur) });
      }
    });

    const matchingFair = fairValues.find((fv) => String(fv?.date) === String(date));
    const fairAmountLc = matchingFair ? toNumber(matchingFair.amount_lc ?? matchingFair.amountLC) : 0;
    const fairFx = matchingFair ? toNumber(matchingFair.fx_rate ?? matchingFair.fxRate) : 0;
    const fairAmountEur = matchingFair
      ? toNumber(matchingFair.amount ?? (fairFx ? fairAmountLc / fairFx : 0))
      : 0;

    if (fairAmountEur) cashflows.push({ date: new Date(date), amount: fairAmountEur });

    const irr = safeXirr(
      cashflows
        .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
        .sort((a, b) => a.date - b.date)
    );

    const valueEur = fairAmountEur;
    const gainEur = valueEur + dividendsEur - costEur;
    const moicExcl = costEur ? valueEur / costEur : 0;
    const moicIncl = costEur ? (fairAmountEur + dividendsEur) / costEur : 0;

    return { cost: costEur, dividends: dividendsEur, fairValue: valueEur, unrealizedGain: gainEur, moicExcl, moicIncl, irr: irr ?? 0 };
  }, []);

  const loadSummaryData = useCallback(() => {
    if (!numericFundId) return;
    try {
      const rows = (Array.isArray(portfolio?.investments) ? portfolio.investments : []).map(normalizeRow);
      const nextUnrealized = [];
      const nextRealized = [];
      const nextUnallocated = [];

      rows.forEach((row) => {
        const statusComputed = computeStatusFromFlows(row.transaction_flows, metricsCutoffDate);
        const metrics = computeMetricsFromFlows(row.transaction_flows, row.fair_value_flows, metricsCutoffDate);
        const enriched = { ...row, ...metrics };
        const { status, include } = statusComputed;

        if (!include) return;
        if (status === "unallocated") { nextUnallocated.push(enriched); return; }
        if (status === "realized") { nextRealized.push(enriched); return; }
        if (status === "partial") { nextUnrealized.push(enriched); nextRealized.push(enriched); return; }
        nextUnrealized.push(enriched);
      });

      setUnrealizedRows(nextUnrealized);
      setRealizedRows(nextRealized);
      setUnallocatedRows(nextUnallocated);
    } catch (err) {
      console.error("Failed to load portfolio summary:", err);
      showToast({ type: "error", title: "Load failed", message: "Failed to load portfolio summary." });
    }
  }, [numericFundId, metricsCutoffDate, portfolio?.investments, computeStatusFromFlows, computeMetricsFromFlows, showToast]);

  useEffect(() => { loadSummaryData(); }, [loadSummaryData]);

  useEffect(() => {
    if (!quarters.length) return;
    const hasSelected = quarters.some((q) => Number(q.id) === Number(selectedQuarter));
    if (!hasSelected) setSelectedQuarter(Number(quarters[quarters.length - 1].id));
  }, [quarters, selectedQuarter]);

  const buildPortfolioCashflows = useCallback((rows) => {
    const cutoff = new Date(metricsCutoffDate);
    const cashflows = [];

    rows.forEach((row) => {
      const flows = Array.isArray(row?.transaction_flows) ? row.transaction_flows : [];
      flows
        .filter((f) => f?.date)
        .filter((f) => new Date(f.date) <= cutoff)
        .forEach((f) => {
          const typeName = canonicalType(
            f.transaction_name ?? f.transaction_type_name ?? f.transaction_type?.name ?? f.transaction_type ?? f.type ?? ""
          );
          const amountLc = toNumber(f.amount_lc ?? f.amountLC ?? f.amount);
          const fxRate = toNumber(f.fx_rate ?? f.fxRate);
          const amountEur = fxRate ? amountLc / fxRate : toNumber(f.amount ?? 0);
          const absAmountEur = Math.abs(amountEur);
          if (!Number.isFinite(absAmountEur) || absAmountEur === 0) return;
          if (typeName === "Investment") {
            cashflows.push({ date: new Date(f.date), amount: -absAmountEur });
            return;
          }
          if (["Dividend", "Interest", "Other", "Divestment", "Partial divestment"].includes(typeName)) {
            cashflows.push({ date: new Date(f.date), amount: absAmountEur });
          }
        });

      const fairValues = Array.isArray(row?.fair_value_flows) ? row.fair_value_flows : [];
      const matchingFair = fairValues.find((fv) => String(fv?.date) === String(metricsCutoffDate));
      if (matchingFair) {
        const fairAmountLc = toNumber(matchingFair.amount_lc ?? matchingFair.amountLC);
        const fairFx = toNumber(matchingFair.fx_rate ?? matchingFair.fxRate);
        const fairAmountEur = toNumber(matchingFair.amount ?? (fairFx ? fairAmountLc / fairFx : 0));
        if (Number.isFinite(fairAmountEur) && fairAmountEur !== 0) {
          cashflows.push({ date: cutoff, amount: fairAmountEur });
        }
      }
    });

    return cashflows
      .filter((c) => c?.date instanceof Date && !Number.isNaN(c.date.getTime()) && Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date);
  }, [metricsCutoffDate]);

  const buildSummary = useCallback((rows) => {
    const cost = rows.reduce((s, r) => s + toNumber(r.cost), 0);
    const dividends = rows.reduce((s, r) => s + calcDividendsTotal(r), 0);
    const value = rows.reduce((s, r) => s + calcValue(r), 0);
    const gain = rows.reduce((s, r) => s + calcGain(r), 0);
    const moicExcl = cost ? value / cost : 0;
    const moicIncl = cost ? (value + dividends) / cost : 0;
    const irr = safeXirr(buildPortfolioCashflows(rows)) ?? 0;
    return { cost, dividends, value, gain, moicExcl, moicIncl, irr };
  }, [buildPortfolioCashflows]);

  const unrealizedSubtotal = useMemo(() => buildSummary(unrealizedRows), [unrealizedRows, buildSummary]);
  const realizedSubtotal = useMemo(() => buildSummary(realizedRows), [realizedRows, buildSummary]);
  const unallocatedSubtotal = useMemo(() => buildSummary(unallocatedRows), [unallocatedRows, buildSummary]);

  const totalRows = useMemo(() => {
    const map = new Map();
    [unrealizedRows, realizedRows, unallocatedRows].flat().forEach((r) => {
      if (r?.id && !map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [unrealizedRows, realizedRows, unallocatedRows]);

  const total = useMemo(() => buildSummary(totalRows), [totalRows, buildSummary]);

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

      const normalizedInvestment = normalizeRow(createdInvestment);
      setIsNewInvestmentOpen(false);
      
      if (Number.isFinite(Number(normalizedInvestment?.id))) {
        setSelectedInvestment(normalizedInvestment);
      }
      showToast({ type: "success", title: "Investment created", message: `"${name}" has been created successfully.` });
      return normalizedInvestment;
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
    
    const refreshedInvestment = normalizeRow(response);
    setSelectedInvestment(refreshedInvestment);
    showToast({ type: "success", title: "Investment updated", message: `"${name}" has been updated successfully.` });
    return refreshedInvestment;
  };

  const handleDeleteInvestment = async (investmentId) => {
    await portfolio.deleteInvestment(null, investmentId);
    setUnrealizedRows((prev) => prev.filter((r) => Number(r.id) !== Number(investmentId)));
    setRealizedRows((prev) => prev.filter((r) => Number(r.id) !== Number(investmentId)));
    setUnallocatedRows((prev) => prev.filter((r) => Number(r.id) !== Number(investmentId)));
    setSelectedInvestment(null);
    showToast({ type: "success", title: "Investment deleted", message: "The investment has been deleted." });
  };

  const handleOpenInvestmentDetails = async (row) => {
    if (!Number.isFinite(Number(row?.id))) {
      showToast({ type: "error", title: "Open failed", message: "Please save the investment before opening details." });
      return;
    }
    try {
      const freshInvestmentRaw = (portfolio?.investments || []).find((i) => Number(i.id ?? i.investment_id) === Number(row.id));
      setSelectedInvestment(normalizeRow(freshInvestmentRaw || row));
    } catch (err) {
      showToast({ type: "error", title: "Open failed", message: err.message || "Failed to load investment details." });
    }
  };

  const handleDownloadExcel = () => {
    const sectionHeaders = ["Name", "Geography", "Ownership", "Cost", "Dividends / Interests", "MOIC", "Gross IRR", "Fair Value", "Gain"];
    const buildSectionRows = (rows, subtotal) => [
      sectionHeaders,
      ...rows.map((r) => [
        r.name,
        r.country,
        `${formatPercentage(r.ownership)}%`,
        formatNumber(r.cost),
        formatNumber(calcDividendsTotal(r)),
        formatNumber(calcMoicIncl(r)),
        formatNumber(r.irr),
        formatNumber(calcValue(r)),
        formatNumber(calcGain(r)),
      ]),
      ["Sub Total", "", "", formatNumber(subtotal.cost), formatNumber(subtotal.dividends), formatNumber(subtotal.moicIncl), formatNumber(subtotal.irr), formatNumber(subtotal.value), formatNumber(subtotal.gain)],
    ];
    exportWorkbook(`portfolio-summary-fund-${numericFundId}.xlsx`, [
      { name: "Unrealized", rows: buildSectionRows(unrealizedRows, unrealizedSubtotal) },
      { name: "Realized", rows: buildSectionRows(realizedRows, realizedSubtotal) },
      { name: "Unallocated", rows: buildSectionRows(unallocatedRows, unallocatedSubtotal) },
    ]);
  };

  const { sorted: sortedUnrealized, sortKey: sortKeyU, toggleSort: toggleSortU } = useTableSort(unrealizedRows, "name");
  const { sorted: sortedRealized, sortKey: sortKeyR, toggleSort: toggleSortR } = useTableSort(realizedRows, "name");
  const { sorted: sortedUnallocated, sortKey: sortKeyA, toggleSort: toggleSortA } = useTableSort(unallocatedRows, "name");

  const sharedTableProps = {
    visibleColumns,
    columnOptions,
    visibleColumnKeys,
    onToggleColumn: toggleColumnVisibility,
    openMenuKey: openColumnsMenu,
    onOpenMenuKey: setOpenColumnsMenu,
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
          <button className="ghost-btn" onClick={handleDownloadExcel}>
            <DownloadIcon /><span>Download</span>
          </button>
          <PermissionGate>
            <button className="primary-btn" onClick={() => setIsNewInvestmentOpen(true)}>
              <PlusIconWhite /><span>New investment</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {loading ? (
        <PageSpinner label="Loading portfolio..." />
      ) : isPortfolioEmpty ? (
        <PageNoData message="No investments found for this fund." />
      ) : (
        <>
          <PortfolioTable
            {...sharedTableProps}
            title="Unrealized portfolio"
            count={unrealizedRows.length}
            rows={sortedUnrealized}
            subtotal={unrealizedSubtotal}
            sortKey={sortKeyU}
            toggleSort={toggleSortU}
            gainLabel="Unrealized Gain"
            menuKey="unrealized"
          />

          <PortfolioTable
            {...sharedTableProps}
            title="Realized portfolio"
            count={realizedRows.length}
            rows={sortedRealized}
            subtotal={realizedSubtotal}
            sortKey={sortKeyR}
            toggleSort={toggleSortR}
            gainLabel="Realized Gain"
            menuKey="realized"
          />

          <PortfolioTable
            {...sharedTableProps}
            title="Unallocated portfolio"
            count={unallocatedRows.length}
            rows={sortedUnallocated}
            subtotal={unallocatedSubtotal}
            sortKey={sortKeyA}
            toggleSort={toggleSortA}
            gainLabel="Unallocated Gain"
            menuKey="unallocated"
          />

          <PortfolioTable
            {...sharedTableProps}
            showTotalRow={true}
            summary={total}
            rows={[]}
            subtotal={{}}
            sortKey={null}
            toggleSort={() => {}}
            gainLabel=""
            menuKey="total"
          />
        </>
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