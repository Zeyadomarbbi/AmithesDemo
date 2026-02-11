import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

export const usePortfolio = (fundId) => {
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
      const url = scenarioId
        ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
        : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`;
      
      const response = await axios.get(url);
      // response.data contains [ { ..., transaction_flows: [...] }, ... ]
      setInvestments(response.data);
    } catch (err) {
      console.error("Failed to fetch investments", err);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  const createInvestment = async (scenarioId, data) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/`;
    
    try {
      const response = await axios.post(url, { ...data, scenario_id: scenarioId });
      // Re-fetch to get the newly created investment along with its empty flow array
      fetchInvestments(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Investment creation failed", err);
      throw err;
    }
  };

  const deleteInvestment = async (scenarioId, investmentId) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/`;
    try {
      await axios.delete(url);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Investment deletion failed", err);
    }
  };

  // --- TRANSACTION FLOWS (Individual Actions) ---
  // We keep the mutations (Create/Delete) but they refresh the whole investment list 
  // to keep the nested data in sync.

  const createFlow = async (investmentId, scenarioId, data) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    
    try {
      const response = await axios.post(url, data);
      // Refresh investments to update the nested flows array for this investment
      fetchInvestments(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Flow creation failed", err);
      throw err;
    }
  };

  const deleteFlow = async (investmentId, scenarioId, flowId) => {
    const url = scenarioId
      ? `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    try {
      await axios.delete(url);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Flow deletion failed", err);
    }
  };

  return {
    investments, // Now contains nested flows
    loading,
    fetchInvestments,
    createInvestment,
    deleteInvestment,
    createFlow,
    deleteFlow
  };
};