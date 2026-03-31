import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { xirr as xirrLib } from "@webcarrot/xirr";

import TimeframeSelector from "../../../../../../components/QuarterSelection/TimeframeSelector";
import { TimeframeProvider, useTimeframeContext } from "../../../../hooks/Core/TimeframeContext";
import NewInvestmentModal from "./components/NewInvestmentModal/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";
import { PermissionGate } from "../../../../../../hooks/Auth/PermissionGate";
import { exportWorkbook } from "../../../../../../components/Export/exportExcel";
import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import "./PortfolioSummaryTab.css";

import {
  DownloadIcon,
  PlusIconWhite,
  ChevronDownIcon,
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
  return Number(n.toFixed(2));
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

const CurrencyLabel = ({ text }) => (
  <>{text} <span className="portfolioHeaderCurrency">(EUR)</span></>
);

const FilterColumnsIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g filter="url(#portfolioColumnsFilter)">
      <path d="M2 9C2 4.58172 5.58172 1 10 1H26C30.4183 1 34 4.58172 34 9V25C34 29.4183 30.4183 33 26 33H10C5.58172 33 2 29.4183 2 25V9Z" fill="white"/>
      <path d="M10 1.5H26C30.1421 1.5 33.5 4.85786 33.5 9V25C33.5 29.1421 30.1421 32.5 26 32.5H10C5.85786 32.5 2.5 29.1421 2.5 25V9C2.5 4.85786 5.85786 1.5 10 1.5Z" stroke="rgba(204,205,206,0.5)"/>
      <g clipPath="url(#portfolioColumnsClip)">
        <path fillRule="evenodd" clipRule="evenodd" d="M11.334 13.0007C11.334 12.6325 11.6325 12.334 12.0007 12.334H24.0007C24.3688 12.334 24.6673 12.6325 24.6673 13.0007C24.6673 13.3688 24.3688 13.6673 24.0007 13.6673H12.0007C11.6325 13.6673 11.334 13.3688 11.334 13.0007ZM13.334 17.0007C13.334 16.6325 13.6325 16.334 14.0007 16.334H22.0007C22.3688 16.334 22.6673 16.6325 22.6673 17.0007C22.6673 17.3688 22.3688 17.6673 22.0007 17.6673H14.0007C13.6325 17.6673 13.334 17.3688 13.334 17.0007ZM15.334 21.0007C15.334 20.6325 15.6325 20.334 16.0007 20.334H20.0007C20.3688 20.334 20.6673 20.6325 20.6673 21.0007C20.6673 21.3688 20.3688 21.6673 20.0007 21.6673H16.0007C15.6325 21.6673 15.334 21.3688 15.334 21.0007Z" fill="#375A89"/>
      </g>
    </g>
    <defs>
      <filter id="portfolioColumnsFilter" x="0" y="0" width="36" height="36" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.01 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_16929_38813"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_16929_38813" result="shape"/>
      </filter>
      <clipPath id="portfolioColumnsClip">
        <rect width="16" height="16" fill="white" transform="translate(10 9)"/>
      </clipPath>
    </defs>
  </svg>
);

