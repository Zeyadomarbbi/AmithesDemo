import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../../../../../../../../hooks/api/useApi";

export const useScenarioWaterfall = (fundId, scenarioId) => {
    const api = useApi();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWaterfall = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);

        try {
            // api.get prepends the base URL and returns the data object directly
            const result = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/waterfall/`
            );
            setData(result);
        } catch (err) {
            console.error('Error fetching waterfall data:', err.message);
            
            // Accessing response data from the standardized error object
            const resData = err.response?.data;
            setError(resData?.detail || resData?.error || err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    useEffect(() => {
        fetchWaterfall();
    }, [fetchWaterfall]);

    return { data, loading, error, refetch: fetchWaterfall };
};