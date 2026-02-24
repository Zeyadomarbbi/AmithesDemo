// src/pages/App/pages/Scenario/hooks/useScenarioData.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../../../../hooks/useApi';

export const useScenarioData = (fundId, scenarioId) => {
  const location = useLocation();
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we have state from a client-side Link/Navigate, don't fetch
    if (data) {
        setLoading(false);
        return;
    }

    const fetchScenario = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: Failed to fetch scenario`);
        }
        
        const result = await response.json();
        
        // Map backend fields to frontend expected keys
        setData({
          title: result.scenario_name,
          author: result.created_by,
          date: result.created_at,
          description: result.description,
          ...result
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, [fundId, scenarioId, data]);

  return { data, loading, error };
};