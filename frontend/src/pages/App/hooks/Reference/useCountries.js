import { useState, useEffect } from 'react';
import useApi from "../api/useApi";

export function useCountries() {
    const api = useApi();
    const [countries, setCountries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCountries = async () => {
            setIsLoading(true);
            try {
                // api.get handles API_BASE_URL and credentials internally
                const data = await api.get("/api/countries/");
                setCountries(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, [api]);

    return { countries, isLoading, error };
}