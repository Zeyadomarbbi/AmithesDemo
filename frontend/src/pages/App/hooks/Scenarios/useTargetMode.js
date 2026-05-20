import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi"; // Adjust relative path as needed

export const useTargetMode = (fundId, scenarioId) => {
    const api = useApi();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeTargetMode = useCallback(async (payload) => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);

        try {
            // api.post handles base path, content-type, and returns data directly
            const result = await api.post(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/target-mode/`,
                payload
            );
            
            setData(result);
            return result;
        } catch (err) {
            // map backend responses to user-friendly messages
            const status = err.response?.status;
            const resData = err.response?.data;

            let userMessage;
            if (status === 404) {
                userMessage = resData?.error || 'Investment data not found for this scenario.';
            } else if (status === 422) {
                userMessage = resData?.error || 'Target value is mathematically unreachable with current deals.';
            } else if (status === 400) {
                userMessage = resData?.error || 'Invalid input parameters.';
            } else {
                userMessage = err.message || 'Calculation failed. Please try again.';
            }

            setError(userMessage);
            throw new Error(userMessage); 
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    return { data, loading, error, executeTargetMode };
};