import { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "/src/hooks/api/useApi";

const DEALFLOW_DASHBOARD_ENDPOINT = "/api/dealflow/dashboard/";

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function readDisplayText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if (typeof value.name === "string") return value.name;
    if (typeof value.label === "string") return value.label;
    if (typeof value.code === "string") return value.code;
  }
  return fallback;
}

function toFilterOptions(rows) {
  return toSafeArray(rows).map((row) => ({
    value: typeof row?.id === "object" ? readDisplayText(row?.id) : row?.id ?? "",
    label: readDisplayText(row?.name, ""),
    color: row?.color ?? "",
    code: readDisplayText(row?.code, ""),
  }));
}

function mapDonutData(rows) {
  return toSafeArray(rows).map((row) => ({
    id: row?.id ?? null,
    name: readDisplayText(row?.name, ""),
    value: Number(row?.value ?? 0),
    color: row?.color || "#375A89",
    totalTicketAmount: Number(row?.total_ticket_amount ?? 0),
  }));
}

function mapFunnelData(rows) {
  return toSafeArray(rows).map((row) => ({
    id: row?.id ?? null,
    stage: readDisplayText(row?.name, ""),
    value: Number(row?.value ?? 0),
    color: row?.color || "#375A89",
    totalTicketAmount: Number(row?.total_ticket_amount ?? 0),
    displayOrder: row?.stage_display_order ?? null,
  }));
}

function mapBarData(rows, fundSeries) {
  const seriesKeys = toSafeArray(fundSeries).map((series) => readDisplayText(series?.key, ""));
  return toSafeArray(rows).map((row) => {
    const normalized = {
      month: readDisplayText(row?.month, ""),
    };
    seriesKeys.forEach((key) => {
      normalized[key] = Number(row?.[key] ?? 0);
    });
    return normalized;
  });
}

function mapFundSeries(rows) {
  return toSafeArray(rows).map((row) => ({
    key: readDisplayText(row?.key, ""),
    name: readDisplayText(row?.name, ""),
    color: row?.color || "#375A89",
    total: Number(row?.total ?? 0),
  }));
}

export function useDashboardData({ status, stage, fund } = {}) {
  const api = useApi();
  const [data, setData] = useState({
    filtersData: {
      statuses: [],
      stages: [],
      funds: [],
    },
    summary: {
      totalDeals: 0,
      totalTicketAmount: 0,
      liveDeals: 0,
      investedDeals: 0,
      droppedDeals: 0,
      averageTicket: 0,
    },
    bySector: [],
    byCountry: [],
    byCurrency: [],
    byStage: [],
    byMonth: [],
    barTotals: {},
    fundSeries: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status_id", status);
      if (stage) params.set("stage_id", stage);
      if (fund) params.set("fund_id", fund);
      const query = params.toString() ? `?${params.toString()}` : "";
      const payload = await api.get(`${DEALFLOW_DASHBOARD_ENDPOINT}${query}`);
      setData({
        filtersData: payload?.filtersData || { statuses: [], stages: [], funds: [] },
        summary: payload?.summary || {
          totalDeals: 0,
          totalTicketAmount: 0,
          liveDeals: 0,
          investedDeals: 0,
          droppedDeals: 0,
          averageTicket: 0,
        },
        bySector: toSafeArray(payload?.bySector),
        byCountry: toSafeArray(payload?.byCountry),
        byCurrency: toSafeArray(payload?.byCurrency),
        byStage: toSafeArray(payload?.byStage),
        byMonth: toSafeArray(payload?.byMonth),
        barTotals: payload?.barTotals || {},
        fundSeries: toSafeArray(payload?.fundSeries),
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, status, stage, fund]);

  useEffect(() => {
    loadDashboard().catch(() => {});
  }, [loadDashboard]);

  return useMemo(
    () => ({
      statusOptions: toFilterOptions(data.filtersData.statuses),
      stageOptions: toFilterOptions(data.filtersData.stages),
      fundOptions: toFilterOptions(data.filtersData.funds),
      sectorData: mapDonutData(data.bySector),
      countryData: mapDonutData(data.byCountry),
      currencyData: mapDonutData(data.byCurrency),
      barData: mapBarData(data.byMonth, data.fundSeries),
      barTotals: data.barTotals || {},
      fundSeries: mapFundSeries(data.fundSeries),
      funnelData: mapFunnelData(data.byStage),
      summary: data.summary,
      isLoading,
      error,
      reload: loadDashboard,
    }),
    [data, isLoading, error, loadDashboard]
  );
}
