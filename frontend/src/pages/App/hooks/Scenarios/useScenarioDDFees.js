import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

/**
 * Hook to manage Scenario Due Diligence Fees
 * @param {number} fundId 
 * @param {number} scenarioId 
 */
export const useScenarioDDFees = (fundId, scenarioId) => {
    const [ddFees, setDDFees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Fetch Fees for specific Scenario
    const fetchDDFees = useCallback(async () => {
        if (!fundId || !scenarioId) return;
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/dd-fees/`
            );
            setDDFees(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data || "Failed to fetch DD fees");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    useEffect(() => {
        fetchDDFees();
    }, [fetchDDFees]);

    // 2. Update Fee Percentages (PATCH)
    const updateFeeRate = async (ddFeeId, patchData) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/dd-fees/${ddFeeId}/`,
                patchData
            );
            
            // Sync local state with backend-calculated amounts from triggers
            setDDFees(prev => prev.map(fee => 
                fee.dd_fee_id === ddFeeId ? response.data : fee
            ));
            return response.data;
        } catch (err) {
            console.error("Update DD Fee failed", err);
            throw err;
        }
    };

    // 3. Logic helper for UI cell states
    const getFeeStatus = (fee, type = 'entry') => {
        const isSunk = type === 'entry' ? fee.is_entry_sunk : fee.is_exit_sunk;
        if (isSunk) {
            return {
                label: type === 'entry' ? "In Portfolio" : "Sold",
                disabled: true,
                className: "bg-gray-100 text-gray-400 italic cursor-not-allowed"
            };
        }
        return {
            label: null,
            disabled: false,
            className: "bg-white text-black"
        };
    };

    return {
        ddFees,
        loading,
        error,
        updateFeeRate,
        getFeeStatus,
        refresh: fetchDDFees
    };
};