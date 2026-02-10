import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { xirr as xirrLib } from "@webcarrot/xirr";

/* ===== Components ===== */
import QuarterSelector from "../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, saveNewTimeframe } from "../../../../hooks/Core/useTimeframes";
import NewInvestmentModal from "./components/NewInvestmentModal";
import InvestmentDetailsDrawer from "./components/InvestmentDetails/InvestmentDetailsDrawer";
import { API_BASE_URL } from "../../../../hooks/useApi";

/* ===== Styles ===== */
import "./PortfolioSummaryTab.css";
const SortIcon = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px', verticalAlign: 'middle' }}>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5286 0.195262C3.78894 -0.0650874 4.21106 -0.0650874 4.4714 0.195262L7.80474 3.5286C8.06509 3.78894 8.06509 4.21106 7.80474 4.4714C7.54439 4.73175 7.12228 4.73175 6.86193 4.4714L4 1.60948L1.13807 4.4714C0.877722 4.73175 0.455612 4.73175 0.195262 4.4714C-0.0650874 4.21106 -0.0650874 3.78894 0.195262 3.5286L3.5286 0.195262ZM0.195262 7.5286C0.455612 7.26825 0.877722 7.26825 1.13807 7.5286L4 10.3905L6.86193 7.5286C7.12228 7.26825 7.54439 7.26825 7.80474 7.5286C8.06509 7.78895 8.06509 8.21106 7.80474 8.47141L4.4714 11.8047C4.21106 12.0651 3.78894 12.0651 3.5286 11.8047L0.195262 8.47141C-0.0650874 8.21106 -0.0650874 7.78895 0.195262 7.5286Z" fill="#375A89"/>
  </svg>
);
/* ===== Icons ===== */
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DownloadIcon,
  iconStyle,
} from "../../icons";

/* ================= Utils ================= */
const toNumber = (v) =>
  Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

const format2 = (v) => {
  const n = toNumber(v);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  // DB column currently behaves like numeric(5,4) => max 9.9999
  // We keep UI as 1-100%, but persist scaled value to avoid overflow.
  const scaled = n / 10;
  return Number(Math.min(9.9999, scaled).toFixed(4));
};

