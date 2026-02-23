import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi';

export const useCapitalFlowLPOperationAllocation = (fundId, operationId) => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // URL matches: /funds/<int:fund_id>/operations/<int:lps_operation_details_id>/lp-allocations/
  const baseUrl = `${API_BASE_URL}/api/funds/${fundId}/operations/${operationId}/lp-allocations/`;

  // Internal helper for native fetch logic
  const handleRequest = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const fetchAllAllocations = useCallback(async () => {
    const url = `${API_BASE_URL}/api/funds/${fundId}/lp-allocations/`;
    setIsLoading(true);
    setError(null);
    try {
      const data = await handleRequest(url);
      setAllocations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fundId]);

  // GET: Fetch existing records from lps_operation_lp_allocations (Physical Table)
  const fetchAllocations = useCallback(async () => {
    if (!operationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await handleRequest(baseUrl);
      setAllocations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, operationId]);

  // GET: Fetch the aggregated summary from child flows (Virtual Calculation)
  const fetchSummary = useCallback(async () => {
    if (!operationId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Accesses the @action(detail=False) endpoint defined in Django
      const data = await handleRequest(`${baseUrl}summary/`);
      setSummary(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, operationId]);

  // POST: Create a new operation-level allocation record
  const createAllocation = async (operationId, payload) => {
    const url = `${API_BASE_URL}/api/funds/${fundId}/operations/${operationId}/lp-allocations/`;
    setIsLoading(true);
    setError(null);
    try {
      const res = await handleRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAllocations((prev) => [...prev, res]);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  // PATCH: Update an existing operation-level allocation record
  const updateAllocation = async (id, payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await handleRequest(`${baseUrl}${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setAllocations((prev) => 
        prev.map(a => a.lp_operation_allocation_id === id ? res : a)
      );
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    allocations,
    summary,
    isLoading,
    error,
    fetchAllAllocations,
    fetchAllocations,
    fetchSummary,
    createAllocation,
    updateAllocation
  };
};