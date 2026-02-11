import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

export const useScenarioPortfolioProjections = (fundId, scenarioId) => {
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
      const url = `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/projections/`;
      const response = await axios.get(url);
      setProjections(response.data);
    } catch (err) {
      console.error("Failed to fetch scenario projections:", err);
    } finally {
      setLoading(false);
    }
  }, [fundId, scenarioId]);

  /**
   * UPDATE PROJECTION INPUTS
   * Sends new input_duration or input_moic to the server.
   * The Django serializer handles the call to fn_rebuild_scenario_projection.
   */
  const updateProjection = async (projectionId, data) => {
    const url = `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/projections/${projectionId}/`;
    try {
      const response = await axios.patch(url, data);
      
      // Update local state with the newly calculated values from the DB
      setProjections((prev) =>
        prev.map((p) => (p.projection_id === projectionId ? response.data : p))
      );
      
      return response.data;
    } catch (err) {
      console.error("Failed to update projection inputs:", err);
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