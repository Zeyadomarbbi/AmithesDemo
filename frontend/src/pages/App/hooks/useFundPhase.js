import { useState, useEffect } from 'react';

const BASE_URL = "http://127.0.0.1:8000/api";

export function usePhases() {
    const [phases, setPhases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPhases = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/phases/`);
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