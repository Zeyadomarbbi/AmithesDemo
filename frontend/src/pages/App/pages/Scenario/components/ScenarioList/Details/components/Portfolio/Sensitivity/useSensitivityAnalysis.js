import { useState, useCallback, useRef, useEffect } from 'react';
import useApi from "../../../../../../../../hooks/api/useApi";

export const useSensitivityAnalysis = (fundId, scenarioId) => {
    const api = useApi();
    const [matrixData, setMatrixData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchMatrix = useCallback(async (payload) => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);

        try {
            // api.post handles the base URL and returns response.data directly
            const response = await api.post(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/sensitivity/`, 
                payload
            );

            if (isMounted.current) {
                // Assuming backend structure: { matrix: [...] }
                setMatrixData(response.matrix || []);
            }
        } catch (err) {
            if (isMounted.current) {
                const errorMessage = err.message || "Failed to calculate sensitivity";
                setError(errorMessage);
                console.error("Sensitivity Hook Error:", err);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [fundId, scenarioId, api]);

    return { 
        matrixData, 
        loading, 
        error, 
        fetchMatrix,
        clearMatrix: () => setMatrixData([]) 
    };
};