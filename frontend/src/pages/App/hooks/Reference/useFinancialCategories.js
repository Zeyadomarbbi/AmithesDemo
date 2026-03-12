import { useState, useEffect } from 'react';
import useApi from "../../../../hooks/api/useApi";

export function useFinancialCategories() {
    const api = useApi();
    const [financialCategories, setFinancialCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchFinancialCategories = async () => {
            setIsLoading(true);
            try {
                // api.get handles API_BASE_URL and credentials internally
                const data = await api.get("/api/financial-categories/");
                setFinancialCategories(data);
            } catch (err) {
                console.error('Failed to fetch financial categories:', err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinancialCategories();
    }, [api]);

    return { financialCategories, isLoading };
}