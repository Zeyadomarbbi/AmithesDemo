import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useApi from "../../../../../../../../hooks/api/useApi"; // Adjust relative path as needed

export const useScenarioData = (fundId, scenarioId) => {
  const api = useApi();
  const location = useLocation();
  
  // Initialize from React Router state if available to avoid redundant network calls
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Guard: Prevent fetch if data is already present (e.g., from location.state)
    if (data) {
      setLoading(false);
      return;
    }

    if (!fundId || !scenarioId) return;

    let isMounted = true;

    const fetchScenario = async () => {
      setLoading(true);
      setError(null);
      try {
        // api.get handles base URL and session credentials automatically
        const result = await api.get(`/api/funds/${fundId}/scenario_list/${scenarioId}/`);
        
        if (isMounted) {
          // Map backend fields to frontend expected schema
          setData({
            title: result.scenario_name,
            author: result.created_by,
            date: result.created_at,
            description: result.description,
            ...result
          });
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScenario();

    return () => {
      isMounted = false;
    };
  }, [fundId, scenarioId, data, api]);

  return { data, loading, error };
};