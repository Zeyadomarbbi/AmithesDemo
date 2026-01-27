import { useState, useEffect, useCallback } from 'react';

const BASE_URL = 'https://dual-pam-bbi-59551b8d.koyeb.app';

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
            const response = await fetch(`${BASE_URL}/funds/${fundId}/`);
            
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