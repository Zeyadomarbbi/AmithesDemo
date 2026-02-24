import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../../hooks/useApi';

/**
 * Hook to manage Management Fee Tranches
 * @param {number} fundId 
 * @param {number} scenarioId 
 */
export const useManFeeTranches = (fundId, scenarioId) => {
    const [tranches, setTranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Fetch Tranches for specific Scenario
    const fetchTranches = useCallback(async () => {
        if (!fundId || !scenarioId) return;
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/`
            );
            setTranches(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data || "Failed to fetch tranches");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    useEffect(() => {
        fetchTranches();
    }, [fetchTranches]);

    // 2. Add New Tranche
    const addTranche = async (newTrancheData) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/`,
                { ...newTrancheData, scenario_id: scenarioId }
            );
            setTranches(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            console.error("Error adding tranche:", err);
            throw err;
        }
    };

    // 3. Update Existing Tranche
    const updateTranche = async (trancheId, updateData) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/${trancheId}/`,
                updateData
            );
            setTranches(prev => prev.map(t => 
                t.tranche_id === trancheId ? response.data : t
            ));
            return response.data;
        } catch (err) {
            console.error("Error updating tranche:", err);
            throw err;
        }
    };

    // 4. Delete Tranche
    const deleteTranche = async (trancheId) => {
        try {
            await axios.delete(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/man-fee-tranches/${trancheId}/`
            );
            setTranches(prev => prev.filter(t => t.tranche_id !== trancheId));
        } catch (err) {
            console.error("Error deleting tranche:", err);
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