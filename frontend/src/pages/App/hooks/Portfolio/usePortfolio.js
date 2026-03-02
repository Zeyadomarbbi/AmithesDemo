import { useState, useCallback } from 'react';
import useApi from "../api/useApi";

export const usePortfolio = (fundId) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);

  // --- PORTFOLIO INVESTMENTS (With Nested Flows) ---

  /**
   * Fetching Logic:
   * Returns investments with their nested transaction_flows.
   * No scenarioId: Global view (Master + all Scenarios)
   * With scenarioId: Specific Scenario view
   */
  const fetchInvestments = useCallback(async (scenarioId = null) => {
    setLoading(true);
    try {
      const endpoint = scenarioId
        ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
        : `/api/funds/${fundId}/portfolio-investments/`;
      
      const data = await api.get(endpoint);
      setInvestments(data);
    } catch (err) {
      console.error("Failed to fetch investments", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, api]);

  const createInvestment = async (scenarioId, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
      : `/api/funds/${fundId}/portfolio-investments/`;
    
    try {
      const data = await api.post(endpoint, { ...payload, scenario_id: scenarioId });
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Investment creation failed", err.message);
      throw err;
    }
  };

  const deleteInvestment = async (scenarioId, investmentId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/`;
    try {
      await api.delete(endpoint);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Investment deletion failed", err.message);
    }
  };

  // --- TRANSACTION FLOWS (Individual Actions) ---

  const createFlow = async (investmentId, scenarioId, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    
    try {
      const data = await api.post(endpoint, payload);
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Flow creation failed", err.message);
      throw err;
    }
  };

  const deleteFlow = async (investmentId, scenarioId, flowId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    try {
      await api.delete(endpoint);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Flow deletion failed", err.message);
    }
  };

  return {
    investments,
    loading,
    fetchInvestments,
    createInvestment,
    deleteInvestment,
    createFlow,
    deleteFlow
  };
};