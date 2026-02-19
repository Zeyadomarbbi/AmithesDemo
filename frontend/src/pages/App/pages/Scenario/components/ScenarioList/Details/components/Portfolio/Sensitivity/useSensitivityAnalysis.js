import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../hooks/useApi';

export const useSensitivityAnalysis = (fundId, scenarioId) => {
    const [matrixData, setMatrixData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Using a ref to track the component's mounted state
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchMatrix = useCallback(async (payload) => {
        // Guard against empty fund or scenario IDs
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);

        try {
            // Standardizing with your axios and API_BASE_URL
            const url = `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/sensitivity/`;
            
            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (isMounted.current) {
                // The backend should return a 5x5 matrix in response.data.matrix
                setMatrixData(response.data.matrix || []);
            }
        } catch (err) {
            if (isMounted.current) {
                const errorMessage = err.response?.data?.error || err.message || "Failed to calculate sensitivity";
                setError(errorMessage);
                console.error("Sensitivity Hook Error:", err);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [fundId, scenarioId]);

    // Return clear state for the Sensitivity UI
    return { 
        matrixData, 
        loading, 
        error, 
        fetchMatrix,
        // Optional: clear function to reset grid if needed
        clearMatrix: () => setMatrixData([]) 
    };
};