import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../useApi';

export function useCountries() {
    const [countries, setCountries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCountries = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/countries/`);
                if (!response.ok) throw new Error('Failed to fetch countries');

                const data = await response.json();
                setCountries(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, []);

    return { countries, isLoading, error };
}