const ownershipFromDbValue = (storedOwnership) => {
  const n = toNumber(storedOwnership);
  if (n <= 10) return Number((n * 10).toFixed(2));
  return Number(n.toFixed(2));
};
const canonicalType = (type) => {
  const t = String(type || "").trim().toLowerCase();
  if (t === "dividends" || t === "dividend") return "Dividend";
  if (t === "interests" || t === "interest") return "Interest";
  if (t === "partial divestment") return "Partial divestment";
  if (t === "divestment") return "Divestment";
  if (t === "investment") return "Investment";
  if (t === "other") return "Other";
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

/* ================= Component ================= */
const PortfolioSummaryTab = () => {
  const { fundId } = useOutletContext();
  const numericFundId = Number(fundId);
  const [toast, setToast] = useState(null);

  /* ===== Timeframes ===== */
  const { quarters = [], isLoading, setQuarters } = useTimeframes(numericFundId);
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  /* ===== Modals / Drawers ===== */
  const [isNewInvestmentOpen, setIsNewInvestmentOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const selectedQuarterObj = quarters.find(
    (q) => Number(q.id) === Number(selectedQuarter)
  );

  /* ===== Investments State ===== */
  const [unrealizedRows, setUnrealizedRows] = useState([]);
  const [realizedRows, setRealizedRows] = useState([]);
  const [unallocatedRows, setUnallocatedRows] = useState([]);

  const selectedTimeframeDate =
    selectedQuarterObj?.rawDate ||
    selectedQuarterObj?.date ||
    new Date().toISOString().split("T")[0];

  const effectiveTimeframe = selectedQuarterObj || {
    rawDate: selectedTimeframeDate,
    date: selectedTimeframeDate,
    display_label: "Today",
  };

  const normalizeStatus = (status) => {
    const s = String(status || "").trim().toLowerCase();
    if (!s) return null;
    if (s.includes("unallocated")) return "unallocated";
    if (s.includes("unrealized")) return "unrealized";
    if (s.includes("realized")) return "realized";
    if (s.includes("partial")) return "partial";
    return null;
  };

  const normalizeRow = (row) => ({
    id: row.investment_id ?? row.id ?? row.investmentId ?? row.portfolio_investment_id,
    name: row.name,
    sector: row.sector,
    country: row.country_name ?? row.country ?? row.countryName,
    ownership: ownershipFromDbValue(row.ownership),
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
    moic: row.moic ?? 0,
    moicLcIncl: row.moicLcIncl ?? row.moic_lc_incl ?? 0,
    moicExcl: row.moicExcl ?? row.moic_excl ?? 0,
    irr: row.irr ?? 0,
    fairValue: row.fair_value ?? row.fairValue ?? row.valuation ?? row.amount ?? 0,
    unrealizedGain: row.unrealized_gain ?? row.unrealizedGain ?? 0,
    exitValue: row.exit_value ?? row.exitValue ?? row.amount ?? 0,
    realized: row.realized ?? row.realized_gain ?? row.realizedGain ?? 0,
    status: row.status ?? row.investment_status ?? row.portfolio_status ?? null,
  });

  const fetchInvestmentFlows = useCallback(async (investmentId) => {
    const res = await fetch(
      `${API_BASE_URL}/api/funds/${numericFundId}/portfolio-investments/${investmentId}/flows/`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, [numericFundId]);

  const fetchInvestmentFairValues = useCallback(async (investmentId) => {
    const res = await fetch(
      `${API_BASE_URL}/api/funds/${numericFundId}/portfolio-investments/${investmentId}/fair-values/`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, [numericFundId]);

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
          f.transaction_name ??
            f.transaction_type_name ??
            f.transaction_type?.name ??
            f.transaction_type ??
            f.type ??
            ""
        )
          .trim()
          .toLowerCase();

        const isPartial = typeName.includes("partial") && typeName.includes("divest");
        const isDivestment =
          typeName.includes("divest") && !typeName.includes("partial");

        if (isDivestment) {
          hasFullDivestment = true;
          totalExitPct = 100;
        } else if (isPartial) {
          totalExitPct += toNumber(f.divestment_percentage);
        }
      });

      if (hasFullDivestment || totalExitPct >= 100)
        return { status: "realized", include: true };
      if (totalExitPct > 0) return { status: "partial", include: true };
      return { status: "unrealized", include: true };
    } catch (err) {
      console.error("Failed to compute status:", err);
      return { status: "unrealized", include: true };
    }
  }, []);

  const computeMetricsFromFlows = useCallback((flows, fairValues, date) => {
    const cutoff = new Date(date);
    const flowsWithDate = flows
      .filter((f) => f?.date)
      .filter((f) => new Date(f.date) <= cutoff);

    let costLc = 0;
    let costEur = 0;
    let dividendsLc = 0;
    let dividendsEur = 0;

    const cashflows = [];

    flowsWithDate.forEach((f) => {
      const typeName = canonicalType(
        f.transaction_name ??
          f.transaction_type_name ??
          f.transaction_type?.name ??
          f.transaction_type ??
          f.type ??
          ""
      );
      const amountLc = toNumber(f.amount_lc ?? f.amountLC ?? f.amount);
      const fxRate = toNumber(f.fx_rate ?? f.fxRate);
      const amountEur = fxRate ? amountLc / fxRate : toNumber(f.amount ?? 0);

      if (typeName === "Investment") {
        costLc += Math.abs(amountLc);
        costEur += Math.abs(amountEur);
        cashflows.push({ date: new Date(f.date), amount: -Math.abs(amountEur) });
      } else if (typeName === "Dividend" || typeName === "Interest") {
        dividendsLc += Math.abs(amountLc);
        dividendsEur += Math.abs(amountEur);
        cashflows.push({ date: new Date(f.date), amount: Math.abs(amountEur) });
      } else if (typeName === "Divestment" || typeName === "Partial divestment" || typeName === "Other") {
        cashflows.push({ date: new Date(f.date), amount: Math.abs(amountEur) });
      }
    });

    const fairRows = fairValues
      .filter((fv) => fv?.date)
      .filter((fv) => new Date(fv.date) <= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const latestFair = fairRows.length ? fairRows[fairRows.length - 1] : null;
    const fairAmountLc = latestFair
      ? toNumber(latestFair.amount_lc ?? latestFair.amountLC)
      : 0;
    const fairFx = latestFair ? toNumber(latestFair.fx_rate ?? latestFair.fxRate) : 0;
    const fairAmountEur = latestFair
      ? toNumber(latestFair.amount ?? (fairFx ? fairAmountLc / fairFx : 0))
      : 0;

    if (fairAmountEur) {
      cashflows.push({ date: new Date(date), amount: fairAmountEur });
    }

    const irr = safeXirr(
      cashflows
        .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
        .sort((a, b) => a.date - b.date)
    );

    const valueEur = fairAmountEur;
    const valueLc = fairAmountLc || (fairAmountEur && fairFx ? fairAmountEur * fairFx : 0);

    const gainEur = valueEur + dividendsEur - costEur;
    const moicExcl = costEur ? valueEur / costEur : 0;
    const moicLcIncl = costLc ? (valueLc + dividendsLc) / costLc : 0;

    return {
      cost: costEur,
      dividends: dividendsEur,
      fairValue: valueEur,
      unrealizedGain: gainEur,
      moicExcl,
      moicLcIncl,
      irr: irr ?? 0,
    };
  }, []);

  const loadSummaryData = useCallback(async () => {
    if (!numericFundId) return;
    try {
      const withDateUrl = selectedTimeframeDate
        ? `${API_BASE_URL}/api/funds/${numericFundId}/portfolio-investments/?date=${encodeURIComponent(
            selectedTimeframeDate
          )}`
        : `${API_BASE_URL}/api/funds/${numericFundId}/portfolio-investments/`;

      let res = await fetch(withDateUrl);
      if (!res.ok && selectedTimeframeDate) {
        res = await fetch(
          `${API_BASE_URL}/api/funds/${numericFundId}/portfolio-investments/`
        );
      }
      if (!res.ok) throw new Error("Failed to fetch investments");
      const payload = await res.json();

      const hasGrouped =
        payload?.unrealized || payload?.realized || payload?.unallocated;

      const flattened =
        hasGrouped
          ? [
              ...(payload.unrealized || []),
              ...(payload.realized || []),
              ...(payload.unallocated || []),
            ]
          : (Array.isArray(payload) ? payload : payload?.rows || []);

      const rows = flattened.map(normalizeRow);

      const statusResults = await Promise.all(
        rows.map(async (row) => {
          const [flows, fairValues] = await Promise.all([
            fetchInvestmentFlows(row.id),
            fetchInvestmentFairValues(row.id),
          ]);

          const statusComputed = computeStatusFromFlows(
            flows,
            selectedTimeframeDate
          );
          const metrics = computeMetricsFromFlows(
            flows,
            fairValues,
            selectedTimeframeDate
          );

          return {
            row: { ...row, ...metrics },
            status: statusComputed.status,
            include: statusComputed.include,
          };
        })
      );

      const nextUnrealized = [];
      const nextRealized = [];
      const nextUnallocated = [];

      statusResults.forEach(({ row, status, include }) => {
        if (!include) return;
        if (status === "unallocated") {
          nextUnallocated.push(row);
          return;
        }
        if (status === "realized") {
          nextRealized.push(row);
          return;
        }
        if (status === "partial") {
          nextUnrealized.push(row);
          nextRealized.push(row);
          return;
        }
        nextUnrealized.push(row);
      });

      setUnrealizedRows(nextUnrealized);
      setRealizedRows(nextRealized);
      setUnallocatedRows(nextUnallocated);
    } catch (err) {
      console.error("Failed to load portfolio summary:", err);
      setToast({ type: "error", message: "Failed to load portfolio summary." });
    }
  }, [
    numericFundId,
    selectedTimeframeDate,
    fetchInvestmentFlows,
    fetchInvestmentFairValues,
    computeStatusFromFlows,
    computeMetricsFromFlows,
  ]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  useEffect(() => {
    if (!numericFundId) return;
    loadSummaryData();
  }, [numericFundId, selectedQuarter, selectedTimeframeDate, loadSummaryData]);

  const calcValue = (row) =>
    toNumber(
      row.fairValue !== null && row.fairValue !== undefined
        ? row.fairValue
        : row.exitValue
    );

  const calcDividendsTotal = (row) =>
    toNumber(row.dividends) + toNumber(row.interests);

  const calcGain = (row) =>
    calcValue(row) + calcDividendsTotal(row) - toNumber(row.cost);

  const calcMoicExcl = (row) =>
    row.moicExcl !== undefined ? toNumber(row.moicExcl) : 0;

  const calcMoicLcIncl = (row) =>
    row.moicLcIncl !== undefined ? toNumber(row.moicLcIncl) : 0;

  const calcIrrAvg = (rows) => {
    const vals = rows
      .map((r) => toNumber(r.irr))
      .filter((n) => Number.isFinite(n) && n !== 0);
    if (!vals.length) return 0;
    return vals.reduce((s, n) => s + n, 0) / vals.length;
  };

  const buildSummary = (rows) => {
    const cost = rows.reduce((s, r) => s + toNumber(r.cost), 0);
    const dividends = rows.reduce((s, r) => s + calcDividendsTotal(r), 0);
    const value = rows.reduce((s, r) => s + calcValue(r), 0);
    const gain = rows.reduce((s, r) => s + calcGain(r), 0);
    const moicExcl = cost ? value / cost : 0;
    const moicLcIncl = cost ? (value + dividends) / cost : 0;
    const irr = calcIrrAvg(rows);
    return { cost, dividends, value, gain, moicExcl, moicLcIncl, irr };
  };

  /* ================= Add Investment ================= */
  const handleAddInvestment = async ({
    name,
    sector,
    countryId,
    countryName,
    currencyId,
    currencyCode,
    ownership,
  }) => {
    if (!name || !String(name).trim()) {
      setToast({ type: "error", message: "Please enter an investment name." });
      return;
    }

    const ownershipValue = Number(String(ownership).replace(/,/g, "").trim());
    if (!Number.isFinite(ownershipValue) || ownershipValue < 1 || ownershipValue > 100) {
      setToast({ type: "error", message: "Ownership must be between 1 and 100." });
      return;
    }

    const payload = {
      name,
      sector,
      ownership: ownershipToDbValue(ownershipValue),
      country_id: Number(countryId),
      currency_id: Number(currencyId),
    };

    let created = null;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/funds/${numericFundId}/portfolio-investments/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        if (msg && msg.toLowerCase().includes("duplicate")) {
          setToast({
            type: "error",
            message: "Investment name already exists for this fund. Please choose another name.",
          });
        } else {
          setToast({ type: "error", message: "Failed to create investment. Please check your input." });
        }
        return;
      }
      created = await res.json();
    } catch (err) {
      console.error("Create investment failed:", err);
      setToast({ type: "error", message: "Failed to create investment. Please try again." });
      return;
    }

    if (!created?.investment_id || !Number.isFinite(Number(created.investment_id))) {
      setToast({ type: "error", message: "Investment was not saved correctly. Please try again." });
      return;
    }

    await loadSummaryData();
  };

  const handleSaveNewTimeframe = async (timeframe) => {
    try {
      const saved = await saveNewTimeframe(numericFundId, timeframe);
      setQuarters((prev) => [...prev, saved]);
      setSelectedQuarter(Number(saved.id));
    } catch (err) {
      console.error("Failed to save timeframe:", err);
      setToast({ type: "error", message: "Failed to save timeframe. Please try again." });
    }
  };

  const handleQuarterChange = (id) => {
    setSelectedQuarter(Number(id));
  };

  /* ================= Sub Totals ================= */
  const unrealizedSubtotal = useMemo(
    () => buildSummary(unrealizedRows),
    [unrealizedRows]
  );

  const realizedSubtotal = useMemo(
    () => buildSummary(realizedRows),
    [realizedRows]
  );

  const unallocatedSubtotal = useMemo(
    () => buildSummary(unallocatedRows),
    [unallocatedRows]
  );

  /* ================= TOTAL ================= */
  const totalRows = useMemo(() => {
    const map = new Map();
    [unrealizedRows, realizedRows, unallocatedRows].flat().forEach((r) => {
      if (r?.id && !map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [unrealizedRows, realizedRows, unallocatedRows]);

  const total = useMemo(
    () => buildSummary(totalRows),
    [totalRows]
  );

  /* ================= Render ================= */
  return (
    <>
      {/* ===== Toolbar ===== */}
      <div className="portfolio-toolbar">
        <div className="toolbar-left">
          <QuarterSelector
            options={quarters}
            selected={selectedQuarter}
            onChange={handleQuarterChange}
            onSaveNew={handleSaveNewTimeframe}
            isLoading={isLoading}
            isSingle
            allowAddNew={false}
          />
          {!selectedQuarter && (
            <div className="portfolio-filter-indicator">
              Filtering up to today
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <button className="ghost-btn">
            <DownloadIcon />
            <span>Download</span>
          </button>

          <button
            className="primary-btn"
            onClick={() => setIsNewInvestmentOpen(true)}
          >
            + New investment
          </button>
        </div>
      </div>

      {/* ===== Unrealized ===== */}
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2>
              Unrealized portfolio
              <span className="portfolio-count">{unrealizedRows.length}</span>
            </h2>
            <div className="portfolio-table-tools">
              <button className="icon-circle-btn search-btn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd"
                      d="M5.33333 1.33333C3.12419 1.33333 1.33333 3.12419 1.33333 5.33333C1.33333 7.54247 3.12419 9.33333 5.33333 9.33333C7.54247 9.33333 9.33333 7.54247 9.33333 5.33333C9.33333 3.12419 7.54247 1.33333 5.33333 1.33333ZM0 5.33333C0 2.38781 2.38781 0 5.33333 0C8.27885 0 10.6667 2.38781 10.6667 5.33333C10.6667 6.56579 10.2486 7.70061 9.5466 8.60373L13.1381 12.1953C13.3984 12.4556 13.3984 12.8777 13.1381 13.1381C12.8777 13.3984 12.4556 13.3984 12.1953 13.1381L8.60379 9.54655C7.70067 10.2486 6.56582 10.6667 5.33333 10.6667C2.38781 10.6667 0 8.27885 0 5.33333Z"
                      fill="#375A89"/>
                  </svg>
                </button>

              <button className="icon-circle-btn filter-btn">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 9C2 4.58172 5.58172 1 10 1H26C30.4183 1 34 4.58172 34 9V25C34 29.4183 30.4183 33 26 33H10C5.58172 33 2 29.4183 2 25V9Z" fill="white"/>
                      <path d="M10 1.5H26C30.1421 1.5 33.5 4.85786 33.5 9V25C33.5 29.1421 30.1421 32.5 26 32.5H10C5.85786 32.5 2.5 29.1421 2.5 25V9C2.5 4.85786 5.85786 1.5 10 1.5Z"
                        stroke="#CCCDCE" strokeOpacity="0.5"/>
                      <path d="M11.334 13H24.667M13.334 17H22.667M15.334 21H20.667"
                        stroke="#375A89" strokeWidth="1.333" strokeLinecap="round"/>
                    </svg>
                  </button>
            </div>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Cost <SortIcon /></th>
                  <th>Dividends / Interests <SortIcon /></th>
                  <th>MOIC LC (incl. dividends) <SortIcon /></th>
                  <th>MOIC € (excl. dividends) <SortIcon /></th>
                  <th>Gross IRR € <SortIcon /></th>
                  <th className="col-highlight">Fair Value <SortIcon /></th>
                  <th className="col-highlight">Unrealized Gain <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {unrealizedRows.map((r) => (
                  <tr key={r.id}>
                    <td
                      className="name-cell"
                      onClick={() => {
                        if (!Number.isFinite(Number(r.id))) {
                          setToast({
                            type: "error",
                            message: "Please save the investment before opening details.",
                          });
                          return;
                        }
                        setSelectedInvestment(r);
                      }}
                    >
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
                    </td>
                    <td>{r.country}</td>
                    <td>{format2(r.cost)}</td>
                    <td>{format2(calcDividendsTotal(r))}</td>
                    <td>{format2(calcMoicLcIncl(r))}</td>
                    <td>{format2(calcMoicExcl(r))}</td>
                    <td>{formatPercent(r.irr)}</td>
                    <td className="col-highlight">{format2(calcValue(r))}</td>
                    <td className="col-highlight">{format2(calcGain(r))}</td>
                  </tr>
                ))}

                <tr className="portfolio-subtotal-row">
                  <td className="subtotal-name-cell">Sub Total</td>
                  <td />
                  <td>{format2(unrealizedSubtotal.cost)}</td>
                  <td>{format2(unrealizedSubtotal.dividends)}</td>
                  <td>{format2(unrealizedSubtotal.moicLcIncl)}</td>
                  <td>{format2(unrealizedSubtotal.moicExcl)}</td>
                  <td>{formatPercent(unrealizedSubtotal.irr)}</td>
                  <td className="col-highlight">
                    {format2(unrealizedSubtotal.value)}
                  </td>
                  <td className="col-highlight">
                    {format2(unrealizedSubtotal.gain)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Realized ===== */}
      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2>
              Realized portfolio
              <span className="portfolio-count">{realizedRows.length}</span>
            </h2>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Cost <SortIcon /></th>
                  <th>Dividends / Interests <SortIcon /></th>
                  <th>MOIC LC (incl. dividends) <SortIcon /></th>
                  <th>MOIC € (excl. dividends) <SortIcon /></th>
                  <th>Gross IRR € <SortIcon /></th>
                  <th className="col-highlight">Fair Value <SortIcon /></th>
                  <th className="col-highlight">Realized Gain <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {realizedRows.map((r) => (
                  <tr key={r.id}>
                    <td
                      className="name-cell"
                      onClick={() => {
                        if (!Number.isFinite(Number(r.id))) {
                          setToast({
                            type: "error",
                            message: "Please save the investment before opening details.",
                          });
                          return;
                        }
                        setSelectedInvestment(r);
                      }}
                    >
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
                    </td>
                    <td>{r.country}</td>
                    <td>{format2(r.cost)}</td>
                    <td>{format2(calcDividendsTotal(r))}</td>
                    <td>{format2(calcMoicLcIncl(r))}</td>
                    <td>{format2(calcMoicExcl(r))}</td>
                    <td>{formatPercent(r.irr)}</td>
                    <td className="col-highlight">{format2(calcValue(r))}</td>
                    <td className="col-highlight">{format2(calcGain(r))}</td>
                  </tr>
                ))}

                <tr className="portfolio-subtotal-row">
                  <td className="subtotal-name-cell">Sub Total</td>
                  <td />
                  <td>{format2(realizedSubtotal.cost)}</td>
                  <td>{format2(realizedSubtotal.dividends)}</td>
                  <td>{format2(realizedSubtotal.moicLcIncl)}</td>
                  <td>{format2(realizedSubtotal.moicExcl)}</td>
                  <td>{formatPercent(realizedSubtotal.irr)}</td>
                  <td className="col-highlight">
                    {format2(realizedSubtotal.value)}
                  </td>
                  <td className="col-highlight">
                    {format2(realizedSubtotal.gain)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="portfolio-section">
        <div className="portfolio-table-card">
          <div className="portfolio-section-header">
            <h2>
              Unallocated portfolio
              <span className="portfolio-count">{unallocatedRows.length}</span>
            </h2>
          </div>

          <div className="portfolio-table-scroll">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Cost <SortIcon /></th>
                  <th>Dividends / Interests <SortIcon /></th>
                  <th>MOIC LC (incl. dividends) <SortIcon /></th>
                  <th>MOIC € (excl. dividends) <SortIcon /></th>
                  <th>Gross IRR € <SortIcon /></th>
                  <th className="col-highlight">Fair Value <SortIcon /></th>
                  <th className="col-highlight">Unallocated Gain <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {unallocatedRows.map((r) => (
                  <tr key={r.id}>
                    <td
                      className="name-cell"
                      onClick={() => {
                        if (!Number.isFinite(Number(r.id))) {
                          setToast({
                            type: "error",
                            message: "Please save the investment before opening details.",
                          });
                          return;
                        }
                        setSelectedInvestment(r);
                      }}
                    >
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
                    </td>
                    <td>{r.country}</td>
                    <td>{format2(r.cost)}</td>
                    <td>{format2(calcDividendsTotal(r))}</td>
                    <td>{format2(calcMoicLcIncl(r))}</td>
                    <td>{format2(calcMoicExcl(r))}</td>
                    <td>{formatPercent(r.irr)}</td>
                    <td className="col-highlight">{format2(calcValue(r))}</td>
                    <td className="col-highlight">{format2(calcGain(r))}</td>
                  </tr>
                ))}

                <tr className="portfolio-subtotal-row">
                  <td className="subtotal-name-cell">Sub Total</td>
                  <td />
                  <td>{format2(unallocatedSubtotal.cost)}</td>
                  <td>{format2(unallocatedSubtotal.dividends)}</td>
                  <td>{format2(unallocatedSubtotal.moicLcIncl)}</td>
                  <td>{format2(unallocatedSubtotal.moicExcl)}</td>
                  <td>{formatPercent(unallocatedSubtotal.irr)}</td>
                  <td className="col-highlight">{format2(unallocatedSubtotal.value)}</td>
                  <td className="col-highlight">{format2(unallocatedSubtotal.gain)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {/* ===== TOTAL ===== */}
      <section className="portfolio-section">
        <div className="portfolio-table-scroll">
          <table className="portfolio-table">
              <thead className="is-hidden">
                <tr>
                  <th>Name <SortIcon /></th>
                  <th>Geography <SortIcon /></th>
                  <th>Cost <SortIcon /></th>
                  <th>Dividends / Interests <SortIcon /></th>
                  <th>MOIC LC (incl. dividends) <SortIcon /></th>
                  <th>MOIC € (excl. dividends) <SortIcon /></th>
                  <th>Gross IRR € <SortIcon /></th>
                  <th className="col-highlight">Fair Value <SortIcon /></th>
                  <th className="col-highlight">Unallocated Gain <SortIcon /></th>
                </tr>
              </thead>
            <tbody>
              <tr className="portfolio-subtotal-row">
                <td className="subtotal-name-cell">Total</td>
                <td />
                
                <td>{format2(total.cost)}</td>
                <td>{format2(total.dividends)}</td>
                <td>{format2(total.moicLcIncl)}</td>
                <td>{format2(total.moicExcl)}</td>
                <td>{formatPercent(total.irr)}</td>
                <td className="col-highlight">{format2(total.value)}</td>
                <td className="col-highlight">{format2(total.gain)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Modals / Drawers ===== */}
      {isNewInvestmentOpen && (
        <NewInvestmentModal
          onClose={() => setIsNewInvestmentOpen(false)}
          onSave={handleAddInvestment}
        />
      )}

      {selectedInvestment && (
        <InvestmentDetailsDrawer
          investment={selectedInvestment}
          timeframe={effectiveTimeframe}
          fundId={numericFundId}
          onClose={() => setSelectedInvestment(null)}
          onSaved={loadSummaryData}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default PortfolioSummaryTab;
