import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../../hooks/useApi";

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const getInvestmentId = (row) => {
  const id = Number(row?.investment_id ?? row?.id);
  return Number.isFinite(id) ? id : null;
};

const mapWithConcurrency = async (items, limit, mapper) => {
  const queue = [...items];
  const results = [];

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) continue;
      results.push(await mapper(item));
    }
  });

  await Promise.all(workers);
  return results;
};

export const usePortfolioDataset = (fundId) => {
  const [dataset, setDataset] = useState({
    investments: [],
    flowsByInvestment: {},
    fairValuesByInvestment: {},
    isLoading: false,
    error: null,
    loadedAt: null,
  });

  const cacheRef = useRef(new Map());

  const load = useCallback(
    async (forceRefresh = false) => {
      const normalizedFundId = Number(fundId);
      if (!Number.isFinite(normalizedFundId)) {
        setDataset((prev) => ({
          ...prev,
          investments: [],
          flowsByInvestment: {},
          fairValuesByInvestment: {},
          isLoading: false,
          error: null,
          loadedAt: null,
        }));
        return;
      }

      const cached = cacheRef.current.get(normalizedFundId);
      if (cached && !forceRefresh) {
        setDataset({ ...cached, isLoading: false, error: null });
        return;
      }

      setDataset((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const investmentsRes = await fetch(
          `${API_BASE_URL}/api/funds/${normalizedFundId}/portfolio-investments/`
        );
        if (!investmentsRes.ok) {
          throw new Error("Failed to fetch portfolio investments");
        }

        const investmentsPayload = await investmentsRes.json();
        const investments = toSafeArray(investmentsPayload?.rows || investmentsPayload).filter(
          (row) => Number.isFinite(getInvestmentId(row))
        );

        const perInvestment = await mapWithConcurrency(investments, 6, async (investment) => {
          const investmentId = getInvestmentId(investment);
          if (!Number.isFinite(investmentId)) {
            return { investmentId: null, flows: [], fairValues: [] };
          }

          const [flowsRes, fairValuesRes] = await Promise.all([
            fetch(
              `${API_BASE_URL}/api/funds/${normalizedFundId}/portfolio-investments/${investmentId}/flows/`
            ),
            fetch(
              `${API_BASE_URL}/api/funds/${normalizedFundId}/portfolio-investments/${investmentId}/fair-values/`
            ),
          ]);

          const flows = flowsRes.ok ? toSafeArray(await flowsRes.json()) : [];
          const fairValues = fairValuesRes.ok ? toSafeArray(await fairValuesRes.json()) : [];

          return { investmentId, flows, fairValues };
        });

        const flowsByInvestment = {};
        const fairValuesByInvestment = {};
        perInvestment.forEach(({ investmentId, flows, fairValues }) => {
          if (!Number.isFinite(investmentId)) return;
          flowsByInvestment[investmentId] = flows;
          fairValuesByInvestment[investmentId] = fairValues;
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
    },
    [fundId]
  );

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
