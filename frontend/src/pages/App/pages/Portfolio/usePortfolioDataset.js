import { useCallback, useEffect, useRef, useState } from "react";
import useApi from "../../../../hooks/api/useApi";

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

export const usePortfolioDataset = (fundId) => {
  const api = useApi();
  const [dataset, setDataset] = useState({
    investments: [],
    flowsByInvestment: {},
    fairValuesByInvestment: {},
    isLoading: false,
    error: null,
    loadedAt: null,
  });

  const cacheRef = useRef(new Map());

  const load = useCallback(async (forceRefresh = false) => {
    const normalizedFundId = Number(fundId);

    if (!Number.isFinite(normalizedFundId)) {
      setDataset({
        investments: [],
        flowsByInvestment: {},
        fairValuesByInvestment: {},
        isLoading: false,
        error: null,
        loadedAt: null,
      });
      return;
    }

    const cached = cacheRef.current.get(normalizedFundId);
    if (cached && !forceRefresh) {
      setDataset({ ...cached, isLoading: false, error: null });
      return;
    }

    setDataset((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const investmentsPayload = await api.get(`/api/funds/${normalizedFundId}/portfolio-investments/`);
      const investments = toSafeArray(investmentsPayload).map((investment) => ({
        ...investment,
        transaction_flows: toSafeArray(investment.transaction_flows),
        fair_value_flows: toSafeArray(investment.fair_value_flows),
      }));

      const flowsByInvestment = {};
      const fairValuesByInvestment = {};

      investments.forEach((investment) => {
        const investmentId = Number(
          investment?.investment_id ?? investment?.id ?? investment?.investmentId
        );
        if (!Number.isFinite(investmentId)) return;

        flowsByInvestment[investmentId] = toSafeArray(investment.transaction_flows);
        fairValuesByInvestment[investmentId] = toSafeArray(investment.fair_value_flows);
      });

      const next = {
        investments,
        flowsByInvestment,
        fairValuesByInvestment,
        loadedAt: new Date().toISOString(),
      };

      cacheRef.current.set(normalizedFundId, next);
      setDataset({ ...next, isLoading: false, error: null });
    } catch (error) {
      console.error("Failed to load portfolio dataset:", error);
      setDataset((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    }
  }, [api, fundId]);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  const fetchInvestments = useCallback(async () => {
    await refresh();
    return cacheRef.current.get(Number(fundId))?.investments ?? [];
  }, [fundId, refresh]);

  const fetchInvestment = useCallback(async (investmentId) => {
    const normalizedFundId = Number(fundId);
    const normalizedInvestmentId = Number(investmentId);
    if (!Number.isFinite(normalizedFundId) || !Number.isFinite(normalizedInvestmentId)) return null;

    const investment = await api.get(
      `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/`
    );
    return {
      ...investment,
      transaction_flows: toSafeArray(investment.transaction_flows),
      fair_value_flows: toSafeArray(investment.fair_value_flows),
    };
  }, [api, fundId]);

  const createInvestment = useCallback(async (payload, options = {}) => {
    const normalizedFundId = Number(fundId);
    const created = await api.post(`/api/funds/${normalizedFundId}/portfolio-investments/`, payload);
    if (options.refresh !== false) {
      await refresh();
    }
    return created;
  }, [api, fundId, refresh]);

  const updateInvestment = useCallback(async (investmentId, payload, options = {}) => {
    const normalizedFundId = Number(fundId);
    const normalizedInvestmentId = Number(investmentId);
    const updated = await api.put(
      `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/`,
      payload
    );
    if (options.refresh !== false) {
      await refresh();
    }
    return updated;
  }, [api, fundId, refresh]);

  const deleteInvestment = useCallback(async (investmentId, options = {}) => {
    const normalizedFundId = Number(fundId);
    const normalizedInvestmentId = Number(investmentId);
    const response = await api.delete(
      `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/`
    );
    if (options.refresh !== false) {
      await refresh();
    }
    return response;
  }, [api, fundId, refresh]);

  const saveFlow = useCallback(async (investmentId, flowPayload, options = {}) => {
    const normalizedFundId = Number(fundId);
    const normalizedInvestmentId = Number(investmentId);
    const existingFlowId = flowPayload.flowId ?? flowPayload.id ?? null;
    const endpoint = existingFlowId
      ? `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/flows/${existingFlowId}/`
      : `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/flows/`;
    const response = existingFlowId
      ? await api.put(endpoint, flowPayload)
      : await api.post(endpoint, flowPayload);
    if (options.refresh !== false) {
      await refresh();
    }
    return response;
  }, [api, fundId, refresh]);

  const deleteFlow = useCallback(async (investmentId, flowId, options = {}) => {
    const normalizedFundId = Number(fundId);
    const normalizedInvestmentId = Number(investmentId);
    const normalizedFlowId = Number(flowId);
    const response = await api.delete(
      `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/flows/${normalizedFlowId}/`
    );
    if (options.refresh !== false) {
      await refresh();
    }
    return response;
  }, [api, fundId, refresh]);

  const saveFairValue = useCallback(async (investmentId, fairValuePayload, options = {}) => {
    const normalizedFundId = Number(fundId);
    const normalizedInvestmentId = Number(investmentId);
    const existingFairValueId = fairValuePayload.fairValueId ?? fairValuePayload.id ?? null;
    const endpoint = existingFairValueId
      ? `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/fair-values/${existingFairValueId}/`
      : `/api/funds/${normalizedFundId}/portfolio-investments/${normalizedInvestmentId}/fair-values/`;
    const response = existingFairValueId
      ? await api.put(endpoint, fairValuePayload)
      : await api.post(endpoint, fairValuePayload);
    if (options.refresh !== false) {
      await refresh();
    }
    return response;
  }, [api, fundId, refresh]);

  const fetchTransactionTypes = useCallback(async () => {
    const response = await api.get("/api/portfolio-transaction-types/");
    return toSafeArray(response);
  }, [api]);

  return {
    ...dataset,
    refresh,
    fetchInvestments,
    fetchInvestment,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    saveFlow,
    deleteFlow,
    saveFairValue,
    fetchTransactionTypes,
  };
};
