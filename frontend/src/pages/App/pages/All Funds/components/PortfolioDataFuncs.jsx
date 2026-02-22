import { xirr as xirrLib } from "@webcarrot/xirr";
import { API_BASE_URL } from "../../../hooks/useApi";

const toNumber = (value) =>
  Number(String(value ?? "").replace(/,/g, "").trim()) || 0;

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
  } catch (error) {
    console.error("AllFunds KPI: XIRR calculation failed", error);
    return null;
  }
};

const normalizeInvestmentRow = (row) => ({
  id: row.investment_id ?? row.id ?? row.investmentId ?? row.portfolio_investment_id,
});

const computeStatusFromFlows = (flows, date) => {
  try {
    if (!flows.length) return { status: "unallocated", include: true };

    const flowsWithDate = flows
      .filter((flow) => flow?.date)
      .filter((flow) => new Date(flow.date) <= new Date(date));

    if (!flowsWithDate.length) return { status: null, include: false };

    let totalExitPct = 0;
    let hasFullDivestment = false;

    flowsWithDate.forEach((flow) => {
      const typeName = String(
        flow.transaction_name ??
          flow.transaction_type_name ??
          flow.transaction_type?.name ??
          flow.transaction_type ??
          flow.type ??
          ""
      )
        .trim()
        .toLowerCase();

      const isPartial = typeName.includes("partial") && typeName.includes("divest");
      const isDivestment = typeName.includes("divest") && !typeName.includes("partial");

      if (isDivestment) {
        hasFullDivestment = true;
        totalExitPct = 100;
      } else if (isPartial) {
        totalExitPct += toNumber(flow.divestment_percentage);
      }
    });

    if (hasFullDivestment || totalExitPct >= 100) return { status: "realized", include: true };
    if (totalExitPct > 0) return { status: "partial", include: true };
    return { status: "unrealized", include: true };
  } catch (error) {
    console.error("AllFunds KPI: status calculation failed", error);
    return { status: "unrealized", include: true };
  }
};

const computeIrrFromFlows = (flows, fairValues, date) => {
  const cutoff = new Date(date);
  const flowsWithDate = flows
    .filter((flow) => flow?.date)
    .filter((flow) => new Date(flow.date) <= cutoff);

  const cashflows = [];

  flowsWithDate.forEach((flow) => {
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
    const amountEur = fxRate ? amountLc / fxRate : toNumber(flow.amount ?? 0);

    if (typeName === "Investment") {
      cashflows.push({ date: new Date(flow.date), amount: -Math.abs(amountEur) });
      return;
    }

    if (
      typeName === "Dividend" ||
      typeName === "Interest" ||
      typeName === "Divestment" ||
      typeName === "Partial divestment" ||
      typeName === "Other"
    ) {
      cashflows.push({ date: new Date(flow.date), amount: Math.abs(amountEur) });
    }
  });

  const fairRows = fairValues
    .filter((fv) => fv?.date)
    .filter((fv) => new Date(fv.date) <= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const latestFair = fairRows.length ? fairRows[fairRows.length - 1] : null;
  const fairAmountLc = latestFair ? toNumber(latestFair.amount_lc ?? latestFair.amountLC) : 0;
  const fairFx = latestFair ? toNumber(latestFair.fx_rate ?? latestFair.fxRate) : 0;
  const fairAmountEur = latestFair
    ? toNumber(latestFair.amount ?? (fairFx ? fairAmountLc / fairFx : 0))
    : 0;

  if (fairAmountEur) {
    cashflows.push({ date: new Date(date), amount: fairAmountEur });
  }

  return (
    safeXirr(
      cashflows
        .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
        .sort((a, b) => a.date - b.date)
    ) ?? 0
  );
};

const computeCostFromFlows = (flows, date) => {
  const cutoff = new Date(date);
  const flowsWithDate = flows
    .filter((flow) => flow?.date)
    .filter((flow) => new Date(flow.date) <= cutoff);

  return flowsWithDate.reduce((sum, flow) => {
    const typeName = canonicalType(
      flow.transaction_name ??
        flow.transaction_type_name ??
        flow.transaction_type?.name ??
        flow.transaction_type ??
        flow.type ??
        ""
    );

    if (typeName !== "Investment") return sum;

    const amountLc = toNumber(flow.amount_lc ?? flow.amountLC ?? flow.amount);
    const fxRate = toNumber(flow.fx_rate ?? flow.fxRate);
    const amountEur = fxRate ? amountLc / fxRate : toNumber(flow.amount ?? 0);
    return sum + Math.abs(amountEur);
  }, 0);
};

const fetchJsonOrNull = async (url) => {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
};

const getEffectiveTimeframeDate = async (fundId) => {
  const rows = await fetchJsonOrNull(`${API_BASE_URL}/api/funds/${fundId}/timeframes/`);
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Date().toISOString().split("T")[0];
  }

  const sorted = [...rows].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted[sorted.length - 1]?.date || new Date().toISOString().split("T")[0];
};

