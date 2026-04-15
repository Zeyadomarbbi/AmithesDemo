/**
 * PortfolioHelpers.js
 * Logic to classify investments into Realized, Unrealized, or Unallocated
 * buckets based on transaction history and a cutoff date, including LC calculations.
 */
import { xirr } from "@webcarrot/xirr";

const toNumber = (v) => Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

// Internal helper to handle XIRR edge cases for both Base and LC cashflows
export const calcIrrSafely = (flowsArray) => {
  let irr = null;
  try {
    if (flowsArray.length >= 1) {
      const hasPos = flowsArray.some(c => c.amount > 0);
      const hasNeg = flowsArray.some(c => c.amount < 0);
      
      if (hasNeg && !hasPos) {
        irr = -1; // Total loss scenario
      } else if (hasPos && hasNeg) {
        const sorted = [...flowsArray].sort((a, b) => a.date - b.date);
        try {
          irr = xirr(sorted);
        } catch (err) {
          try {
            irr = xirr(sorted, { guess: -0.5 });
          } catch (fallbackErr) {
            irr = null;
          }
        }
      }
    }
  } catch (e) {
    console.warn("IRR calculation failed:", e);
  }
  return irr;
};

/**
 * Classifies investments into portfolio buckets based on flows up to a specific date.
 */
export const classifyInvestmentsByTimeframe = (investments, timeframeDate) => {
  const cutoff = new Date(timeframeDate);
  const results = [];

  if (!Array.isArray(investments)) return [];

  investments.forEach((inv) => {
    const flows = Array.isArray(inv.transaction_flows) ? inv.transaction_flows : [];
    
    const effectiveFlows = flows.filter((f) => {
      const flowDate = new Date(f.date);
      return !f.is_deleted && flowDate <= cutoff;
    });

    const hasInvestment = effectiveFlows.some(f => String(f.transaction_name).toLowerCase() === "investment");

    if (effectiveFlows.length === 0 || !hasInvestment) {
      results.push({ investment: inv, status: "unallocated" });
      return;
    }

    let totalDivestmentPercent = 0;
    let hasFullDivestmentTrigger = false;

    effectiveFlows.forEach((f) => {
      const type = String(f.transaction_name || "").toLowerCase();
      if (type === "divestment") {
        hasFullDivestmentTrigger = true;
      } else if (type === "partial divestment") {
        totalDivestmentPercent += (toNumber(f.divestment_percentage) * 10);
      }
    });

    const isFullyRealized = hasFullDivestmentTrigger || totalDivestmentPercent >= 100;
    const isPartiallyRealized = totalDivestmentPercent > 0 && totalDivestmentPercent < 100;

    if (isFullyRealized) {
      results.push({ investment: inv, status: "realized" });
    } else if (isPartiallyRealized) {
      results.push({ investment: inv, status: "unrealized" });
      results.push({ investment: inv, status: "realized" });
    } else {
      results.push({ investment: inv, status: "unrealized" });
    }
  });

  return results;
};

/**
 * Calculates aggregate metrics (Subtotals/Totals) for a group of calculated rows.
 * Handles blended IRR by combining all individual pro-rata cashflows (Base & LC).
 */
