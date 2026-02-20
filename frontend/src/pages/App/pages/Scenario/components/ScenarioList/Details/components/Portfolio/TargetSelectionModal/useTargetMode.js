import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../hooks/useApi';

export const useTargetMode = (fundId, scenarioId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeTargetMode = useCallback(async (payload) => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/target-mode/`,
                payload
            );
            setData(response.data);
            return response.data;
        } catch (err) {
            console.error('Error executing target mode:', err);
            const resData = err.response?.data;
            setError(resData?.detail || resData?.error || err.message || 'Failed to execute target mode');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    return { data, loading, error, executeTargetMode };
};