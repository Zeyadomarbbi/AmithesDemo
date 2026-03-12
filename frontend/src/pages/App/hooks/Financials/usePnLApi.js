import { useCallback } from "react";
import useApi from "../../../../hooks/api/useApi";

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

  const updateLineItem = async ({ lineItemId, name }) => {
    return await api.patch(`/api/pnl/${fundId}/line-item/${lineItemId}/`, {
      name: String(name || "").trim(),
    });
  };

  const deleteLineItem = async ({ lineItemId }) => {
    return await api.delete(`/api/pnl/${fundId}/line-item/${lineItemId}/`);
  };

  return { fetchPnL, upsertValue, createLineItem, updateLineItem, deleteLineItem };
}