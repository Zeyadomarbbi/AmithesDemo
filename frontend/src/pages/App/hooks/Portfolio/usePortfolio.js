import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

export const usePortfolio = (fundId) => {
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [flows, setFlows] = useState([]);

  // --- PORTFOLIO INVESTMENTS ---

  /**
   * Fetching Logic:
   * No scenarioId: Hits the Global APIView (Returns everything)
   * With scenarioId: Hits the Scenario ViewSet (Returns only scenario items)
   */
  const fetchInvestments = useCallback(async (scenarioId = null) => {
    setLoading(true);
    try {
      const url = scenarioId
        ? `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
        : `${API_BASE_URL}/funds/${fundId}/portfolio-investments/`;
      
      const response = await axios.get(url);
      setInvestments(response.data);
    } catch (err) {
      console.error("Failed to fetch investments", err);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  const createInvestment = async (scenarioId, data) => {
    // If scenarioId is provided, we use the nested scenario URL
    const url = scenarioId
      ? `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
      : `${API_BASE_URL}/funds/${fundId}/portfolio-investments/`;
    
    try {
      const response = await axios.post(url, { ...data, scenario_id: scenarioId });
      fetchInvestments(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Investment creation failed", err);
      throw err;
    }
  };

  const deleteInvestment = async (scenarioId, investmentId) => {
    // Transactional deletes always use the scenario-specific ViewSet path
    const url = `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`;
    try {
      await axios.delete(url);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Investment deletion failed", err);
    }
  };

  // --- TRANSACTION FLOWS ---

  const fetchFlows = useCallback(async (investmentId, scenarioId = null) => {
    setLoading(true);
    try {
      const url = scenarioId
        ? `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
        : `${API_BASE_URL}/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
      
      const response = await axios.get(url);
      setFlows(response.data);
    } catch (err) {
      console.error("Failed to fetch flows", err);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  const createFlow = async (investmentId, scenarioId, data) => {
    const url = scenarioId
      ? `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `${API_BASE_URL}/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    
    try {
      const response = await axios.post(url, data);
      fetchFlows(investmentId, scenarioId);
      return response.data;
    } catch (err) {
      console.error("Flow creation failed", err);
      throw err;
    }
  };

  const deleteFlow = async (investmentId, scenarioId, flowId) => {
    const url = scenarioId
      ? `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `${API_BASE_URL}/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    try {
      await axios.delete(url);
      fetchFlows(investmentId, scenarioId);
    } catch (err) {
      console.error("Flow deletion failed", err);
    }
  };

  return {
    investments,
    flows,
    loading,
    fetchInvestments,
    createInvestment,
    deleteInvestment,
    fetchFlows,
    createFlow,
    deleteFlow
  };
};