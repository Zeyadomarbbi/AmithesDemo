import { useState, useEffect } from 'react';

const BASE_URL = "http://127.0.0.1:8000/api";

export function useFundDetails(fundId) {
    const [fund, setFund] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Only fetch if a valid ID exists
        if (!fundId) return;

        const fetchFund = async () => {
            setIsLoading(true);
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
        };

        fetchFund();
    }, [fundId]); // Re-fetch if the user switches funds in the sidebar

    return { fund, isLoading, error };
}