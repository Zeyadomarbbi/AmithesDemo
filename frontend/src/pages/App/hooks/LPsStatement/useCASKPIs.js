import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../useApi';

export function useCASKPIs(fundId, timeframeId) {
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
      const url = new URL(`${API_BASE_URL}/api/funds/${fundId}/cas-kpis/`);
      url.searchParams.append('timeframe_id', timeframeId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Uncomment if required
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch CAS KPIs');
    } finally {
      setIsLoading(false);
    }
  }, [fundId, timeframeId]);

  useEffect(() => {
    fetchCASKPIs();
  }, [fetchCASKPIs]);

  return { data, isLoading, error, refetch: fetchCASKPIs };
}