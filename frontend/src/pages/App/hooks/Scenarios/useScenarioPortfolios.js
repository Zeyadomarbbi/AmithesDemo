import { useState, useCallback } from 'react';
import useApi from "../api/useApi";

export const useScenarioInvestments = (fundId) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);

  // FETCHING: Level 1 (All Fund) or Level 2 (Specific Scenario)
  const fetchInvestments = useCallback(async (scenarioId = null) => {
    setLoading(true);
    try {
      const endpoint = scenarioId 
        ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`
        : `/api/funds/${fundId}/portfolio-investments/`;
      
      const data = await api.get(endpoint);
      setInvestments(data);
    } catch (err) {
      console.error("Fetch failed", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, api]);

  // CREATE: Must supply scenarioId
  const createInvestment = async (scenarioId, payload) => {
    if (!scenarioId) throw new Error("scenario_id is mandatory for creation.");
    try {
      const data = await api.post(
        `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/`, 
        payload
      );
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Create failed", err.message);
      throw err;
    }
  };

  // UPDATE: Targeted update for a specific investment
  const updateInvestment = async (scenarioId, investmentId, payload) => {
    try {
      const data = await api.patch(
        `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`, 
        payload
      );
      fetchInvestments(scenarioId);
      return data;
    } catch (err) {
      console.error("Update failed", err.message);
      throw err;
    }
  };

  // DELETE: Targeted deletion
  const deleteInvestment = async (scenarioId, investmentId) => {
    try {
      await api.delete(
        `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/`
      );
      fetchInvestments(scenarioId);
    } catch (err) {
      console.error("Delete failed", err.message);
      throw err;
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