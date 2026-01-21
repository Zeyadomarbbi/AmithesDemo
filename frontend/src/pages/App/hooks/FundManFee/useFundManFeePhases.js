import { useState, useEffect } from "react";

const BASE_URL = "http://127.0.0.1:8000/api";

export function useManagementFeePhases() {
    const [phases, setPhases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPhases = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${BASE_URL}/management-fee-phases/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch management fee phases");
                }

                const data = await response.json();
                setPhases(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPhases();
    }, []);

    return {
        phases,
        isLoading,
        error,
    };
}
