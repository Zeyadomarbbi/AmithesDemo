import { useState, useCallback, useEffect } from 'react';
import useApi from "../../../../hooks/api/useApi";

export function useCASKPIs(fundId, timeframeId) {
  const api = useApi();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCASKPIs = useCallback(async () => {
    if (!fundId || !timeframeId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // useApi handles the base URL and credential injection
      const result = await api.get(`/api/funds/${fundId}/cas-kpis/`, {
        params: { timeframe_id: timeframeId }
      });
      
      setData(result);
    } catch (err) {
      // The engine handles standardizing error messages
      setError(err.message || 'Failed to fetch CAS KPIs');
    } finally {
      setIsLoading(false);
    }
  }, [fundId, timeframeId, api]);

  const saveAdjustedNav = useCallback(async (adjustedNav) => {
    if (!fundId || !timeframeId) return;
    try {
      await api.post(`/api/funds/${fundId}/cas-kpis/`, {
        timeframe_id: timeframeId,
        adjusted_nav: adjustedNav,
      });
    } catch (err) {
      console.error('Failed to save adjusted NAV:', err);
    }
  }, [fundId, timeframeId, api]);

  useEffect(() => {
    fetchCASKPIs();
  }, [fetchCASKPIs]);

  return { data, isLoading, error, refetch: fetchCASKPIs, saveAdjustedNav };
}