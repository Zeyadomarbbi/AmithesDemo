import { useState, useEffect } from 'react';
import useApi from "../api/useApi";

export function usePhases() {
    const api = useApi();
    const [phases, setPhases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPhases = async () => {
            setIsLoading(true);
            try {
                // api.get handles API_BASE_URL and credentials internally
                const data = await api.get("/api/fund-phases/");
                setPhases(data);
            } catch (err) {
                console.error("Failed to fetch phases:", err.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchPhases();
    }, [api]);

    return { phases, isLoading };
}