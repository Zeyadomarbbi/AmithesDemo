import { useState, useEffect } from 'react';
import useApi from "../api/useApi";

export function useCurrencies() {
    const api = useApi();
    const [currencies, setCurrencies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrencies = async () => {
            setIsLoading(true);
            try {
                // api.get handles API_BASE_URL and session credentials
                const data = await api.get("/api/currencies/");
                setCurrencies(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrencies();
    }, [api]);

    return { currencies, isLoading, error };
}