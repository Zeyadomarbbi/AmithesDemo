import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../hooks/useApi';

export const useScenarioFFAllOperations = (fundId, scenarioId) => {
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

      const response = await axios.get(
        `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/all-operations/`
      );

      setAllOperations(response.data || []);
    } catch (err) {
      console.error('Error fetching all operations:', err);
      setError(err.message || 'Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  }, [fundId, scenarioId]);

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