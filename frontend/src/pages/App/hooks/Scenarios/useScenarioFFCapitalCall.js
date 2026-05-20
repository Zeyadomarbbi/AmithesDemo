import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi"; // Adjust relative path as needed

export const useScenarioFFCapitalCall = (fundId, scenarioId) => {
    const api = useApi();
    const [capitalCalls, setCapitalCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCapitalCalls = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);
        
        try {
            // api.get prepends API_BASE_URL and handles headers/credentials
            const data = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/`
            );
            setCapitalCalls(data);
        } catch (err) {
            console.error('Failed to fetch capital call summary:', err.message);
            setError(err.message || 'Failed to load capital call data');
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    useEffect(() => {
        fetchCapitalCalls();
    }, [fetchCapitalCalls]);

    // Create new custom projected date
    const createCustomDate = async (payload) => {
        try {
            const data = await api.post(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/`,
                payload
            );
            await fetchCapitalCalls(); // Refresh list
            return data;
        } catch (err) {
            console.error('Failed to create custom date:', err.message);
            throw err;
        }
    };

    // Update existing entry (date only for user-inserted)
    const updateEntry = async (summaryId, payload) => {
        try {
            const data = await api.patch(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/${summaryId}/`,
                payload
            );
            await fetchCapitalCalls(); // Refresh list
            return data;
        } catch (err) {
            console.error('Failed to update entry:', err.message);
            throw err;
        }
    };

    // Delete custom projected entry
    const deleteEntry = async (summaryId) => {
        try {
            await api.delete(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/${summaryId}/`
            );
            await fetchCapitalCalls(); // Refresh list
        } catch (err) {
            console.error('Failed to delete entry:', err.message);
            throw err;
        }
    };

    // Calculate totals
    const totals = capitalCalls.reduce(
        (acc, item) => ({
            flows: acc.flows + parseFloat(item.flows || 0),
            investment: acc.investment + parseFloat(item.investment || 0),
            management_fees: acc.management_fees + parseFloat(item.management_fees || 0),
            structuring_fees: acc.structuring_fees + parseFloat(item.structuring_fees || 0),
            dd_fees: acc.dd_fees + parseFloat(item.dd_fees || 0),
            opex: acc.opex + parseFloat(item.opex || 0),
            other_expenses: acc.other_expenses + parseFloat(item.other_expenses || 0),
            pct_capital_called: acc.pct_capital_called + parseFloat(item.pct_capital_called || 0)
        }),
        { flows: 0, investment: 0, management_fees: 0, structuring_fees: 0, dd_fees: 0, opex: 0, other_expenses: 0, pct_capital_called: 0 }
    );

    // Separate realized vs projected
    const realized = capitalCalls.filter(d => d.source_type === 'realized');
    const projected = capitalCalls.filter(d => d.source_type === 'projected_investment' || d.source_type === 'projected_custom');

    return {
        capitalCalls,
        realized,
        projected,
        totals,
        loading,
        error,
        refresh: fetchCapitalCalls,
        createCustomDate,
        updateEntry,
        deleteEntry
    };
};