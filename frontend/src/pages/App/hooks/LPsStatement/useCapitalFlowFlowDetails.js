import { useState, useCallback } from 'react';
import useApi from '../../../../hooks/api/useApi'; 

export const useCapitalFlowFlowDetails = (fundId, operationId) => {
  const [flows, setFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const api = useApi();

  // Define base endpoint path without the full URL prefix
  const baseEndpoint = `/api/funds/${fundId}/operations/${operationId}/flows/`;

  // GET: Fetch all flows for this operation
  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get(baseEndpoint);
      setFlows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api, baseEndpoint]);

  // POST: Create a new flow
  const createFlow = async (targetOperationId, flowData) => {
    // Note: using targetOperationId if it differs from the hook's operationId
    const endpoint = `/api/funds/${fundId}/operations/${targetOperationId}/flows/`;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(endpoint, flowData);
      setFlows((prev) => [...prev, response]);
      return response;
    } catch (err) {
      console.error("[createFlow] error:", err.message, "payload:", flowData);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // PATCH: Update an existing flow
  const updateFlow = async (targetOperationId, flowId, updateData) => {
    const endpoint = `/api/funds/${fundId}/operations/${targetOperationId}/flows/${flowId}/`;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.patch(endpoint, updateData);
      setFlows((prev) =>
        prev.map((f) => (f.operation_flow_id === flowId ? response : f))
      );
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE: Remove a flow
  const deleteFlow = async (targetOperationId, flowId) => {
    const endpoint = `/api/funds/${fundId}/operations/${targetOperationId}/flows/${flowId}/`;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(endpoint);
      setFlows((prev) => prev.filter((f) => f.operation_flow_id !== flowId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    flows,
    isLoading,
    error,
    fetchFlows,
    createFlow,
    updateFlow,
    deleteFlow,
  };
};