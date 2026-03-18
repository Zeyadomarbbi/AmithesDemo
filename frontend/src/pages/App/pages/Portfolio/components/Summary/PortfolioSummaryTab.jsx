import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { xirr as xirrLib } from "@webcarrot/xirr";
import useApi from "../../../../../../hooks/api/useApi";

import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector";
import { TimeframeProvider, useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import NewInvestmentModal from "./components/NewInvestmentModal/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";
import { PermissionGate } from "../../../../../../hooks/Auth/PermissionGate";
import { exportWorkbook } from "../../../../../../components/Export/exportExcel";
import "./PortfolioSummaryTab.css";

import {
  DownloadIcon,
  PlusIconWhite
} from "../../icons";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../components/Sort/TableSort";

const toNumber = (v) =>
  Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

const format2 = (v) => {
  const n = toNumber(v);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (v) => `${format2(toNumber(v) * 100)}%`;

const formatCurrencyDisplay = (name, code, symbol) => {
  const safeName   = String(name   || "").trim();
  const safeCode   = String(code   || "").trim();
  const safeSymbol = String(symbol || "").trim();
  if (safeName && safeCode && safeSymbol) return `${safeName} (${safeCode}) ${safeSymbol}`;
  if (safeName && safeCode) return `${safeName} (${safeCode})`;
  if (safeCode && safeSymbol) return `${safeCode} ${safeSymbol}`;
  return safeName || safeCode || safeSymbol || "";
};

// ── Country ISO code lookup for flag images ──────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

const ownershipToDbValue = (ownershipPercent) => {
  const n = toNumber(ownershipPercent);
  return Number(Math.max(0, Math.min(100, n)).toFixed(4));
};

const ownershipFromDbValue = (storedOwnership) => {
  const n = toNumber(storedOwnership);
  return Number(n.toFixed(2));
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

// Shared colgroup — must match tableHeaders column order exactly
const SharedColGroup = () => (
  <colgroup>
    <col style={{ width: "220px" }} /> {/* Name */}
    <col style={{ width: "140px" }} /> {/* Geography */}
    <col style={{ width: "130px" }} /> {/* Cost */}
    <col style={{ width: "190px" }} /> {/* Dividends / Interests */}
    <col style={{ width: "220px" }} /> {/* MOIC LC */}
    <col style={{ width: "200px" }} /> {/* MOIC EUR */}
    <col style={{ width: "150px" }} /> {/* Gross IRR */}
    <col style={{ width: "160px" }} /> {/* Fair Value */}
    <col style={{ width: "160px" }} /> {/* Gain */}
  </colgroup>
);

function PortfolioSummaryTabContent() {
  const api = useApi();
  const { fundId, portfolioDataset, countries, currencies } = useOutletContext();
  const numericFundId = Number(fundId);
  const [toast, setToast] = useState(null);

  const { quarters, isLoading } = useTimeframeContext();
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const selectedQuarterObj = quarters.find((q) => Number(q.id) === Number(selectedQuarter));
  const latestQuarterObj   = quarters.length ? quarters[quarters.length - 1] : null;
  const activeQuarterObj   = selectedQuarterObj || latestQuarterObj || null;

  const [unrealizedRows,  setUnrealizedRows]  = useState([]);
  const [realizedRows,    setRealizedRows]    = useState([]);
  const [unallocatedRows, setUnallocatedRows] = useState([]);

  const selectedTimeframeDate = activeQuarterObj?.rawDate || activeQuarterObj?.date || null;
  const metricsCutoffDate     = selectedTimeframeDate || "9999-12-31";
  const effectiveTimeframe    = activeQuarterObj || null;

  const getFlagUrl = useCallback((countryNameOrId) => {
    if (!countryNameOrId || !countries) return null;

    // Find the country by name (case-insensitive) or by ID
    const countryData = countries.find(c => 
      String(c.name).toLowerCase() === String(countryNameOrId).toLowerCase() ||
      Number(c.id) === Number(countryNameOrId)
    );

    if (!countryData?.iso2) return null;

    // FlagCDN expects lowercase ISO codes
    const code = countryData.iso2.toLowerCase();
    return `https://flagcdn.com/40x30/${code}.png`;
  }, [countries]);

  const normalizeRow = (row) => ({
    id: row.investment_id ?? row.id ?? row.investmentId ?? row.portfolio_investment_id,
    name: row.name,
    sector: row.sector,
    countryId: row.country_id ?? row.countryId ?? "",
    country: row.country_name ?? row.country ?? row.countryName,
    ownership: ownershipFromDbValue(row.ownership),
    currencyId: row.currency_id ?? row.currencyId ?? "",
    currencyCode:   row.currency_code   ?? row.currencyCode   ?? row.currency ?? "",
    currencyName:   row.currency_name   ?? row.currencyName   ?? "",
    currencySymbol: row.currency_symbol ?? row.currencySymbol ?? "",
    currency: formatCurrencyDisplay(
      row.currency_name   ?? row.currencyName,
      row.currency_code   ?? row.currencyCode ?? row.currency,
      row.currency_symbol ?? row.currencySymbol
    ) || row.currency_code || row.currency || row.currencyCode,
    cost:          row.cost          ?? row.total_cost    ?? row.total_cost_lc ?? 0,
    dividends:     row.dividends     ?? row.total_dividends ?? 0,
    interests:     row.interests     ?? row.interest       ?? row.total_interests ?? 0,
    moic:          row.moic          ?? 0,
    moicLcIncl:    row.moicLcIncl    ?? row.moic_lc_incl  ?? 0,
    moicExcl:      row.moicExcl      ?? row.moic_excl     ?? 0,
    irr:           row.irr           ?? 0,
    fairValue:     row.fair_value    ?? row.fairValue      ?? row.valuation ?? row.amount ?? 0,
    unrealizedGain: row.unrealized_gain ?? row.unrealizedGain ?? 0,
    exitValue:     row.exit_value    ?? row.exitValue      ?? row.amount ?? 0,
    realized:      row.realized      ?? row.realized_gain  ?? row.realizedGain ?? 0,
    status:        row.status        ?? row.investment_status ?? row.portfolio_status ?? null,
    transaction_flows: row.transaction_flows || [],
    fair_value_flows:  row.fair_value_flows  || [],
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
        const isPartial    = typeName.includes("partial") && typeName.includes("divest");
        const isDivestment = typeName.includes("divest") && !typeName.includes("partial");
        if (isDivestment) { hasFullDivestment = true; totalExitPct = 100; }
        else if (isPartial) { totalExitPct += toNumber(f.divestment_percentage); }
      });

      if (hasFullDivestment || totalExitPct >= 100) return { status: "realized",   include: true };
      if (totalExitPct > 0)                          return { status: "partial",    include: true };
      return                                                { status: "unrealized", include: true };
    } catch (err) {
      console.error("Failed to compute status:", err);
      return { status: "unrealized", include: true };
    }
  }, []);

  const computeMetricsFromFlows = useCallback((flows, fairValues, date) => {
    const cutoff = new Date(date);
    const flowsWithDate = flows.filter((f) => f?.date).filter((f) => new Date(f.date) <= cutoff);

    let costLc = 0, costEur = 0, dividendsLc = 0, dividendsEur = 0;
    const cashflows = [];

    flowsWithDate.forEach((f) => {
      const typeName  = canonicalType(f.transaction_name ?? f.transaction_type_name ?? f.transaction_type?.name ?? f.transaction_type ?? f.type ?? "");
      const amountLc  = toNumber(f.amount_lc ?? f.amountLC ?? f.amount);
      const fxRate    = toNumber(f.fx_rate ?? f.fxRate);
      const amountEur = fxRate ? amountLc / fxRate : toNumber(f.amount ?? 0);

      if (typeName === "Investment") {
        costLc  += Math.abs(amountLc);
        costEur += Math.abs(amountEur);
        cashflows.push({ date: new Date(f.date), amount: -Math.abs(amountEur) });
      } else if (typeName === "Dividend" || typeName === "Interest") {
        dividendsLc  += Math.abs(amountLc);
        dividendsEur += Math.abs(amountEur);
        cashflows.push({ date: new Date(f.date), amount: Math.abs(amountEur) });
      } else if (typeName === "Divestment" || typeName === "Partial divestment" || typeName === "Other") {
        cashflows.push({ date: new Date(f.date), amount: Math.abs(amountEur) });
      }
    });

    const matchingFair = fairValues.find((fv) => String(fv?.date) === String(date));
    const fairAmountLc  = matchingFair ? toNumber(matchingFair.amount_lc ?? matchingFair.amountLC) : 0;
    const fairFx        = matchingFair ? toNumber(matchingFair.fx_rate ?? matchingFair.fxRate) : 0;
    const fairAmountEur = matchingFair ? toNumber(matchingFair.amount ?? (fairFx ? fairAmountLc / fairFx : 0)) : 0;

    if (fairAmountEur) cashflows.push({ date: new Date(date), amount: fairAmountEur });

    const irr = safeXirr(
      cashflows.filter((c) => Number.isFinite(c.amount) && c.amount !== 0).sort((a, b) => a.date - b.date)
    );

    const valueEur  = fairAmountEur;
    const valueLc   = fairAmountLc || (fairAmountEur && fairFx ? fairAmountEur * fairFx : 0);
    const gainEur   = valueEur + dividendsEur - costEur;
    const moicExcl  = costEur ? valueEur / costEur : 0;
    const moicIncl = costEur ? (fairAmountEur + dividendsEur) / costEur : 0;

    return { cost: costEur, dividends: dividendsEur, fairValue: valueEur, unrealizedGain: gainEur, moicExcl, moicIncl, irr: irr ?? 0 };
  }, []);

  const loadSummaryData = useCallback(() => {
    if (!numericFundId) return;
    try {
      const rows = (Array.isArray(portfolioDataset?.investments) ? portfolioDataset.investments : []).map(normalizeRow);
      const nextUnrealized = [], nextRealized = [], nextUnallocated = [];

      rows.forEach((row) => {
        const statusComputed = computeStatusFromFlows(row.transaction_flows, metricsCutoffDate);
        const metrics        = computeMetricsFromFlows(row.transaction_flows, row.fair_value_flows, metricsCutoffDate);
        const enriched       = { ...row, ...metrics };
        const { status, include } = statusComputed;

        if (!include) return;
        if (status === "unallocated") { nextUnallocated.push(enriched); return; }
        if (status === "realized")    { nextRealized.push(enriched); return; }
        if (status === "partial")     { nextUnrealized.push(enriched); nextRealized.push(enriched); return; }
        nextUnrealized.push(enriched);
      });

      setUnrealizedRows(nextUnrealized);
      setRealizedRows(nextRealized);
      setUnallocatedRows(nextUnallocated);
    } catch (err) {
      console.error("Failed to load portfolio summary:", err);
      setToast({ type: "error", message: "Failed to load portfolio summary." });
    }
  }, [numericFundId, metricsCutoffDate, portfolioDataset, computeStatusFromFlows, computeMetricsFromFlows]);

  useEffect(() => { loadSummaryData(); }, [loadSummaryData]);

  useEffect(() => {
    if (!quarters.length) return;
    const hasSelected = quarters.some((q) => Number(q.id) === Number(selectedQuarter));
    if (!hasSelected) setSelectedQuarter(Number(quarters[quarters.length - 1].id));
  }, [quarters, selectedQuarter]);

  const calcValue          = (row) => toNumber(row.fairValue !== null && row.fairValue !== undefined ? row.fairValue : row.exitValue);
  const calcDividendsTotal = (row) => toNumber(row.dividends) + toNumber(row.interests);
  const calcGain           = (row) => calcValue(row) + calcDividendsTotal(row) - toNumber(row.cost);
  const calcMoicExcl       = (row) => row.moicExcl   !== undefined ? toNumber(row.moicExcl)   : 0;
  const calcMoicIncl = (row) => row.moicIncl !== undefined ? toNumber(row.moicIncl) : 0;

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

          if (
            typeName === "Dividend" ||
            typeName === "Interest" ||
            typeName === "Other" ||
            typeName === "Divestment" ||
            typeName === "Partial divestment"
          ) {
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
    const cost      = rows.reduce((s, r) => s + toNumber(r.cost), 0);
    const dividends = rows.reduce((s, r) => s + calcDividendsTotal(r), 0);
    const value     = rows.reduce((s, r) => s + calcValue(r), 0);
    const gain      = rows.reduce((s, r) => s + calcGain(r), 0);
    const moicExcl  = cost ? value / cost : 0;
    const moicIncl = cost ? (value + dividends) / cost : 0;
    const irr       = safeXirr(buildPortfolioCashflows(rows)) ?? 0;
    return { cost, dividends, value, gain, moicExcl, moicIncl, irr };
  }, [buildPortfolioCashflows]);

  const handleAddInvestment = async ({ name, sector, countryId, currencyId, ownership }) => {
    if (!name || !String(name).trim()) { setToast({ type: "error", message: "Please enter an investment name." }); return; }
    const ownershipValue = Number(String(ownership).replace(/,/g, "").trim());
    if (!Number.isFinite(ownershipValue) || ownershipValue < 0 || ownershipValue > 100) {
      setToast({ type: "error", message: "Ownership must be between 0 and 100." }); return;
    }
    try {
      await api.post(`/api/funds/${numericFundId}/portfolio-investments/`, {
        name, sector,
        ownership: ownershipToDbValue(ownershipValue),
        country_id: Number(countryId),
        currency_id: Number(currencyId),
      });
      if (typeof portfolioDataset?.refresh === "function") await portfolioDataset.refresh();
      setIsNewInvestmentOpen(false);
    } catch (err) {
      console.error("Create investment failed:", err.message);
      setToast({
        type: "error",
        message: err.message?.toLowerCase().includes("duplicate")
          ? "Investment name already exists for this fund. Please choose another name."
          : "Failed to create investment. Please check your input.",
      });
    }
  };

  const handleUpdateInvestment = async (investmentId, { name, sector, countryId, currencyId, ownership }) => {
    if (!name || !String(name).trim()) {
      throw new Error("Please enter an investment name.");
    }
    const ownershipValue = Number(String(ownership).replace(/,/g, "").trim());
    if (!Number.isFinite(ownershipValue) || ownershipValue < 0 || ownershipValue > 100) {
      throw new Error("Ownership must be between 0 and 100.");
    }

    const response = await api.put(`/api/funds/${numericFundId}/portfolio-investments/${investmentId}/`, {
      name,
      sector,
      ownership: ownershipToDbValue(ownershipValue),
      country_id: Number(countryId),
      currency_id: Number(currencyId),
    });

    if (typeof portfolioDataset?.refresh === "function") {
      await portfolioDataset.refresh();
    }

    const refreshedRows = (Array.isArray(portfolioDataset?.investments) ? portfolioDataset.investments : []).map(normalizeRow);
    const refreshedInvestment =
      refreshedRows.find((row) => Number(row.id) === Number(investmentId)) || normalizeRow(response);
    setSelectedInvestment(refreshedInvestment);
    return refreshedInvestment;
  };

  const handleDeleteInvestment = async (investmentId) => {
    await api.delete(`/api/funds/${numericFundId}/portfolio-investments/${investmentId}/`);
    if (typeof portfolioDataset?.refresh === "function") {
      await portfolioDataset.refresh();
    }
    setUnrealizedRows((prev) => prev.filter((row) => Number(row.id) !== Number(investmentId)));
    setRealizedRows((prev) => prev.filter((row) => Number(row.id) !== Number(investmentId)));
    setUnallocatedRows((prev) => prev.filter((row) => Number(row.id) !== Number(investmentId)));
    setSelectedInvestment(null);
    setToast({
      type: "success",
      message: "The investment has been deleted.",
    });
  };

  const handleOpenInvestmentDetails = async (row) => {
    if (!Number.isFinite(Number(row?.id))) {
      setToast({ type: "error", message: "Please save the investment before opening details." });
      return;
    }

    try {
      const freshInvestment = await api.get(`/api/funds/${numericFundId}/portfolio-investments/${row.id}/`);
      setSelectedInvestment(normalizeRow(freshInvestment));
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Failed to load investment details.",
      });
    }
  };

  const unrealizedSubtotal  = useMemo(() => buildSummary(unrealizedRows),  [unrealizedRows]);
  const realizedSubtotal    = useMemo(() => buildSummary(realizedRows),    [realizedRows]);
  const unallocatedSubtotal = useMemo(() => buildSummary(unallocatedRows), [unallocatedRows]);

  const totalRows = useMemo(() => {
    const map = new Map();
    [unrealizedRows, realizedRows, unallocatedRows].flat().forEach((r) => { if (r?.id && !map.has(r.id)) map.set(r.id, r); });
    return Array.from(map.values());
  }, [unrealizedRows, realizedRows, unallocatedRows]);

  const total = useMemo(() => buildSummary(totalRows), [totalRows]);

  const handleDownloadExcel = () => {
    const sectionHeaders = ["Name", "Geography", "Cost", "Dividends / Interests", "MOIC € (incl. dividends)", "MOIC EUR (excl. dividends)", "Gross IRR EUR", "Fair Value", "Gain"];
    const buildSectionRows = (rows, subtotal) => [
      sectionHeaders,
      ...rows.map((r) => [r.name, r.country, toNumber(r.cost), toNumber(calcDividendsTotal(r)), toNumber(calcMoicIncl(r)), toNumber(calcMoicExcl(r)), toNumber(r.irr), toNumber(calcValue(r)), toNumber(calcGain(r))]),
      ["Sub Total", "", toNumber(subtotal.cost), toNumber(subtotal.dividends), toNumber(subtotal.moicIncl), toNumber(subtotal.moicExcl), toNumber(subtotal.irr), toNumber(subtotal.value), toNumber(subtotal.gain)],
    ];
    exportWorkbook(`portfolio-summary-fund-${numericFundId}.xlsx`, [
      { name: "Unrealized",  rows: buildSectionRows(unrealizedRows,  unrealizedSubtotal) },
      { name: "Realized",    rows: buildSectionRows(realizedRows,    realizedSubtotal) },
      { name: "Unallocated", rows: buildSectionRows(unallocatedRows, unallocatedSubtotal) },
      { name: "Total", rows: [
        ["Total Cost", "Total Dividends / Interests", "Total MOIC € (incl. dividends)", "Total MOIC EUR (excl. dividends)", "Total Gross IRR EUR", "Total Fair Value", "Total Gain"],
        [toNumber(total.cost), toNumber(total.dividends), toNumber(total.moicIncl), toNumber(total.moicExcl), toNumber(total.irr), toNumber(total.value), toNumber(total.gain)],
      ]},
    ]);
  };

  const renderTableBody = (rows) => (
    <>
      {rows.map((r) => (
        <tr key={r.id}>
          <td className="name-cell" onClick={() => handleOpenInvestmentDetails(r)}>
            <div className="name-main">{r.name}</div>
            <div className="name-sub">{r.sector}</div>
          </td>
          <td>
            <div className="geography-cell">
              {getFlagUrl(r.country) && (
                <img
                  src={getFlagUrl(r.country)}
                  alt={r.country}
                  className="country-flag-img"
                  width={20}
                  height={15}
                />
              )}
              <span>{r.country}</span>
            </div>
          </td>
          <td>{format2(r.cost)}</td>
          <td>{format2(calcDividendsTotal(r))}</td>
          <td>{format2(calcMoicIncl(r))}</td>
          <td>{format2(calcMoicExcl(r))}</td>
          <td>{formatPercent(r.irr)}</td>
          <td className="col-highlight">{format2(calcValue(r))}</td>
          <td className="col-highlight">{format2(calcGain(r))}</td>
        </tr>
      ))}
    </>
  );

  const renderSubtotalRow = (subtotal) => (
    <tr className="portfolio-subtotal-row">
      <td className="subtotal-name-cell">Sub Total</td>
      <td />
      <td>{format2(subtotal.cost)}</td>
      <td>{format2(subtotal.dividends)}</td>
      <td>{format2(subtotal.moicIncl)}</td>
      <td>{format2(subtotal.moicExcl)}</td>
      <td>{formatPercent(subtotal.irr)}</td>
      <td className="col-highlight">{format2(subtotal.value)}</td>
      <td className="col-highlight">{format2(subtotal.gain)}</td>
    </tr>
  );

  const { sorted: sortedUnrealized, sortKey: sortKeyU, toggleSort: toggleSortU } = useTableSort(unrealizedRows, "name");
  const { sorted: sortedRealized,   sortKey: sortKeyR, toggleSort: toggleSortR } = useTableSort(realizedRows,   "name");
  const { sorted: sortedUnallocated,sortKey: sortKeyA, toggleSort: toggleSortA } = useTableSort(unallocatedRows,"name");

  const tableHeaders = (gainLabel, sortKey, toggleSort) => (
    <tr>
      <th><SortableHeaderRenderer label="Name" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} /></th>
      <th><SortableHeaderRenderer label="Geography" columnKey="country" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} /></th>
      <th><SortableHeaderRenderer label="Cost" columnKey="cost" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
      <th><SortableHeaderRenderer label="Dividends / Interests" columnKey="dividends" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
      <th><SortableHeaderRenderer label="MOIC (incl. dividends)" columnKey="moicIncl" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
      <th><SortableHeaderRenderer label="MOIC (excl. dividends)" columnKey="moicExcl" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
      <th><SortableHeaderRenderer label="Gross IRR" columnKey="irr" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
      <th className="col-highlight"><SortableHeaderRenderer label="Fair Value" columnKey="fairValue" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
      <th className="col-highlight"><SortableHeaderRenderer label={gainLabel} columnKey="unrealizedGain" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={true} /></th>
    </tr>
  );

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

      <section className="portfolio-section">
          <div className="portfolio-table-card">
            <div className="portfolio-section-header">
              <h2>Unrealized portfolio<span className="portfolio-count">{unrealizedRows.length}</span></h2>
            </div>
            <div className="portfolio-table-scroll">
              <table className="portfolio-table">
                <SharedColGroup />
                <thead>{tableHeaders("Unrealized Gain", sortKeyU, toggleSortU)}</thead>
                <tbody>{renderTableBody(sortedUnrealized)}{renderSubtotalRow(unrealizedSubtotal)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="portfolio-section">
          <div className="portfolio-table-card">
            <div className="portfolio-section-header">
              <h2>Realized portfolio<span className="portfolio-count">{realizedRows.length}</span></h2>
            </div>
            <div className="portfolio-table-scroll">
              <table className="portfolio-table">
                <SharedColGroup />
                <thead>{tableHeaders("Realized Gain", sortKeyR, toggleSortR)}</thead>
                <tbody>{renderTableBody(sortedRealized)}{renderSubtotalRow(realizedSubtotal)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="portfolio-section">
          <div className="portfolio-table-card">
            <div className="portfolio-section-header">
              <h2>Unallocated portfolio<span className="portfolio-count">{unallocatedRows.length}</span></h2>
            </div>
            <div className="portfolio-table-scroll">
              <table className="portfolio-table">
                <SharedColGroup />
                <thead>{tableHeaders("Unallocated Gain", sortKeyA, toggleSortA)}</thead>
                <tbody>{renderTableBody(sortedUnallocated)}{renderSubtotalRow(unallocatedSubtotal)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="portfolio-total-section">
          <div className="portfolio-table-scroll">
            <table className="portfolio-table total-table">
              <SharedColGroup />
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                  <th>Total Cost</th>
                  <th>Total Dividends / Interests</th>
                  <th>Total MOIC € (incl. dividends)</th>
                  <th>Total MOIC € (excl. dividends)</th>
                  <th>Total Gross IRR €</th>
                  <th className="col-highlight">Total Fair Value</th>
                  <th className="col-highlight">Total Gain</th>
                </tr>
              </thead>
              <tbody>
                <tr className="portfolio-subtotal-row total-row">
                  <td className="subtotal-name-cell">Total</td><td />
                  <td>{format2(total.cost)}</td>
                  <td>{format2(total.dividends)}</td>
                  <td>{format2(total.moicIncl)}</td>
                  <td>{format2(total.moicExcl)}</td>
                  <td>{formatPercent(total.irr)}</td>
                  <td className="col-highlight">{format2(total.value)}</td>
                  <td className="col-highlight">{format2(total.gain)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

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
          countries={countries}
          currencies={currencies}
          onClose={() => setSelectedInvestment(null)}
          onSaved={async () => { if (typeof portfolioDataset?.refresh === "function") await portfolioDataset.refresh(); }}
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Close">×</button>
        </div>
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
