import { useState, useEffect } from 'react';

const BASE_URL = 'https://dual-pam-bbi-59551b8d.koyeb.app';

export function useCurrencies() {
    const [currencies, setCurrencies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrencies = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/currencies/`);
                if (!response.ok) throw new Error("Failed to fetch currencies");
                
                const data = await response.json();
                setCurrencies(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrencies();
    }, []);

    return { currencies, isLoading, error };
}