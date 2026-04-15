/**
 * PortfolioHelpers.js
 * Logic to classify investments into Realized, Unrealized, or Unallocated
 * buckets based on transaction history and a cutoff date.
 */
import { xirr } from "@webcarrot/xirr";

const toNumber = (v) => Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

/**
 * Classifies investments into portfolio buckets based on flows up to a specific date.
 * @param {Array} investments - Array of investment objects from the portfolio.
 * @param {String|Date} timeframeDate - The cutoff date for the calculation.
 * @returns {Array} List of objects: { investment: Object, status: 'unrealized' | 'realized' | 'unallocated' }
 */
export const classifyInvestmentsByTimeframe = (investments, timeframeDate) => {
  const cutoff = new Date(timeframeDate);
  const results = [];

  if (!Array.isArray(investments)) return [];

  investments.forEach((inv) => {
    const flows = Array.isArray(inv.transaction_flows) ? inv.transaction_flows : [];
    const hasInvestment = flows.some(f => String(f.transaction_name).toLowerCase() === "investment");
    if (!hasInvestment) {
      results.push({ investment: inv, status: "unallocated" });
      return;
    }
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
 * Calculates aggregate metrics (Subtotals/Totals) for a group of calculated rows.
 * Handles blended IRR by combining all individual pro-rata cashflows.
 */
export const calculateSubtotalMetrics = (rows) => {
  const cost = rows.reduce((s, r) => s + r.cost, 0);
  const dividends = rows.reduce((s, r) => s + r.dividends, 0);
  const value = rows.reduce((s, r) => s + (r.status === "realized" ? r.exitValue : r.fairValue), 0);
  const gain = rows.reduce((s, r) => s + r.gain, 0);
  
  // Correct MOIC: (Value + Dividends) / Cost
  const moicIncl = cost > 0 ? (value + dividends) / cost : 0;
  const moicExcl = cost > 0 ? value / cost : 0;

  // Blended IRR Calculation
  const combinedCashflows = [];
  rows.forEach(row => {
    if (Array.isArray(row.internalCashflows)) {
      combinedCashflows.push(...row.internalCashflows);
    }
  });

  let blendedIrr = null; // Default to null, not 0
  
  try {
    if (combinedCashflows.length >= 1) {
      const hasPos = combinedCashflows.some(c => c.amount > 0);
      const hasNeg = combinedCashflows.some(c => c.amount < 0);
      
      if (hasNeg && !hasPos) {
        // Total loss scenario (money went out, nothing came back)
        blendedIrr = -1; 
      } else if (hasPos && hasNeg) {
        // Sort chronologically for XIRR
        const sorted = [...combinedCashflows].sort((a, b) => a.date - b.date);
        try {
          blendedIrr = xirr(sorted);
        } catch (err) {
          // If standard XIRR fails (often happens with deeply negative returns), try a negative guess
          try {
            blendedIrr = xirr(sorted, { guess: -0.5 });
          } catch (fallbackErr) {
            console.warn("Blended IRR calculation failed to converge:", fallbackErr);
            blendedIrr = null;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Blended IRR data construction failed:", e);
  }

  return { cost, dividends, value, gain, moicIncl, moicExcl, irr: blendedIrr };
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

    const absoluteTotalCost = flows
      .filter(f => String(f.transaction_name).toLowerCase() === "investment")
      .reduce((sum, f) => sum + toNumber(f.amount), 0);

    let effectiveCost = 0;
    if (status === "realized") {
      effectiveCost = absoluteTotalCost * (totalDivestmentPercent / 100);
    } else if (status === "unrealized") {
      effectiveCost = absoluteTotalCost * (1 - (totalDivestmentPercent / 100));
    } else {
      effectiveCost = absoluteTotalCost;
    }

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

    // --- Cashflows for IRR ---
    const cashflows = [];
    flows.forEach(f => {
      const type = String(f.transaction_name).toLowerCase();
      const amount = toNumber(f.amount);
      if (type === "investment") {
        const proRataAmount = status === "realized" 
          ? amount * (totalDivestmentPercent / 100)
          : amount * (1 - (totalDivestmentPercent / 100));
        if (proRataAmount !== 0) cashflows.push({ date: new Date(f.date), amount: -proRataAmount });
      } else {
        // Dividends/Exit values are positive
        if (amount !== 0) cashflows.push({ date: new Date(f.date), amount: amount });
      }
    });

    if (status === "unrealized" && latestFVObj) {
      cashflows.push({ 
        date: new Date(latestFVObj.date), 
        amount: fairValue // Push the 0.00 here
      });
    }

    let grossIrr = null; // Default to null
    try {
      if (cashflows.length >= 1) {
        const hasPos = cashflows.some(c => c.amount > 0);
        const hasNeg = cashflows.some(c => c.amount < 0);
        
        if (hasNeg && !hasPos) {
          // Total loss scenario
          grossIrr = -1;
        } else if (hasPos && hasNeg) {
          // Sort chronologically for XIRR
          const sortedCashflows = [...cashflows].sort((a, b) => a.date - b.date);
          try {
            grossIrr = xirr(sortedCashflows);
          } catch (err) {
             // Fallback for deeply negative IRRs
            try {
              grossIrr = xirr(sortedCashflows, { guess: -0.5 });
            } catch (fallbackErr) {
              grossIrr = null;
            }
          }
        }
      }
    } catch (e) { 
      console.warn(`IRR Calc failed for ${investment.name}:`, e); 
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
      cost: effectiveCost,
      dividends: dividends,
      fairValue: fairValue,
      exitValue: exitValue,
      moicIncl: effectiveCost > 0 ? ((status === "realized" ? exitValue : fairValue) + dividends) / effectiveCost : 0,
      moicExcl: effectiveCost > 0 ? (status === "realized" ? exitValue : fairValue) / effectiveCost : 0,
      irr: grossIrr,
      gain: ((status === "realized" ? exitValue : fairValue) + dividends) - effectiveCost,
      ownership: toNumber(investment.ownership),
      internalCashflows: cashflows // Stored for subtotal/total blended IRR
    };
  });
};