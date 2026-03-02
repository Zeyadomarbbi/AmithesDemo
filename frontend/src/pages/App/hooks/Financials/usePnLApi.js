import { useCallback } from "react";
import useApi from "../api/useApi"; // Adjust relative path as needed

export function usePnLApi(fundId) {
  const api = useApi();

  const fetchPnL = useCallback(async (timeframeIds = []) => {
    const qs = timeframeIds.length > 0 ? `?timeframe_ids=${timeframeIds.join(",")}` : "";
    return await api.get(`/api/pnl/${fundId}/${qs}`);
  }, [fundId, api]);

  const upsertValue = async ({ lineItemId, timeframeId, amount }) => {
    return await api.post(`/api/pnl/${fundId}/value/`, {
      lineItemId: Number(lineItemId),
      timeframeId: Number(timeframeId),
      amount: amount === "" || amount == null ? 0 : Number(amount),
    });
  };

  const createLineItem = async ({ category, name }) => {
    return await api.post(`/api/pnl/${fundId}/line-item/`, {
      category: String(category || "").toLowerCase(),
      name: String(name || "").trim(),
    });
  };

  return { fetchPnL, upsertValue, createLineItem };
}