import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

export const useScenarioPortfolioProjections = (fundId, scenarioId) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [projections, setProjections] = useState([]);

  /**
   * FETCH PROJECTIONS
   * Retrieves the materialized rows for the specific scenario.
   */
  const fetchProjections = useCallback(async () => {
    if (!fundId || !scenarioId) return;
    setLoading(true);
    try {
      // api.get handles the API_BASE_URL and credentials internally
      const data = await api.get(
        `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-projections/`
      );
      setProjections(data);
    } catch (err) {
      console.error("Failed to fetch scenario projections:", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, scenarioId, api]);

  /**
   * UPDATE PROJECTION INPUTS
   * Sends new input_duration or input_moic to the server.
   */
  const updateProjection = async (projectionId, payload) => {
    try {
      const data = await api.patch(
        `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-projections/${projectionId}/`,
        payload
      );
      
      // Update local state with the newly calculated values from the DB
      setProjections((prev) =>
        prev.map((p) => (p.projection_id === projectionId ? data : p))
      );
      
      return data;
    } catch (err) {
      console.error("Failed to update projection inputs:", err.message);
      throw err;
    }
  };

  return {
    projections,
    loading,
    fetchProjections,
    updateProjection,
  };
};