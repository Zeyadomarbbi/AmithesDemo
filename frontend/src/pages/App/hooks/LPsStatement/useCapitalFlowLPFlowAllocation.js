import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi';

export const useCapitalFlowLPFlowAllocation = (fundId, operationId, flowId) => {
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // URL matches your Django nested path
  const baseUrl = `${API_BASE_URL}/api/funds/${fundId}/operations/${operationId}/flows/${flowId}/lp_allocations/`;

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

    if (response.status === 204) return null; // Standard for DELETE
    return response.json();
  };

  // GET: Fetch all LP allocations for this specific flow
  const fetchAllocations = useCallback(async () => {
    if (!flowId) return; // Prevent call if flowId isn't ready
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
  }, [baseUrl, flowId]);

  // POST: Create a single LP allocation
  const createAllocation = async (operationId, flowId, payload) => {
    const url = `${API_BASE_URL}/api/funds/${fundId}/operations/${operationId}/flows/${flowId}/lp_allocations/`;
    console.log("[createFlowLPAllocation] payload:", payload);
    setIsLoading(true);
    setError(null);
    try {
      const response = await handleRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAllocations((prev) => [...prev, response]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // PATCH: Update a single LP allocation
  const updateAllocation = async (allocationId, payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await handleRequest(`${baseUrl}${allocationId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setAllocations((prev) =>
        prev.map((a) => (a.lp_flow_allocation_id === allocationId ? response : a))
      );
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE: Remove a single LP allocation
  const deleteAllocation = async (allocationId) => {
    setIsLoading(true);
    setError(null);
    try {
      await handleRequest(`${baseUrl}${allocationId}/`, { method: 'DELETE' });
      setAllocations((prev) => 
        prev.filter((a) => a.lp_flow_allocation_id !== allocationId)
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    allocations,
    isLoading,
    error,
    fetchAllocations,
    createAllocation,
    updateAllocation,
    deleteAllocation,
  };
};