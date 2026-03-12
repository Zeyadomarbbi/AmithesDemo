import { useState, useEffect } from 'react';
import useApi from "../../../../../../../../hooks/api/useApi"; // Adjust relative path as needed

const useScenarioSynthesis = (fundId, synthesisId) => {
  const api = useApi();
  const [synthesis, setSynthesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fundId || !synthesisId) {
      setSynthesis(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // api.get handles API_BASE_URL and credentials internally
        const data = await api.get(`/api/funds/${fundId}/synthesis-details/${synthesisId}/`);
        
        if (!cancelled) setSynthesis(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { 
      cancelled = true; 
    };
  }, [fundId, synthesisId, api]);

  return { synthesis, loading, error };
};

export default useScenarioSynthesis;