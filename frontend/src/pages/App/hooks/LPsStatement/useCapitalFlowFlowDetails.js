import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi'; 

export const useCapitalFlowFlowDetails = (fundId, operationId) => {
  const [flows, setFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseUrl = `${API_BASE_URL}/api/funds/${fundId}/operations/${operationId}/flows/`;

  // Helper for repetitive fetch logic
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

    // No content for DELETE
    if (response.status === 204) return null;
    return response.json();
  };

  // GET: Fetch all flows for this operation
  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await handleRequest(baseUrl);
      setFlows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // POST: Create a new flow
  const createFlow = async (operationId, flowData) => {
    const url = `${API_BASE_URL}/api/funds/${fundId}/operations/${operationId}/flows/`;
    setIsLoading(true);
    setError(null);
    try {
      const response = await handleRequest(url, {
        method: 'POST',
        body: JSON.stringify(flowData),
      });
      setFlows((prev) => [...prev, response]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // PATCH: Update an existing flow
  const updateFlow = async (flowId, updateData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await handleRequest(`${baseUrl}${flowId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
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
  const deleteFlow = async (flowId) => {
    setIsLoading(true);
    setError(null);
    try {
      await handleRequest(`${baseUrl}${flowId}/`, { method: 'DELETE' });
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