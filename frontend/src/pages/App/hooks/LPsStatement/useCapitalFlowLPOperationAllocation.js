import { useState, useCallback } from 'react';
import useApi from '../../../../hooks/api/useApi';

export const useCapitalFlowLPOperationAllocation = (fundId, operationId) => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = useApi();

  // Relative endpoint for the authenticated instance
  const baseEndpoint = `/api/funds/${fundId}/operations/${operationId}/lp-allocations/`;

  const fetchAllAllocations = useCallback(async () => {
    const url = `/api/funds/${fundId}/lp-allocations/`;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get(url);
      setAllocations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api, fundId]);

  // GET: Fetch existing records from lps_operation_lp_allocations (Physical Table)
  const fetchAllocations = useCallback(async () => {
    if (!operationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get(baseEndpoint);
      setAllocations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api, baseEndpoint, operationId]);

  // GET: Fetch the aggregated summary from child flows (Virtual Calculation)
  const fetchSummary = useCallback(async () => {
    if (!operationId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Accesses the summary @action endpoint
      const data = await api.get(`${baseEndpoint}summary/`);
      setSummary(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api, baseEndpoint, operationId]);

  // POST: Create a new operation-level allocation record
  const createAllocation = async (targetOpId, payload) => {
    const url = `/api/funds/${fundId}/operations/${targetOpId}/lp-allocations/`;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post(url, payload);
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
      const res = await api.patch(`${baseEndpoint}${id}/`, payload);
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

  const deleteAllocation = async (targetOpId, allocationId) => {
    const url = `/api/funds/${fundId}/operations/${targetOpId}/lp-allocations/${allocationId}/`;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(url);
      setAllocations((prev) =>
        prev.filter((a) => a.lp_operation_allocation_id !== allocationId)
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
    summary,
    isLoading,
    error,
    fetchAllAllocations,
    fetchAllocations,
    fetchSummary,
    createAllocation,
    updateAllocation,
    deleteAllocation
  };
};