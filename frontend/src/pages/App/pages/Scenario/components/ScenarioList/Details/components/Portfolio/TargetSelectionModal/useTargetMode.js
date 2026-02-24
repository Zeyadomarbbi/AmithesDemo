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
            const resData = err.response?.data;
            const status = err.response?.status;

            let userMessage;
            if (status === 404) {
                userMessage = resData?.error || 'Investment data not found for this scenario.';
            } else if (status === 422) {
                userMessage = resData?.error || 'Target value is mathematically unreachable with current deals.';
            } else if (status === 400) {
                userMessage = resData?.error || 'Invalid input parameters.';
            } else {
                userMessage = resData?.error || 'Calculation failed. Please try again.';
            }

            setError(userMessage);
            throw new Error(userMessage); // re-throw with clean message
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    return { data, loading, error, executeTargetMode };
};