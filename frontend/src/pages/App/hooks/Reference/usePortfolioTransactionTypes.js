import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../useApi';

export function usePortfolioTransactionTypes() {
    const [transactionTypes, setTransactionTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchTransactionTypes = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/portfolio-transaction-types/`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                const data = await response.json();
                setTransactionTypes(data);
            } catch (err) {
                console.error("Failed to fetch transaction types:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactionTypes();
    }, []);

    return { transactionTypes, isLoading };
}