export const calculateSubtotalMetrics = (rows) => {
  // Base Currency Aggregates
  const cost = rows.reduce((s, r) => s + r.cost, 0);
  const dividends = rows.reduce((s, r) => s + r.dividends, 0);
  const value = rows.reduce((s, r) => s + (r.status === "realized" ? r.exitValue : r.fairValue), 0);
  const gain = rows.reduce((s, r) => s + r.gain, 0);
  const moicIncl = cost > 0 ? (value + dividends) / cost : 0;
  const moicExcl = cost > 0 ? value / cost : 0;

  // Local Currency Aggregates
  const costLC = rows.reduce((s, r) => s + r.costLC, 0);
  const dividendsLC = rows.reduce((s, r) => s + r.dividendsLC, 0);
  const valueLC = rows.reduce((s, r) => s + (r.status === "realized" ? r.exitValueLC : r.fairValueLC), 0);
  const gainLC = rows.reduce((s, r) => s + r.gainLC, 0);
  const moicInclLC = costLC > 0 ? (valueLC + dividendsLC) / costLC : 0;
  const moicExclLC = costLC > 0 ? valueLC / costLC : 0;

  // Blended IRR Cashflows
  const combinedCashflows = [];
  const combinedCashflowsLC = [];
  
  rows.forEach(row => {
    if (Array.isArray(row.internalCashflows)) combinedCashflows.push(...row.internalCashflows);
    if (Array.isArray(row.internalCashflowsLC)) combinedCashflowsLC.push(...row.internalCashflowsLC);
  });

  return { 
    cost, dividends, value, gain, moicIncl, moicExcl, irr: calcIrrSafely(combinedCashflows),
    costLC, dividendsLC, valueLC, gainLC, moicInclLC, moicExclLC, irrLC: calcIrrSafely(combinedCashflowsLC)
  };
};

/**
 * Construct cashflows and calculate metrics (Base & LC) for a specific investment entry.
 */
