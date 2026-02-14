import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi'; // Adjust path

/**
 * Hook to fetch Scenario Gains (Valuation Summary)
 * Returns:
 * 1. gainsData: Detailed list (Investment per Year)
 * 2. annualGains: Aggregated totals per year (Realized vs Unrealized)
 */
export const useScenarioGains = (fundId, scenarioId) => {
    const [gainsData, setGainsData] = useState([]);
    const [annualGains, setAnnualGains] = useState([]); // <--- Aggregated State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGains = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/gains-summary/`
            );
            
            const rawData = response.data;
            setGainsData(rawData);

            // --- AGGREGATION LOGIC ---
            // Group by Year -> Sum Realized & Unrealized
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

                // Parse floats to ensure math works (API sends strings for decimals)
                totalsMap[year].realized_amount += parseFloat(item.realized_gain || 0);
                totalsMap[year].unrealized_amount += parseFloat(item.unrealized_gain || 0);
            });

            // Convert to Sorted Array
            const sortedTotals = Object.values(totalsMap).sort((a, b) => a.year - b.year);
            setAnnualGains(sortedTotals);
            // -------------------------

            setError(null);
        } catch (err) {
            console.error("Failed to fetch Scenario Gains", err);
            setError(err.response?.data || "Failed to fetch gains data");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    useEffect(() => {
        fetchGains();
    }, [fetchGains]);

    return {
        gainsData,   // Detailed rows (Investment A - 2024, Investment A - 2025...)
        annualGains, // Aggregated [{ year: 2024, realized_amount: 100, unrealized_amount: 50 }, ...]
        loading,
        error,
        refresh: fetchGains
    };
};