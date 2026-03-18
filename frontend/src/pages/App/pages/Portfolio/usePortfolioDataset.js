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

  return {
    ...dataset,
    refresh,
  };
};