export const calculatePortfolioMetrics = (classifiedData, timeframeDate) => {
  const cutoff = new Date(timeframeDate);

  return classifiedData.map(({ investment, status }) => {
    const flows = (investment.transaction_flows || []).filter(
      (f) => !f.is_deleted && new Date(f.date) <= cutoff
    );
    const fairValues = (investment.fair_value_flows || []).filter(
      (fv) => new Date(fv.date) <= cutoff
    );
    const investmentFlows = flows.filter(f => String(f.transaction_name).toLowerCase() === "investment");
    const firstInvestmentDate = investmentFlows.length > 0 
      ? investmentFlows.reduce((min, f) => new Date(f.date) < new Date(min) ? f.date : min, investmentFlows[0].date)
      : null;

    let totalDivestmentPercent = 0;
    flows.forEach((f) => {
      const type = String(f.transaction_name || "").toLowerCase();
      if (type === "divestment") totalDivestmentPercent = 100;
      if (type === "partial divestment") {
        totalDivestmentPercent += (toNumber(f.divestment_percentage) * 10);
      }
    });
    if (totalDivestmentPercent > 100) totalDivestmentPercent = 100;

    // --- Cost ---
    const absoluteTotalCost = flows
      .filter(f => String(f.transaction_name).toLowerCase() === "investment")
      .reduce((sum, f) => sum + toNumber(f.amount), 0);
      
    const absoluteTotalCostLC = flows
      .filter(f => String(f.transaction_name).toLowerCase() === "investment")
      .reduce((sum, f) => sum + toNumber(f.amount_lc ?? f.amountLC), 0);

    let effectiveCost = 0;
    let effectiveCostLC = 0;
    
    if (status === "realized") {
      effectiveCost = absoluteTotalCost * (totalDivestmentPercent / 100);
      effectiveCostLC = absoluteTotalCostLC * (totalDivestmentPercent / 100);
    } else if (status === "unrealized") {
      effectiveCost = absoluteTotalCost * (1 - (totalDivestmentPercent / 100));
      effectiveCostLC = absoluteTotalCostLC * (1 - (totalDivestmentPercent / 100));
    } else {
      effectiveCost = absoluteTotalCost;
      effectiveCostLC = absoluteTotalCostLC;
    }

    // --- Dividends ---
    const dividends = flows
      .filter(f => ["dividends", "interests", "dividend", "interest"].includes(String(f.transaction_name).toLowerCase()))
      .reduce((sum, f) => sum + toNumber(f.amount), 0);
      
    const dividendsLC = flows
      .filter(f => ["dividends", "interests", "dividend", "interest"].includes(String(f.transaction_name).toLowerCase()))
      .reduce((sum, f) => sum + toNumber(f.amount_lc ?? f.amountLC), 0);

    // --- Exit Value ---
    const exitValue = flows
      .filter(f => String(f.transaction_name).toLowerCase().includes("divestment"))
      .reduce((sum, f) => sum + toNumber(f.amount), 0);
      
    const exitValueLC = flows
      .filter(f => String(f.transaction_name).toLowerCase().includes("divestment"))
      .reduce((sum, f) => sum + toNumber(f.amount_lc ?? f.amountLC), 0);

    // --- Fair Value ---
    const latestFVObj = fairValues.length > 0 
      ? fairValues.reduce((prev, curr) => new Date(curr.date) > new Date(prev.date) ? curr : prev)
      : null;
    
    const fairValue = latestFVObj ? toNumber(latestFVObj.amount) : 0;
    const fairValueLC = latestFVObj ? toNumber(latestFVObj.amount_lc ?? latestFVObj.amountLC) : 0;

    // --- Cashflows for IRR (Base & LC) ---
    const cashflows = [];
    const cashflowsLC = [];
    
    flows.forEach(f => {
      const type = String(f.transaction_name).toLowerCase();
      const amount = toNumber(f.amount);
      const amountLC = toNumber(f.amount_lc ?? f.amountLC);
      
      if (type === "investment") {
        const proRataAmount = status === "realized" 
          ? amount * (totalDivestmentPercent / 100)
          : amount * (1 - (totalDivestmentPercent / 100));
          
        const proRataAmountLC = status === "realized" 
          ? amountLC * (totalDivestmentPercent / 100)
          : amountLC * (1 - (totalDivestmentPercent / 100));
          
        if (proRataAmount !== 0) cashflows.push({ date: new Date(f.date), amount: -proRataAmount });
        if (proRataAmountLC !== 0) cashflowsLC.push({ date: new Date(f.date), amount: -proRataAmountLC });
      } else {
        if (amount !== 0) cashflows.push({ date: new Date(f.date), amount: amount });
        if (amountLC !== 0) cashflowsLC.push({ date: new Date(f.date), amount: amountLC });
      }
    });

    if (status === "unrealized" && latestFVObj) {
      cashflows.push({ date: new Date(latestFVObj.date), amount: fairValue });
      cashflowsLC.push({ date: new Date(latestFVObj.date), amount: fairValueLC });
    }

    return {
      id: `${investment.investment_id}-${status}`,
      originalId: investment.investment_id,
      name: investment.name,
      firstInvestmentDate,
      sector: investment.sector,
      geography: investment.country_name,
      country: investment.country_name,
      status: status,
      
      // Base Currency
      cost: effectiveCost,
      dividends: dividends,
      fairValue: fairValue,
      exitValue: exitValue,
      moicIncl: effectiveCost > 0 ? ((status === "realized" ? exitValue : fairValue) + dividends) / effectiveCost : 0,
      moicExcl: effectiveCost > 0 ? (status === "realized" ? exitValue : fairValue) / effectiveCost : 0,
      irr: calcIrrSafely(cashflows),
      gain: ((status === "realized" ? exitValue : fairValue) + dividends) - effectiveCost,
      internalCashflows: cashflows,
      
      // Local Currency
      costLC: effectiveCostLC,
      dividendsLC: dividendsLC,
      fairValueLC: fairValueLC,
      exitValueLC: exitValueLC,
      moicInclLC: effectiveCostLC > 0 ? ((status === "realized" ? exitValueLC : fairValueLC) + dividendsLC) / effectiveCostLC : 0,
      moicExclLC: effectiveCostLC > 0 ? (status === "realized" ? exitValueLC : fairValueLC) / effectiveCostLC : 0,
      irrLC: calcIrrSafely(cashflowsLC),
      gainLC: ((status === "realized" ? exitValueLC : fairValueLC) + dividendsLC) - effectiveCostLC,
      internalCashflowsLC: cashflowsLC,

      ownership: toNumber(investment.ownership),
    };
  });
};