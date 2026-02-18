import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../hooks/useApi';

export const useScenarioWaterfall = (fundId, scenarioId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWaterfall = useCallback(async () => {
        // Prevent fetching if IDs are missing or invalid
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);

        try {
            // Ensure no double slashes or missing 'api' prefix based on your config
            const response = await axios.get(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/waterfall/`
            );
            setData(response.data);
        } catch (err) {
            console.error('Error fetching waterfall data:', err);
            const resData = err.response?.data;
            // Handle both 'detail' (404) and 'error' (500) keys from Django
            setError(resData?.detail || resData?.error || err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    useEffect(() => {
        fetchWaterfall();
    }, [fetchWaterfall]);

    return { data, loading, error, refetch: fetchWaterfall };
};