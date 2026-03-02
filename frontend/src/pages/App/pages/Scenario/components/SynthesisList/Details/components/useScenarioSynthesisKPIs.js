import { useState, useEffect } from 'react';
import useApi from "../../../../../../hooks/api/useApi"; // Adjusted path to engine

export default function useScenarioSynthesisKPIs(fundId, synthesisId) {
    const api = useApi();
    const [kpiData, setKpiData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!fundId || !synthesisId) {
            setKpiData([]);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                // api.get handles base URL, credentials, and error parsing
                const data = await api.get(`/api/funds/${fundId}/synthesis-details/${synthesisId}/kpis/`);
                
                if (!cancelled) {
                    setKpiData(data || []); 
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => { 
            cancelled = true; 
        };
    }, [fundId, synthesisId, api]);

    return { kpiData, loading, error };
}