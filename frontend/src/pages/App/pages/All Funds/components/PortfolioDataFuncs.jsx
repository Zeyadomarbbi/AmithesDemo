/**
 * Standalone API services for Portfolio KPIs.
 * Note: These require the 'api' instance from useApi() to be passed in by the caller.
 */

import { fetchPortfolioValueCreationKpiMap } from "../../Dashboard/components/KPIDashboard/PortfolioKPIs/PortfolioCard/portfolioCardnChartCalculations";

export async function fetchFundPortfolioKpi(api, fundId) {
  if (!fundId) {
    return { grossIrr: null, deals: 0, totalCost: 0 };
  }

  try {
    const data = await fetchPortfolioValueCreationKpiMap(api, [fundId]);
    return data?.[String(fundId)] ?? {
      grossIrr: null,
      deals: 0,
      totalCost: 0,
    };
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error(`Portfolio KPI: failed for fund ${fundId}`, error.message);

    return {
      grossIrr: null,
      deals: 0,
      totalCost: 0,
    };
  }
}

export async function fetchPortfolioKpisByFundIds(api, fundIds = []) {
  if (!fundIds?.length) return {};

  try {
    return await fetchPortfolioValueCreationKpiMap(api, fundIds);
  } catch (error) {
    console.error("Bulk Portfolio KPI fetch failed:", error.message);
    return {};
  }
}
