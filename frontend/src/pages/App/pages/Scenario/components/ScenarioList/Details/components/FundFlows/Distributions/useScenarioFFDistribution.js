import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../../../../../../../hooks/api/useApi";

export const useScenarioFFDistribution = (fundId, scenarioId) => {
    const api = useApi();
    const [distributions, setDistributions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDistributions = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        setError(null);
        
        try {
            // api.get handles API_BASE_URL and returns data directly
            const data = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/ff-distribution-summary/`
            );
            setDistributions(data);
        } catch (err) {
            console.error('Failed to fetch distribution summary:', err.message);
            setError(err.message || 'Failed to load distribution data');
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    useEffect(() => {
        fetchDistributions();
    }, [fetchDistributions]);

    // Calculate totals
    const totals = distributions.reduce(
        (acc, item) => ({
            flows: acc.flows + parseFloat(item.flows || 0),
            divestment: acc.divestment + parseFloat(item.divestment || 0),
            dividends: acc.dividends + parseFloat(item.dividends || 0),
            interests: acc.interests + parseFloat(item.interests || 0),
            other: acc.other + parseFloat(item.other || 0),
            pct_distributed: acc.pct_distributed + parseFloat(item.pct_distributed || 0)
        }),
        { flows: 0, divestment: 0, dividends: 0, interests: 0, other: 0, pct_distributed: 0 }
    );

    // Separate realized vs projected
    const realized = distributions.filter(d => d.source_type === 'realized');
    const projected = distributions.filter(d => d.source_type === 'projected');

    return {
        distributions,
        realized,
        projected,
        totals,
        loading,
        error,
        refresh: fetchDistributions
    };
};