// useScenarioFFCapitalCall.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../hooks/useApi';

export const useScenarioFFCapitalCall = (fundId, scenarioId) => {
    const [capitalCalls, setCapitalCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCapitalCalls = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/`
            );
            setCapitalCalls(response.data);
        } catch (err) {
            console.error('Failed to fetch capital call summary:', err);
            setError(err.message || 'Failed to load capital call data');
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    useEffect(() => {
        fetchCapitalCalls();
    }, [fetchCapitalCalls]);

    // Create new custom projected date
    const createCustomDate = async (payload) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/`,
                payload
            );
            await fetchCapitalCalls(); // Refresh list
            return response.data;
        } catch (err) {
            console.error('Failed to create custom date:', err);
            throw err;
        }
    };

    // Update existing entry (date only for user-inserted)
    const updateEntry = async (summaryId, payload) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/${summaryId}/`,
                payload
            );
            await fetchCapitalCalls(); // Refresh list
            return response.data;
        } catch (err) {
            console.error('Failed to update entry:', err);
            throw err;
        }
    };

    // Delete custom projected entry
    const deleteEntry = async (summaryId) => {
        try {
            await axios.delete(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/ff-capitalcall-summary/${summaryId}/`
            );
            await fetchCapitalCalls(); // Refresh list
        } catch (err) {
            console.error('Failed to delete entry:', err);
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