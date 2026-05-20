import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

/**
 * Hook to manage Scenario Due Diligence Fees
 * Includes annual aggregation logic.
 */
export const useScenarioDDFees = (fundId, scenarioId) => {
    const api = useApi();
    const [ddFees, setDDFees] = useState([]);
    const [annualTotals, setAnnualTotals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Fetch Fees for specific Scenario
    const fetchDDFees = useCallback(async () => {
        if (!fundId || !scenarioId) return;
        setLoading(true);
        try {
            const data = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/dd-fees/`
            );
            setDDFees(data);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to fetch DD fees");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    useEffect(() => {
        fetchDDFees();
    }, [fetchDDFees]);

    // ---------------------------------------------------------
    // Aggregation Logic: Calculate Annual Totals
    // ---------------------------------------------------------
    useEffect(() => {
        if (!ddFees || ddFees.length === 0) {
            setAnnualTotals([]);
            return;
        }

        const totalsMap = {};

        ddFees.forEach(fee => {
            // A. Process Entry Amount
            if (fee.entry_date && fee.entry_amount) {
                const year = parseInt(fee.entry_date.split('-')[0]);
                const amount = parseFloat(fee.entry_amount) || 0;
                totalsMap[year] = (totalsMap[year] || 0) + amount;
            }

            // B. Process Exit Amount
            if (fee.exit_date && fee.exit_amount) {
                const year = parseInt(fee.exit_date.split('-')[0]);
                const amount = parseFloat(fee.exit_amount) || 0;
                totalsMap[year] = (totalsMap[year] || 0) + amount;
            }
        });

        const sortedTotals = Object.keys(totalsMap)
            .map(year => ({
                year: parseInt(year),
                total_amount: totalsMap[year]
            }))
            .sort((a, b) => a.year - b.year);

        setAnnualTotals(sortedTotals);
    }, [ddFees]);

    // 2. Update Fee Percentages (PATCH)
    const updateFeeRate = async (ddFeeId, patchData) => {
        try {
            const data = await api.patch(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/dd-fees/${ddFeeId}/`,
                patchData
            );
            
            // Sync local state with backend-calculated amounts
            setDDFees(prev => prev.map(fee => 
                fee.dd_fee_id === ddFeeId ? data : fee
            ));
            return data;
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
        annualTotals,
        loading,
        error,
        updateFeeRate,
        getFeeStatus,
        refresh: fetchDDFees
    };
};