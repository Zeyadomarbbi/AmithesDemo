import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

export const usePortfolioFlows = (fundId, investmentId) => {
  const [loading, setLoading] = useState(false);
  const [flows, setFlows] = useState([]);

  /**
   * FETCH FLOWS
   * No scenarioId: Hits APIView (Master/Global flows)
   * With scenarioId: Hits ViewSet (Scenario-specific flows)
   */
  const fetchFlows = useCallback(async (scenarioId = null) => {
    if (!investmentId) return;
    setLoading(true);
    try {
      const url = scenarioId
        ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
        : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
      
      const response = await axios.get(url);
      setFlows(response.data);
    } catch (err) {
      console.error("Failed to fetch flows:", err);
    } finally {
      setLoading(false);
    }
  }, [fundId, investmentId]);

  /**
   * CREATE FLOW
   * Automatically uses the correct endpoint based on scenarioId
   */
  const createFlow = async (scenarioId, data) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    
    try {
      const response = await axios.post(url, { ...data, scenario_id: scenarioId });
      fetchFlows(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Flow creation failed:", err);
      throw err;
    }
  };

  /**
   * DELETE FLOW
   * Targets specific flow ID within the context of the scenario
   */
  const deleteFlow = async (scenarioId, flowId) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    
    try {
      await axios.delete(url);
      fetchFlows(scenarioId);
    } catch (err) {
      console.error("Flow deletion failed:", err);
    }
  };

  /**
   * UPDATE FLOW (PATCH)
   */
  const updateFlow = async (scenarioId, flowId, data) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    
    try {
      const response = await axios.patch(url, data);
      fetchFlows(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Flow update failed:", err);
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