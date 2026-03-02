import { useState, useEffect } from 'react';
import useApi from "../api/useApi";

export function usePortfolioTransactionTypes() {
    const api = useApi();
    const [transactionTypes, setTransactionTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchTransactionTypes = async () => {
            setIsLoading(true);
            try {
                // api.get prepends API_BASE_URL and attaches credentials
                const data = await api.get("/api/portfolio-transaction-types/");
                setTransactionTypes(data);
            } catch (err) {
                console.error("Failed to fetch transaction types:", err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactionTypes();
    }, [api]);

    return { transactionTypes, isLoading };
}