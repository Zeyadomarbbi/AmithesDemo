import { xirr as xirrLib } from "@webcarrot/xirr";

/**
 * UTILS & FORMATTERS
 */
const toNumber = (value) =>
  Number(String(value ?? "").replace(/,/g, "").trim()) || 0;

const canonicalType = (type) => {
  const t = String(type || "").trim().toLowerCase();
  if (t === "dividends" || t === "dividend") return "Dividend";
  if (t === "interests" || t === "interest") return "Interest";
  if (t === "partial divestment") return "Partial divestment";
  if (t === "divestment") return "Divestment";
  if (t === "investment") return "Investment";
  return "Other";
};

const isOnOrBeforeCutoff = (dateValue, cutoffDate) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  if (!cutoffDate) return true;
  return date <= new Date(cutoffDate);
};

const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return 0;
    const hasPositive = cashflows.some((c) => c.amount > 0);
    const hasNegative = cashflows.some((c) => c.amount < 0);
    if (!hasPositive || !hasNegative) return 0;
    return xirrLib(cashflows);
  } catch (error) {
    console.error("XIRR calculation failed:", error);
    return 0;
  }
};

const flattenInvestmentsPayload = (payload) => {
  const hasGrouped = payload?.unrealized || payload?.realized || payload?.unallocated;
  if (hasGrouped) {
    return [
      ...(payload.unrealized || []),
      ...(payload.realized || []),
      ...(payload.unallocated || []),
    ];
  }
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

/**
 * DATA FETCHERS (Using API instance)
 */
const fetchInvestments = async (api, fundId, cutoffDate) => {
  const endpoint = cutoffDate
    ? `/api/funds/${fundId}/portfolio-investments/?date=${encodeURIComponent(cutoffDate)}`
    : `/api/funds/${fundId}/portfolio-investments/`;

  try {
    const payload = await api.get(endpoint);
    return flattenInvestmentsPayload(payload);
  } catch (err) {
    if (cutoffDate) {
      // Fallback to non-dated endpoint if dated fails
      const payload = await api.get(`/api/funds/${fundId}/portfolio-investments/`);
      return flattenInvestmentsPayload(payload);
    }
    throw err;
  }
};

const fetchInvestmentFlows = async (api, fundId, investmentId) => {
  try {
    const rows = await api.get(`/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};

const fetchInvestmentFairValues = async (api, fundId, investmentId) => {
  try {
    const rows = await api.get(`/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};

/**
 * METRICS CALCULATION
 */
const computeInvestmentMetrics = (flows, fairValues, cutoffDate) => {
  const scopedFlows = flows
    .filter((f) => f?.date)
    .filter((f) => isOnOrBeforeCutoff(f.date, cutoffDate));

  if (!scopedFlows.length) return null;

  let cost = 0;
  let proceeds = 0;
  const cashflows = [];

  scopedFlows.forEach((flow) => {
    const typeName = canonicalType(
      flow.transaction_name ??
        flow.transaction_type_name ??
        flow.transaction_type?.name ??
        flow.transaction_type ??
        flow.type ??
        ""
    );

    const amountLc = toNumber(flow.amount_lc ?? flow.amountLC ?? flow.amount);
    const fxRate = toNumber(flow.fx_rate ?? flow.fxRate);
    const amountEur = fxRate ? amountLc / fxRate : toNumber(flow.amount);

    if (typeName === "Investment") {
      cost += Math.abs(amountEur);
      cashflows.push({ date: new Date(flow.date), amount: -Math.abs(amountEur) });
    } else if (typeName === "Dividend" || typeName === "Interest") {
      proceeds += Math.abs(amountEur);
      cashflows.push({ date: new Date(flow.date), amount: Math.abs(amountEur) });
    } else if (["Divestment", "Partial divestment", "Other"].includes(typeName)) {
      proceeds += Math.abs(amountEur);
      cashflows.push({ date: new Date(flow.date), amount: Math.abs(amountEur) });
    }
  });

  const scopedFairValues = fairValues
    .filter((fv) => fv?.date)
    .filter((fv) => isOnOrBeforeCutoff(fv.date, cutoffDate))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const latestFairValue = scopedFairValues[scopedFairValues.length - 1] || null;

  const fairValueLc = latestFairValue ? toNumber(latestFairValue.amount_lc ?? latestFairValue.amountLC) : 0;
  const fairFx = latestFairValue ? toNumber(latestFairValue.fx_rate ?? latestFairValue.fxRate) : 0;
  const fairValue = latestFairValue ? toNumber(latestFairValue.amount ?? (fairFx ? fairValueLc / fairFx : 0)) : 0;

  if (fairValue) {
    cashflows.push({ date: new Date(cutoffDate || latestFairValue.date), amount: fairValue });
  }

  const grossIrr = safeXirr(
    cashflows
      .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date)
  );

  return { cost, proceeds, fairValue, grossIrr };
};

const buildPortfolioCashflows = (rowsWithMetrics = [], cutoffDate) => {
  const cutoff = cutoffDate ? new Date(cutoffDate) : null;
  const cashflows = [];

  rowsWithMetrics.forEach(({ flows = [], fairValues = [] }) => {
    flows
      .filter((flow) => flow?.date)
      .filter((flow) => isOnOrBeforeCutoff(flow.date, cutoffDate))
      .forEach((flow) => {
        const typeName = canonicalType(
          flow.transaction_name ??
            flow.transaction_type_name ??
            flow.transaction_type?.name ??
            flow.transaction_type ??
            flow.type ??
            ""
        );

        const amountLc = toNumber(flow.amount_lc ?? flow.amountLC ?? flow.amount);
        const fxRate = toNumber(flow.fx_rate ?? flow.fxRate);
        const amountEur = fxRate ? amountLc / fxRate : toNumber(flow.amount);
        const absoluteAmount = Math.abs(amountEur);

        if (!Number.isFinite(absoluteAmount) || absoluteAmount === 0) return;

        if (typeName === "Investment") {
          cashflows.push({ date: new Date(flow.date), amount: -absoluteAmount });
          return;
        }

        if (["Dividend", "Interest", "Other", "Divestment", "Partial divestment"].includes(typeName)) {
          cashflows.push({ date: new Date(flow.date), amount: absoluteAmount });
        }
      });

    const scopedFairValues = fairValues
      .filter((fv) => fv?.date)
      .filter((fv) => isOnOrBeforeCutoff(fv.date, cutoffDate))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const latestFairValue = scopedFairValues[scopedFairValues.length - 1] || null;
    if (!latestFairValue) return;

    const fairValueLc = toNumber(latestFairValue.amount_lc ?? latestFairValue.amountLC);
    const fairFx = toNumber(latestFairValue.fx_rate ?? latestFairValue.fxRate);
    const fairValue = toNumber(latestFairValue.amount ?? (fairFx ? fairValueLc / fairFx : 0));

    if (Number.isFinite(fairValue) && fairValue !== 0) {
      cashflows.push({ date: cutoff || new Date(latestFairValue.date), amount: fairValue });
    }
  });

  return cashflows
    .filter((c) => c?.date instanceof Date && !Number.isNaN(c.date.getTime()) && Number.isFinite(c.amount) && c.amount !== 0)
    .sort((a, b) => a.date - b.date);
};

/**
 * OUTPUT FORMATTERS
 */
const formatAmount = (value) =>
  toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMultiple = (value) => `${formatAmount(value)}x`;
const formatPercent = (value) => `${formatAmount(toNumber(value) * 100)}%`;

/**
 * MAIN EXPORT
 */
export const fetchPortfolioValueCreationKPIs = async (api, { fundId, cutoffDate }) => {
  const investments = await fetchInvestments(api, fundId, cutoffDate);

  const rowsWithIds = investments.filter((row) =>
    Number.isFinite(Number(row?.investment_id ?? row?.id))
  );

  const rowsWithMetrics = await Promise.all(
    rowsWithIds.map(async (row) => {
      const investmentId = Number(row.investment_id ?? row.id);
      const [flows, fairValues] = await Promise.all([
        fetchInvestmentFlows(api, fundId, investmentId),
        fetchInvestmentFairValues(api, fundId, investmentId),
      ]);
      return {
        investmentId,
        flows,
        fairValues,
        metrics: computeInvestmentMetrics(flows, fairValues, cutoffDate),
      };
    })
  );

  const validMetrics = rowsWithMetrics
    .map((row) => row.metrics)
    .filter(Boolean);

  const investmentCost = validMetrics.reduce((sum, item) => sum + item.cost, 0);
  const proceeds = validMetrics.reduce((sum, item) => sum + item.proceeds, 0);
  const fairMarketValue = validMetrics.reduce((sum, item) => sum + item.fairValue, 0);
  const dealsCount = validMetrics.length;
  const totalValue = proceeds + fairMarketValue;
  const grossMultiple = investmentCost ? totalValue / investmentCost : 0;
  const grossIrr = safeXirr(buildPortfolioCashflows(rowsWithMetrics, cutoffDate));

  return {
    raw: { investmentCost, proceeds, fairMarketValue, dealsCount, totalValue, grossMultiple, grossIrr },
    cardData: [
      { label: "Investment Cost", value: formatAmount(investmentCost) },
      { label: "Proceeds (C)", value: formatAmount(proceeds) },
      { label: "Portfolio Fair Market Value (D)", value: formatAmount(fairMarketValue) },
      { label: "# of deals", value: String(dealsCount) },
      { label: "Total Value (C+D)", value: formatAmount(totalValue) },
      { label: "Gross Multiple", value: formatMultiple(grossMultiple) },
      { label: "Gross IRR", value: formatPercent(grossIrr) },
    ],
    chartData: [
      { name: "Portfolio\nInvestment Cost", value: investmentCost, isHatched: true },
      { name: "Portfolio\nFair Market Value", value: fairMarketValue, isHatched: false },
    ],
  };
};

export const fetchPortfolioValueCreationKpiMap = async (api, fundIds = []) => {
  if (!Array.isArray(fundIds) || fundIds.length === 0) return {};

  const entries = await Promise.all(
    fundIds.map(async (fundId) => {
      try {
        const result = await fetchPortfolioValueCreationKPIs(api, { fundId, cutoffDate: null });
        return [
          String(fundId),
          {
            totalCost: result?.raw?.investmentCost ?? 0,
            deals: result?.raw?.dealsCount ?? 0,
            grossIrr: result?.raw?.grossIrr ?? null,
          },
        ];
      } catch (error) {
        console.error(`Portfolio KPI map failed for fund ${fundId}:`, error.message);
        return [String(fundId), { totalCost: 0, deals: 0, grossIrr: null }];
      }
    })
  );

  return Object.fromEntries(entries);
};
