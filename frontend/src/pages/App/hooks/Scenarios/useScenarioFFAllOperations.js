import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi"; // Adjust relative path as needed

export const useScenarioFFAllOperations = (fundId, scenarioId) => {
  const api = useApi();
  const [allOperations, setAllOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllOperations = useCallback(async () => {
    if (!fundId || !scenarioId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // api.get handles prefixing the base URL and returns data directly
      const data = await api.get(
        `/api/funds/${fundId}/scenario_list/${scenarioId}/ff-all-operations/`
      );

      setAllOperations(data || []);
    } catch (err) {
      console.error('Error fetching all operations:', err.message);
      setError(err.message || 'Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  }, [fundId, scenarioId, api]);

  useEffect(() => {
    fetchAllOperations();
  }, [fetchAllOperations]);

  return {
    allOperations,
    loading,
    error,
    refresh: fetchAllOperations
  };
};