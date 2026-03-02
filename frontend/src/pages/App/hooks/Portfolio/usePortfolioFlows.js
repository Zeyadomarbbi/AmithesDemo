import { useState, useCallback } from 'react';
import useApi from "../api/useApi";

export const usePortfolioFlows = (fundId, investmentId) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [flows, setFlows] = useState([]);

  /**
   * FETCH FLOWS
   */
  const fetchFlows = useCallback(async (scenarioId = null) => {
    if (!investmentId) return;
    setLoading(true);
    try {
      const endpoint = scenarioId
        ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
        : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
      
      const data = await api.get(endpoint);
      
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setFlows(sortedData);
    } catch (err) {
      console.error("Failed to fetch combined flows:", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, investmentId, api]);

  /**
   * CREATE FLOW
   */
  const createFlow = async (scenarioId, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    
    try {
      const data = await api.post(endpoint, { ...payload, scenario_id: scenarioId });
      fetchFlows(scenarioId);
      return data;
    } catch (err) {
      console.error("Flow creation failed:", err.message);
      throw err;
    }
  };

  /**
   * DELETE FLOW
   */
  const deleteFlow = async (scenarioId, flowId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    
    try {
      await api.delete(endpoint);
      fetchFlows(scenarioId);
    } catch (err) {
      console.error("Flow deletion failed:", err.message);
    }
  };

  /**
   * UPDATE FLOW (PATCH)
   */
  const updateFlow = async (scenarioId, flowId, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    
    try {
      const data = await api.patch(endpoint, payload);
      fetchFlows(scenarioId);
      return data;
    } catch (err) {
      console.error("Flow update failed:", err.message);
      throw err;
    }
  };

  return {
    flows,
    loading,
    fetchFlows,
    createFlow,
    updateFlow,
    deleteFlow
  };
};