const fetchFundInvestmentsSnapshot = async (fundId, date) => {
  const withDateUrl =
    `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/` +
    `?date=${encodeURIComponent(date)}`;
  const fallbackUrl = `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`;

  let payload = await fetchJsonOrNull(withDateUrl);
  if (payload == null) {
    payload = await fetchJsonOrNull(fallbackUrl);
  }
  if (payload == null) return [];

  const hasGrouped = payload?.unrealized || payload?.realized || payload?.unallocated;
  const flattened = hasGrouped
    ? [
        ...(payload.unrealized || []),
        ...(payload.realized || []),
        ...(payload.unallocated || []),
      ]
    : Array.isArray(payload)
      ? payload
      : payload?.rows || [];

  return Array.isArray(flattened) ? flattened : [];
};

export async function fetchFundPortfolioKpi(fundId) {
  if (!fundId) {
    return { grossIrr: null, deals: 0, totalCost: 0 };
  }

  try {
    const effectiveDate = await getEffectiveTimeframeDate(fundId);
    const investments = await fetchFundInvestmentsSnapshot(fundId, effectiveDate);
    const rows = investments.map(normalizeInvestmentRow);

    const statusResults = await Promise.all(
      rows.map(async (row) => {
        if (!row?.id) {
          return { id: null, include: true, irr: 0 };
        }

        const [flowsPayload, fairValuesPayload] = await Promise.all([
          fetchJsonOrNull(
            `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${row.id}/flows/`
          ),
          fetchJsonOrNull(
            `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${row.id}/fair-values/`
          ),
        ]);

        const flows = Array.isArray(flowsPayload) ? flowsPayload : [];
        const fairValues = Array.isArray(fairValuesPayload) ? fairValuesPayload : [];
        const status = computeStatusFromFlows(flows, effectiveDate);
        const irr = computeIrrFromFlows(flows, fairValues, effectiveDate);
        const cost = computeCostFromFlows(flows, effectiveDate);

        return {
          id: row.id,
          include: status.include,
          irr,
          cost,
        };
      })
    );

    const uniqueIncluded = new Map();
    statusResults.forEach((result) => {
      if (!result?.include) return;
      if (!result.id) return;
      if (!uniqueIncluded.has(result.id)) {
        uniqueIncluded.set(result.id, result);
      }
    });

    const includedRows = Array.from(uniqueIncluded.values());
    const irrValues = includedRows
      .map((row) => toNumber(row.irr))
      .filter((irr) => Number.isFinite(irr) && irr !== 0);

    const grossIrr = irrValues.length
      ? irrValues.reduce((sum, irr) => sum + irr, 0) / irrValues.length
      : null;
    const totalCost = includedRows.reduce((sum, row) => sum + toNumber(row.cost), 0);

    return {
      grossIrr,
      deals: includedRows.length,
      totalCost,
    };
  } catch (error) {
    console.error(`AllFunds KPI: failed for fund ${fundId}`, error);
    return { grossIrr: null, deals: 0, totalCost: 0 };
  }
}

export async function fetchPortfolioKpisByFundIds(fundIds = []) {
  const ids = Array.from(
    new Set((Array.isArray(fundIds) ? fundIds : []).filter((id) => id !== undefined && id !== null))
  );

  const entries = await Promise.all(
    ids.map(async (id) => {
      const kpi = await fetchFundPortfolioKpi(id);
      return [String(id), kpi];
    })
  );

  return Object.fromEntries(entries);
}
