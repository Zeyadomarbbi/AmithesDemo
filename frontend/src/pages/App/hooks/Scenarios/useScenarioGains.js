import { useState, useEffect, useCallback } from 'react';
import useApi from "../api/useApi";

/**
 * Hook to fetch Scenario Gains (Valuation Summary)
 * Returns:
 * 1. gainsData: Detailed list (Investment per Year)
 * 2. annualGains: Aggregated totals per year (Realized vs Unrealized)
 */
export const useScenarioGains = (fundId, scenarioId) => {
    const api = useApi();
    const [gainsData, setGainsData] = useState([]);
    const [annualGains, setAnnualGains] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGains = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        try {
            // Use the centralized engine for credentials and CSRF
            const rawData = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/gains-summary/`
            );
            
            setGainsData(rawData);

            // --- AGGREGATION LOGIC ---
            const totalsMap = {};

            rawData.forEach(item => {
                const year = item.year;
                
                if (!totalsMap[year]) {
                    totalsMap[year] = { 
                        year: year, 
                        realized_amount: 0, 
                        unrealized_amount: 0 
                    };
                }

                totalsMap[year].realized_amount += parseFloat(item.realized_gain || 0);
                totalsMap[year].unrealized_amount += parseFloat(item.unrealized_gain || 0);
            });

            const sortedTotals = Object.values(totalsMap).sort((a, b) => a.year - b.year);
            setAnnualGains(sortedTotals);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch Scenario Gains", err);
            setError(err.message || "Failed to fetch gains data");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    useEffect(() => {
        fetchGains();
    }, [fetchGains]);

    return {
        gainsData,
        annualGains,
        loading,
        error,
        refresh: fetchGains
    };
};