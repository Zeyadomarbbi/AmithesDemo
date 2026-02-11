import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

export const useScenarioInvestments = (fundId) => {
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);

  // FETCHING: Level 1 (All Fund) or Level 2 (Specific Scenario)
  const fetchInvestments = useCallback(async (scenarioId = null) => {
    setLoading(true);
    try {
      const url = scenarioId 
        ? `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
        : `${API_BASE_URL}/funds/${fundId}/portfolio-investments/`;
      
      const response = await axios.get(url);
      setInvestments(response.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  // CREATE: Must supply scenarioId
  const createInvestment = async (scenarioId, data) => {
    if (!scenarioId) throw new Error("scenario_id is mandatory for creation.");
    try {
      const url = `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`;
      const response = await axios.post(url, data);
      fetchInvestments(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Create failed", err);
      throw err;
    }
  };

  // UPDATE: Targeted update for a specific investment
  const updateInvestment = async (scenarioId, investmentId, data) => {
    try {
      const url = `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`;
      const response = await axios.patch(url, data);
      fetchInvestments(scenarioId);
      return response.data;
    } catch (err) {
      console.error("Update failed", err);
      throw err;
    }
  };

  // DELETE: Targeted deletion
  const deleteInvestment = async (scenarioId, investmentId) => {
    try {
      const url = `${API_BASE_URL}/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`;
      await axios.delete(url);
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return {
    investments,
    loading,
    fetchInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment
  };
};