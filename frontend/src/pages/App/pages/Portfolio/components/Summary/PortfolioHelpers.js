/**
 * PortfolioHelpers.js
 * * Logic to classify investments into Realized, Unrealized, or Unallocated
 * buckets based on transaction history and a cutoff date.
 */
import { xirr } from "@webcarrot/xirr";

const toNumber = (v) => Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

/**
 * Classifies investments into portfolio buckets based on flows up to a specific date.
 * * @param {Array} investments - Array of investment objects from the portfolio.
 * @param {String|Date} timeframeDate - The cutoff date for the calculation.
 * @returns {Array} List of objects: { investment: Object, status: 'unrealized' | 'realized' | 'unallocated' }
 */
export const classifyInvestmentsByTimeframe = (investments, timeframeDate) => {
  const cutoff = new Date(timeframeDate);
  const results = [];

  if (!Array.isArray(investments)) return [];

  investments.forEach((inv) => {
    const flows = Array.isArray(inv.transaction_flows) ? inv.transaction_flows : [];
    
    // 1. Filter flows by date and exclusion status
    const effectiveFlows = flows.filter((f) => {
      const flowDate = new Date(f.date);
      return !f.is_deleted && flowDate <= cutoff;
    });

    // 2. Determine base status
    if (effectiveFlows.length === 0) {
      // No activity before or on this date
      results.push({ investment: inv, status: "unallocated" });
      return;
    }

    let totalDivestmentPercent = 0;
    let hasFullDivestmentTrigger = false;

    effectiveFlows.forEach((f) => {
      const type = String(f.transaction_name || "").toLowerCase();
      
      // Check for explicit "Divestment" (Full) or "Partial divestment"
      if (type === "divestment") {
        hasFullDivestmentTrigger = true;
      } else if (type === "partial divestment") {
        // Backend stores percent. Assuming 1.0 = 10% based on your previous logic
        // Adjust if your DB stores 10.0 for 10%.
        totalDivestmentPercent += (toNumber(f.divestment_percentage) * 10);
      }
    });

    const isFullyRealized = hasFullDivestmentTrigger || totalDivestmentPercent >= 100;
    const isPartiallyRealized = totalDivestmentPercent > 0 && totalDivestmentPercent < 100;

    // 3. Classification logic
    if (isFullyRealized) {
      results.push({ investment: inv, status: "realized" });
    } else if (isPartiallyRealized) {
      // Partial divestments exist in both sections
      results.push({ investment: inv, status: "unrealized" });
      results.push({ investment: inv, status: "realized" });
    } else {
      // Investment exists but no divestment percentage recorded
      results.push({ investment: inv, status: "unrealized" });
    }
  });

  return results;
};

/**
 * Construct cashflows and calculate metrics for a specific investment entry.
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

    // 1. Calculate Total Divestment Percentage at this point in time
    let totalDivestmentPercent = 0;
    flows.forEach((f) => {
      const type = String(f.transaction_name || "").toLowerCase();
      if (type === "divestment") totalDivestmentPercent = 100;
      if (type === "partial divestment") {
        totalDivestmentPercent += (toNumber(f.divestment_percentage) * 10);
      }
    });
    if (totalDivestmentPercent > 100) totalDivestmentPercent = 100;

    // 2. Pro-Rata Cost Logic
    const absoluteTotalCost = flows
      .filter(f => String(f.transaction_name).toLowerCase() === "investment")
      .reduce((sum, f) => sum + toNumber(f.amount), 0);

    let effectiveCost = 0;
    if (status === "realized") {
      effectiveCost = absoluteTotalCost * (totalDivestmentPercent / 100);
    } else if (status === "unrealized") {
      effectiveCost = absoluteTotalCost * (1 - (totalDivestmentPercent / 100));
    } else {
      effectiveCost = absoluteTotalCost; // Unallocated case
    }

    // 3. Dividends and Values
    const dividends = flows
      .filter(f => ["dividends", "interests", "dividend", "interest"].includes(String(f.transaction_name).toLowerCase()))
      .reduce((sum, f) => sum + toNumber(f.amount), 0);

    const exitValue = flows
      .filter(f => String(f.transaction_name).toLowerCase().includes("divestment"))
      .reduce((sum, f) => sum + toNumber(f.amount), 0);

    const latestFVObj = fairValues.length > 0 
      ? fairValues.reduce((prev, curr) => new Date(curr.date) > new Date(prev.date) ? curr : prev)
      : null;
    
    const fairValue = latestFVObj ? toNumber(latestFVObj.amount) : 0;

    // 4. IRR Construction (Edge Case Handling)
    const cashflows = [];
    
    // Add transaction flows
    flows.forEach(f => {
      const type = String(f.transaction_name).toLowerCase();
      const amount = toNumber(f.amount);
      if (type === "investment") {
        // Pro-rate the investment outflows for the specific bucket
        const proRataAmount = status === "realized" 
          ? amount * (totalDivestmentPercent / 100)
          : amount * (1 - (totalDivestmentPercent / 100));
        cashflows.push({ date: new Date(f.date), amount: -proRataAmount });
      } else {
        cashflows.push({ date: new Date(f.date), amount: amount });
      }
    });

    // Append Fair Value as terminal flow for Unrealized status
    if (status === "unrealized" && latestFVObj) {
      cashflows.push({ date: new Date(latestFVObj.date), amount: fairValue });
    }

    let grossIrr = 0;
    try {
      if (cashflows.length >= 2) {
        const hasPos = cashflows.some(c => c.amount > 0);
        const hasNeg = cashflows.some(c => c.amount < 0);
        if (hasPos && hasNeg) {
          grossIrr = xirr(cashflows);
        }
      }
    } catch (e) {
      console.warn(`IRR Calc failed for ${investment.name}:`, e);
    }

    // 5. Final Mapping
    return {
      id: `${investment.investment_id}-${status}`, // Unique ID for table keys
      originalId: investment.investment_id,
      name: investment.name,
      sector: investment.sector,
      geography: investment.country_name,
      country: investment.country_name, // For flag utility
      status: status,
      cost: effectiveCost,
      dividends: dividends,
      fairValue: fairValue,
      exitValue: exitValue,
      moicIncl: effectiveCost > 0 ? ((status === "realized" ? exitValue : fairValue) + dividends) / effectiveCost : 0,
      moicExcl: effectiveCost > 0 ? (status === "realized" ? exitValue : fairValue) / effectiveCost : 0,
      irr: grossIrr,
      gain: ((status === "realized" ? exitValue : fairValue) + dividends) - effectiveCost,
      ownership: toNumber(investment.ownership)
    };
  });
};