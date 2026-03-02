import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../../../../../../../../hooks/api/useApi";

/**
 * Hook to manage Management Fee Tranches using the centralized API engine
 * @param {number} fundId 
 * @param {number} scenarioId 
 */
export const useManFeeTranches = (fundId, scenarioId) => {
    const api = useApi();
    const [tranches, setTranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Fetch Tranches for specific Scenario
    const fetchTranches = useCallback(async () => {
        if (!fundId || !scenarioId) return;
        setLoading(true);
        try {
            // api.get handles base URL and returns data directly
            const data = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/`
            );
            setTranches(data);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to fetch tranches");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    useEffect(() => {
        fetchTranches();
    }, [fetchTranches]);

    // 2. Add New Tranche
    const addTranche = async (newTrancheData) => {
        try {
            const data = await api.post(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches//`,
                { ...newTrancheData, scenario_id: scenarioId }
            );
            setTranches(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error("Error adding tranche:", err.message);
            throw err;
        }
    };

    // 3. Update Existing Tranche
    const updateTranche = async (trancheId, updateData) => {
        try {
            const data = await api.patch(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/${trancheId}/`,
                updateData
            );
            setTranches(prev => prev.map(t => 
                t.tranche_id === trancheId ? data : t
            ));
            return data;
        } catch (err) {
            console.error("Error updating tranche:", err.message);
            throw err;
        }
    };

    // 4. Delete Tranche
    const deleteTranche = async (trancheId) => {
        try {
            await api.delete(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/${trancheId}/`
            );
            setTranches(prev => prev.filter(t => t.tranche_id !== trancheId));
        } catch (err) {
            console.error("Error deleting tranche:", err.message);
            throw err;
        }
    };

    return {
        tranches,
        loading,
        error,
        addTranche,
        updateTranche,
        deleteTranche,
        refresh: fetchTranches
    };
};