function PortfolioSummaryTabContent() {
  const { fundId, portfolioDataset, countries, currencies } = useOutletContext();
  const numericFundId = Number(fundId);
  const { toast, showToast, closeToast } = useToast();

  const { quarters } = useTimeframeContext();
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState([
    "country",
    "ownership",
    "cost",
    "dividends",
    "moic",
    "irr",
    "fairValue",
    "gain",
  ]);
  const [openColumnsMenu, setOpenColumnsMenu] = useState(null);
  const columnsMenuRef = useRef(null);

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
        if (isDivestment) {
          hasFullDivestment = true;
          totalExitPct = 100;
        } else if (isPartial) {
          totalExitPct += partialDivestmentFromBackend(f.divestment_percentage);
        }
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
      const typeName = canonicalType(f.transaction_name ?? f.transaction_type_name ?? f.transaction_type?.name ?? f.transaction_type ?? f.type ?? "");
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
    const fairAmountEur = matchingFair ? toNumber(matchingFair.amount ?? (fairFx ? fairAmountLc / fairFx : 0)) : 0;

    if (fairAmountEur) cashflows.push({ date: new Date(date), amount: fairAmountEur });

    const irr = safeXirr(
      cashflows.filter((c) => Number.isFinite(c.amount) && c.amount !== 0).sort((a, b) => a.date - b.date)
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
      const rows = (Array.isArray(portfolioDataset?.investments) ? portfolioDataset.investments : []).map(normalizeRow);
      const nextUnrealized = [];
      const nextRealized = [];
      const nextUnallocated = [];

      rows.forEach((row) => {
        const statusComputed = computeStatusFromFlows(row.transaction_flows, metricsCutoffDate);
        const metrics = computeMetricsFromFlows(row.transaction_flows, row.fair_value_flows, metricsCutoffDate);
        const enriched = { ...row, ...metrics };
        const { status, include } = statusComputed;

        if (!include) return;
        if (status === "unallocated") {
          nextUnallocated.push(enriched);
          return;
        }
        if (status === "realized") {
          nextRealized.push(enriched);
          return;
        }
        if (status === "partial") {
          nextUnrealized.push(enriched);
          nextRealized.push(enriched);
          return;
        }
        nextUnrealized.push(enriched);
      });

      setUnrealizedRows(nextUnrealized);
      setRealizedRows(nextRealized);
      setUnallocatedRows(nextUnallocated);
    } catch (err) {
      console.error("Failed to load portfolio summary:", err);
      showToast({ type: "error", title: "Load failed", message: "Failed to load portfolio summary." });
    }
  }, [numericFundId, metricsCutoffDate, portfolioDataset, computeStatusFromFlows, computeMetricsFromFlows, showToast]);

  useEffect(() => { loadSummaryData(); }, [loadSummaryData]);

  useEffect(() => {
    if (!quarters.length) return;
    const hasSelected = quarters.some((q) => Number(q.id) === Number(selectedQuarter));
    if (!hasSelected) setSelectedQuarter(Number(quarters[quarters.length - 1].id));
  }, [quarters, selectedQuarter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target)) {
        setOpenColumnsMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calcValue = (row) => toNumber(row.fairValue !== null && row.fairValue !== undefined ? row.fairValue : row.exitValue);
  const calcDividendsTotal = (row) => toNumber(row.dividends) + toNumber(row.interests);
  const calcGain = (row) => calcValue(row) + calcDividendsTotal(row) - toNumber(row.cost);
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
          if (typeName === "Dividend" || typeName === "Interest" || typeName === "Other" ||
              typeName === "Divestment" || typeName === "Partial divestment") {
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

  const handleAddInvestment = async ({ name, sector, countryId, currencyId, ownership }) => {
    if (!name || !String(name).trim()) { showToast({ type: "error", title: "Create failed", message: "Please enter an investment name." }); return false; }
    const ownershipValue = Number(String(ownership).replace(/,/g, "").trim());
    if (!Number.isFinite(ownershipValue) || ownershipValue < 0 || ownershipValue > 100) {
      showToast({ type: "error", title: "Create failed", message: "Ownership must be between 0 and 100." }); return false;
    }
    try {
      const createdInvestment = await portfolioDataset.createInvestment({
        name, sector,
        ownership: ownershipToDbValue(ownershipValue),
        country_id: Number(countryId),
        currency_id: Number(currencyId),
      });

      const createdInvestmentId = Number(
        createdInvestment?.investment_id ??
        createdInvestment?.id ??
        createdInvestment?.investmentId ??
        createdInvestment?.portfolio_investment_id
      );

      let investmentToOpen = createdInvestment;
      if (Number.isFinite(createdInvestmentId) && typeof portfolioDataset?.fetchInvestment === "function") {
        try {
          investmentToOpen = await portfolioDataset.fetchInvestment(createdInvestmentId);
        } catch (detailsErr) {
          console.error("Failed to load created investment details:", detailsErr.message);
        }
      }

      let normalizedInvestment = normalizeRow(investmentToOpen);
      if (!Number.isFinite(Number(normalizedInvestment?.id)) && typeof portfolioDataset?.fetchInvestments === "function") {
        try {
          const refreshedInvestments = await portfolioDataset.fetchInvestments();
          const matchingInvestment = (Array.isArray(refreshedInvestments) ? refreshedInvestments : []).find((investmentRow) => (
            String(investmentRow?.name || "").trim().toLowerCase() === String(name).trim().toLowerCase() &&
            String(investmentRow?.sector || "").trim().toLowerCase() === String(sector).trim().toLowerCase()
          ));
          if (matchingInvestment) normalizedInvestment = normalizeRow(matchingInvestment);
        } catch (listErr) {
          console.error("Failed to locate created investment in portfolio list:", listErr.message);
        }
      }

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
    const response = await portfolioDataset.updateInvestment(investmentId, {
      name,
      sector,
      ownership: ownershipToDbValue(ownershipValue),
      country_id: Number(countryId),
      currency_id: Number(currencyId),
    });
    const refreshedInvestment = typeof portfolioDataset?.fetchInvestment === "function"
      ? normalizeRow(await portfolioDataset.fetchInvestment(investmentId))
      : normalizeRow(response);
    setSelectedInvestment(refreshedInvestment);
    showToast({ type: "success", title: "Investment updated", message: `"${name}" has been updated successfully.` });
    return refreshedInvestment;
  };

  const handleDeleteInvestment = async (investmentId) => {
    await portfolioDataset.deleteInvestment(investmentId);
    setUnrealizedRows((prev) => prev.filter((row) => Number(row.id) !== Number(investmentId)));
    setRealizedRows((prev) => prev.filter((row) => Number(row.id) !== Number(investmentId)));
    setUnallocatedRows((prev) => prev.filter((row) => Number(row.id) !== Number(investmentId)));
    setSelectedInvestment(null);
    showToast({ type: "success", title: "Investment deleted", message: "The investment has been deleted." });
  };

  const handleOpenInvestmentDetails = async (row) => {
    if (!Number.isFinite(Number(row?.id))) {
      showToast({ type: "error", title: "Open failed", message: "Please save the investment before opening details." });
      return;
    }
    try {
      const freshInvestment = await portfolioDataset.fetchInvestment(row.id);
      setSelectedInvestment(normalizeRow(freshInvestment));
    } catch (err) {
      showToast({ type: "error", title: "Open failed", message: err.message || "Failed to load investment details." });
    }
  };

  const unrealizedSubtotal = useMemo(() => buildSummary(unrealizedRows), [unrealizedRows]);
  const realizedSubtotal = useMemo(() => buildSummary(realizedRows), [realizedRows]);
  const unallocatedSubtotal = useMemo(() => buildSummary(unallocatedRows), [unallocatedRows]);

  const totalRows = useMemo(() => {
    const map = new Map();
    [unrealizedRows, realizedRows, unallocatedRows].flat().forEach((r) => {
      if (r?.id && !map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [unrealizedRows, realizedRows, unallocatedRows]);

  const total = useMemo(() => buildSummary(totalRows), [totalRows]);

  const handleDownloadExcel = () => {
    const sectionHeaders = ["Name", "Geography", "Ownership", "Cost", "Dividends / Interests", "MOIC", "Gross IRR", "Fair Value", "Gain"];
    const buildSectionRows = (rows, subtotal) => [
      sectionHeaders,
      ...rows.map((r) => [
        r.name,
        r.country,
        `${format2(r.ownership)}%`,
        toNumber(r.cost),
        toNumber(calcDividendsTotal(r)),
        toNumber(calcMoicIncl(r)),
        toNumber(r.irr),
        toNumber(calcValue(r)),
        toNumber(calcGain(r)),
      ]),
      ["Sub Total", "", "", toNumber(subtotal.cost), toNumber(subtotal.dividends), toNumber(subtotal.moicIncl), toNumber(subtotal.irr), toNumber(subtotal.value), toNumber(subtotal.gain)],
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

  const columnOptions = useMemo(() => ([
    {
      key: "country",
      label: "Geography",
      width: "140px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label="Geography" columnKey="country" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => (
        <div className="geography-cell">
          {getFlagUrl(row.country) && (
            <img src={getFlagUrl(row.country)} alt={row.country} className="country-flag-img" width={20} height={15} />
          )}
          <span>{row.country}</span>
        </div>
      ),
      renderSubtotal: () => <td />,
      renderTotalHeader: () => <th />,
      renderTotalCell: () => <td />,
    },
    {
      key: "ownership",
      label: "Ownership",
      width: "120px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label="Ownership" columnKey="ownership" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => `${format2(row.ownership)}%`,
      renderSubtotal: () => <td />,
      renderTotalHeader: () => <th />,
      renderTotalCell: () => <td />,
    },
    {
      key: "cost",
      label: "Cost",
      width: "130px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label={<CurrencyLabel text="Cost" />} columnKey="cost" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => format2(row.cost),
      renderSubtotal: (subtotal) => <td>{format2(subtotal.cost)}</td>,
      renderTotalHeader: () => <th><CurrencyLabel text="Total Cost" /></th>,
      renderTotalCell: (summary) => <td>{format2(summary.cost)}</td>,
    },
    {
      key: "dividends",
      label: "Dividend/Interests",
      width: "190px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label={<CurrencyLabel text="Dividends / Interests" />} columnKey="dividends" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => format2(calcDividendsTotal(row)),
      renderSubtotal: (subtotal) => <td>{format2(subtotal.dividends)}</td>,
      renderTotalHeader: () => <th><CurrencyLabel text="Total Dividends / Interests" /></th>,
      renderTotalCell: (summary) => <td>{format2(summary.dividends)}</td>,
    },
    {
      key: "moic",
      label: "MOIC",
      width: "180px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label={<CurrencyLabel text="MOIC" />} columnKey="moicIncl" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => format2(calcMoicIncl(row)),
      renderSubtotal: (subtotal) => <td>{format2(subtotal.moicIncl)}</td>,
      renderTotalHeader: () => <th><CurrencyLabel text="Total MOIC" /></th>,
      renderTotalCell: (summary) => <td>{format2(summary.moicIncl)}</td>,
    },
    {
      key: "irr",
      label: "Gross IRR",
      width: "150px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label="Gross IRR" columnKey="irr" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => formatPercent(row.irr),
      renderSubtotal: (subtotal) => <td>{formatPercent(subtotal.irr)}</td>,
      renderTotalHeader: () => <th><CurrencyLabel text="Total Gross IRR" /></th>,
      renderTotalCell: (summary) => <td>{formatPercent(summary.irr)}</td>,
    },
    {
      key: "fairValue",
      label: "Fair Value",
      width: "160px",
      className: "col-highlight",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer label={<CurrencyLabel text="Fair Value" />} columnKey="fairValue" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => format2(calcValue(row)),
      renderSubtotal: (subtotal) => <td className="col-highlight">{format2(subtotal.value)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><CurrencyLabel text="Total Fair Value" /></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{format2(summary.value)}</td>,
    },
    {
      key: "gain",
      label: "Unrealized gain",
      width: "160px",
      className: "col-highlight",
      renderHeader: (sortKey, toggleSort, gainLabel) => (
        <SortableHeaderRenderer label={<CurrencyLabel text={gainLabel} />} columnKey="unrealizedGain" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
      ),
      renderCell: (row) => format2(calcGain(row)),
      renderSubtotal: (subtotal) => <td className="col-highlight">{format2(subtotal.gain)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><CurrencyLabel text="Total Gain" /></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{format2(summary.gain)}</td>,
    },
  ]), [calcDividendsTotal, calcGain, calcMoicIncl, calcValue, getFlagUrl]);

  const visibleColumns = useMemo(
    () => columnOptions.filter((column) => visibleColumnKeys.includes(column.key)),
    [columnOptions, visibleColumnKeys]
  );

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const renderColumnPicker = (menuKey) => (
    <div className="quarter-selector-container portfolio-columns-picker" ref={openColumnsMenu === menuKey ? columnsMenuRef : null}>
      <button
        type="button"
        className={`quarter-selector-button portfolio-columns-trigger${openColumnsMenu === menuKey ? " active" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpenColumnsMenu((prev) => (prev === menuKey ? null : menuKey));
        }}
        aria-label="Select visible columns"
        title="Select visible columns"
      >
        <FilterColumnsIcon />
      </button>
      {openColumnsMenu === menuKey && (
        <div className="quarter-dropdown portfolio-columns-menu" onClick={(event) => event.stopPropagation()}>
          <div className="quarter-list portfolio-columns-list">
          {columnOptions.map((column) => {
            const checked = visibleColumnKeys.includes(column.key);
            return (
              <label key={column.key} className={`quarter-item portfolio-columns-option${checked ? " selected checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleColumnVisibility(column.key)}
                />
                <div className={`qs-checkbox portfolio-columns-checkbox ${checked ? "checked" : ""}`} aria-hidden="true" />
                <div className="quarter-item-content">
                  <span className="item-label-bold portfolio-columns-label">{column.label}</span>
                </div>
              </label>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );

  const renderColGroup = () => (
    <colgroup>
      <col style={{ width: "220px" }} />
      {visibleColumns.map((column) => (
        <col key={column.key} style={{ width: column.width, minWidth: column.width }} />
      ))}
    </colgroup>
  );

  const renderTableBody = (rows) => (
    <>
      {rows.map((r) => (
        <tr key={r.id}>
          <td className="name-cell" onClick={() => handleOpenInvestmentDetails(r)}>
            <div className="name-main">{r.name}</div>
            <div className="name-sub">{r.sector}</div>
          </td>
          {visibleColumns.map((column) => (
            <td key={`${r.id}-${column.key}`} className={column.className || ""}>
              {column.renderCell(r)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const renderSubtotalRow = (subtotal) => (
    <tr className="portfolio-subtotal-row">
      <td className="subtotal-name-cell">Sub Total</td>
      {visibleColumns.map((column) => (
        <React.Fragment key={`subtotal-${column.key}`}>
          {column.renderSubtotal(subtotal)}
        </React.Fragment>
      ))}
    </tr>
  );

  const tableHeaders = (gainLabel, sortKey, toggleSort) => (
    <tr>
      <th><SortableHeaderRenderer label="Name" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} /></th>
      {visibleColumns.map((column) => (
        <th key={column.key} className={column.className || ""}>
          {column.renderHeader(sortKey, toggleSort, gainLabel)}
        </th>
      ))}
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
            {renderColumnPicker("unrealized")}
          </div>
          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              {renderColGroup()}
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
            {renderColumnPicker("realized")}
          </div>
          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              {renderColGroup()}
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
            {renderColumnPicker("unallocated")}
          </div>
          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              {renderColGroup()}
              <thead>{tableHeaders("Unallocated Gain", sortKeyA, toggleSortA)}</thead>
              <tbody>{renderTableBody(sortedUnallocated)}{renderSubtotalRow(unallocatedSubtotal)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="portfolio-total-section">
        <div className="portfolio-table-scroll">
          <table className="portfolio-table total-table">
            {renderColGroup()}
            <thead>
              <tr>
                <th></th>
                {visibleColumns.map((column) => (
                  <React.Fragment key={`total-header-${column.key}`}>
                    {column.renderTotalHeader()}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="portfolio-subtotal-row total-row">
                <td className="subtotal-name-cell">Total</td>
                {visibleColumns.map((column) => (
                  <React.Fragment key={`total-cell-${column.key}`}>
                    {column.renderTotalCell(total)}
                  </React.Fragment>
                ))}
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
          portfolioDataset={portfolioDataset}
          countries={countries}
          currencies={currencies}
          onClose={() => setSelectedInvestment(null)}
          onSaved={async () => { if (typeof portfolioDataset?.refresh === "function") await portfolioDataset.refresh(); }}
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
