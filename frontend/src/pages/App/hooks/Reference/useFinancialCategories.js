import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../useApi';

export function useFinancialCategories() {
    const [financialCategories, setFinancialCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchFinancialCategories = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/financial-categories/`
                );
                const data = await response.json();
                setFinancialCategories(data);
            } catch (err) {
                console.error('Failed to fetch financial categories:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinancialCategories();
    }, []);

    return { financialCategories, isLoading };
}
