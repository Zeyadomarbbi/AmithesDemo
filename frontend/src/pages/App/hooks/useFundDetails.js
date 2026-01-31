import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './useApi';


export function useFundDetails(fundId) {
    const [fund, setFund] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Wrap the fetch logic in useCallback so it can be reused
    const fetchData = useCallback(async () => {
        if (!fundId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/`);
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setFund(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [fundId]);

    // 2. Initial Fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 3. Return 'refetch' so components can call it manually
    return { fund, isLoading, error, refetch: fetchData };
}