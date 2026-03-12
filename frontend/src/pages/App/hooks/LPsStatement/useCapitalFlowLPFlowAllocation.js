import { useState, useCallback } from 'react';
import useApi from '../../../../hooks/api/useApi';

export const useCapitalFlowLPFlowAllocation = (fundId, operationId, flowId) => {
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const api = useApi();

  // Clean relative path for the API instance
  const baseEndpoint = `/api/funds/${fundId}/operations/${operationId}/flows/${flowId}/lp_allocations/`;

  // GET: Fetch all LP allocations for this specific flow
  const fetchAllocations = useCallback(async () => {
    if (!flowId) return; 
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
  }, [api, baseEndpoint, flowId]);

  // POST: Create a single LP allocation
  const createAllocation = async (targetOpId, targetFlowId, payload) => {
    const endpoint = `/api/funds/${fundId}/operations/${targetOpId}/flows/${targetFlowId}/lp_allocations/`;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(endpoint, payload);
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
      const response = await api.patch(`${baseEndpoint}${allocationId}/`, payload);
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
      await api.delete(`${baseEndpoint}${allocationId}/`);
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