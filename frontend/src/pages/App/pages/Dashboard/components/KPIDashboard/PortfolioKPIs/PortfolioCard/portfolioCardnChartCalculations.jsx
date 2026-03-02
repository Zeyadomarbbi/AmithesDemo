import { xirr as xirrLib } from "@webcarrot/xirr";
import { API_BASE_URL } from "../../../../../../../../hooks/api/apiConfig";

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
  const hasGrouped =
    payload?.unrealized || payload?.realized || payload?.unallocated;

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

const fetchInvestments = async (fundId, cutoffDate) => {
  const withDateUrl = cutoffDate
    ? `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/?date=${encodeURIComponent(
        cutoffDate
      )}`
    : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`;

  let response = await fetch(withDateUrl);

  if (!response.ok && cutoffDate) {
    response = await fetch(
      `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`
    );
  }

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio investments");
  }

  const payload = await response.json();
  return flattenInvestmentsPayload(payload);
};

const fetchInvestmentFlows = async (fundId, investmentId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`
  );
  if (!response.ok) return [];
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
};

const fetchInvestmentFairValues = async (fundId, investmentId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`
  );
  if (!response.ok) return [];
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
};

const computeInvestmentMetrics = (flows, fairValues, cutoffDate) => {
  const cutoff = new Date(cutoffDate);
  const scopedFlows = flows
    .filter((f) => f?.date)
    .filter((f) => new Date(f.date) <= cutoff);

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
      return;
    }

    if (typeName === "Dividend" || typeName === "Interest") {
      proceeds += Math.abs(amountEur);
      cashflows.push({ date: new Date(flow.date), amount: Math.abs(amountEur) });
      return;
    }

    if (typeName === "Divestment" || typeName === "Partial divestment" || typeName === "Other") {
      cashflows.push({ date: new Date(flow.date), amount: Math.abs(amountEur) });
    }
  });

  const scopedFairValues = fairValues
    .filter((fv) => fv?.date)
    .filter((fv) => new Date(fv.date) <= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const latestFairValue = scopedFairValues.length
    ? scopedFairValues[scopedFairValues.length - 1]
    : null;

  const fairValueLc = latestFairValue
    ? toNumber(latestFairValue.amount_lc ?? latestFairValue.amountLC)
    : 0;
  const fairFx = latestFairValue
    ? toNumber(latestFairValue.fx_rate ?? latestFairValue.fxRate)
    : 0;
  const fairValue = latestFairValue
    ? toNumber(latestFairValue.amount ?? (fairFx ? fairValueLc / fairFx : 0))
    : 0;

  if (fairValue) {
    cashflows.push({ date: new Date(cutoffDate), amount: fairValue });
  }

  const grossIrr = safeXirr(
    cashflows
      .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date)
  );

  return {
    cost,
    proceeds,
    fairValue,
    grossIrr,
  };
};

const formatAmount = (value) =>
  toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMultiple = (value) => `${formatAmount(value)}x`;
const formatPercent = (value) => `${formatAmount(toNumber(value) * 100)}%`;

export const fetchPortfolioValueCreationKPIs = async ({
  fundId,
  cutoffDate,
}) => {
  const investments = await fetchInvestments(fundId, cutoffDate);

  const rowsWithIds = investments.filter((row) =>
    Number.isFinite(Number(row?.investment_id ?? row?.id))
  );

  const metricsPerInvestment = await Promise.all(
    rowsWithIds.map(async (row) => {
      const investmentId = Number(row.investment_id ?? row.id);
      const [flows, fairValues] = await Promise.all([
        fetchInvestmentFlows(fundId, investmentId),
        fetchInvestmentFairValues(fundId, investmentId),
      ]);
      return computeInvestmentMetrics(flows, fairValues, cutoffDate);
    })
  );

  const validMetrics = metricsPerInvestment.filter(Boolean);

  const investmentCost = validMetrics.reduce((sum, item) => sum + toNumber(item.cost), 0);
  const proceeds = validMetrics.reduce((sum, item) => sum + toNumber(item.proceeds), 0);
  const fairMarketValue = validMetrics.reduce((sum, item) => sum + toNumber(item.fairValue), 0);
  const dealsCount = validMetrics.length;
  const totalValue = proceeds + fairMarketValue;
  const grossMultiple = investmentCost ? totalValue / investmentCost : 0;
  const grossIrr = validMetrics.reduce((sum, item) => sum + toNumber(item.grossIrr), 0);

  return {
    raw: {
      investmentCost,
      proceeds,
      fairMarketValue,
      dealsCount,
      totalValue,
      grossMultiple,
      grossIrr,
    },
    cardData: [
      { label: "Investment Cost", value: formatAmount(investmentCost) },
      { label: "Proceeds (C)", value: formatAmount(proceeds) },
      {
        label: "Portfolio Fair Market Value (D)",
        value: formatAmount(fairMarketValue),
      },
      { label: "# of deals", value: String(dealsCount) },
      { label: "Total Value (C+D)", value: formatAmount(totalValue) },
      { label: "Gross Multiple", value: formatMultiple(grossMultiple) },
      { label: "Gross IRR", value: formatPercent(grossIrr) },
    ],
    chartData: [
      {
        name: "Portfolio\nInvestment Cost",
        value: investmentCost,
        isHatched: true,
      },
      {
        name: "Portfolio\nFair Market Value",
        value: fairMarketValue,
        isHatched: false,
      },
    ],
  };
};
