import { API_BASE_URL } from "../../../hooks/useApi";


export async function fetchFundPortfolioKpi(fundId, signal) {
  if (!fundId) {
    return { grossIrr: null, deals: 0, totalCost: 0 };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/funds/portfolio-kpis/bulk/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fund_ids: [fundId],
        }),
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();

    return (
      data?.[String(fundId)] ?? {
        grossIrr: null,
        deals: 0,
        totalCost: 0,
      }
    );
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.error(`Portfolio KPI: failed for fund ${fundId}`, error);

    return {
      grossIrr: null,
      deals: 0,
      totalCost: 0,
    };
  }
}

export async function fetchPortfolioKpisByFundIds(fundIds = [], signal) {
  if (!fundIds?.length) return {};

  const response = await fetch(
    `${API_BASE_URL}/api/funds/portfolio-kpis/bulk/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fund_ids: fundIds }),
      signal,
    }
  );

  if (!response.ok) return {};

  return response.json();
}