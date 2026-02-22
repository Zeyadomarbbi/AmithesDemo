import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../useApi';

export function useCASKPIs(fundId, timeframeId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  const fetchCASKPIs = useCallback(async () => {
    if (!fundId || !timeframeId) {
      setData(null);
      return;
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/api/funds/${fundId}/cas-kpis/`);
      url.searchParams.append('timeframe_id', timeframeId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      setData(result);

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch CAS KPIs');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [fundId, timeframeId]);

  useEffect(() => {
    fetchCASKPIs();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchCASKPIs]);

  return { data, isLoading, error, refetch: fetchCASKPIs };
}