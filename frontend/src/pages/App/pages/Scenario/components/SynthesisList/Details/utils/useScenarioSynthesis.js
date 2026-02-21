// useScenarioSynthesis.js
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../../../../hooks/useApi';

const useScenarioSynthesis = (fundId, synthesisId) => {
  const [synthesis, setSynthesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fundId || !synthesisId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/funds/${fundId}/synthesis-details/${synthesisId}/`
        );
        if (!res.ok) throw new Error(`Failed to fetch synthesis: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setSynthesis(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [fundId, synthesisId]);

  return { synthesis, loading, error };
};

export default useScenarioSynthesis;