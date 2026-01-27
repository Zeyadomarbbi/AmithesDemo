import { useState, useEffect } from 'react';
import { API_BASE_URL } from './useApi';

export function usePhases() {
    const [phases, setPhases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPhases = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/phases/`);
                const data = await response.json();
                setPhases(data);
            } catch (err) {
                console.error("Failed to fetch phases:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPhases();
    }, []);

    return { phases, isLoading };
}