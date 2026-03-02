import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../../../../../hooks/api/useApi";

export const useScenarioFinancialsProjections = (fundId, scenarioId) => {
    const api = useApi();
    const [gridData, setGridData] = useState([]); 
    const [years, setYears] = useState([]); 
    const [loading, setLoading] = useState(false);

    const fetchProjections = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        try {
            // api.get returns the data directly, no need for .data
            const rawData = await api.get(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/`
            );

            const uniqueYears = [...new Set(rawData.map(r => r.year))].sort((a, b) => a - b);
            setYears(uniqueYears);

            const pivotMap = {};

            rawData.forEach(item => {
                const rowId = item.line_item;

                if (!pivotMap[rowId]) {
                    pivotMap[rowId] = {
                        line_item_id: item.line_item,
                        line_item_name: item.line_item_name,
                        category: item.category_name,
                        special_field: item.special_field,
                        values: {}
                    };
                }
                
                pivotMap[rowId].values[item.year] = {
                    amount: item.amount,
                    id: item.projection_id,
                    status: item.status
                };
            });

            setGridData(Object.values(pivotMap));

        } catch (err) {
            console.error("Failed to fetch projections:", err.message);
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

    const put = useCallback(async (projectionId, payload) => {
        try {
            await api.put(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/${projectionId}/`,
                payload
            );
            await fetchProjections();
        } catch (err) {
            console.error("PUT failed:", err.message);
            throw err;
        }
    }, [fundId, scenarioId, api, fetchProjections]);

    const patch = useCallback(async (projectionId, payload) => {
        try {
            await api.patch(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/${projectionId}/`,
                payload
            );
            await fetchProjections();
        } catch (err) {
            console.error("PATCH failed:", err.message);
            throw err;
        }
    }, [fundId, scenarioId, api, fetchProjections]);

    const post = useCallback(async (payload) => {
        try {
            await api.post(
                `/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/`,
                {
                    fund: fundId,
                    scenario: scenarioId,
                    ...payload
                }
            );
            await fetchProjections();
        } catch (err) {
            console.error("POST failed:", err.message);
            throw err;
        }
    }, [fundId, scenarioId, api, fetchProjections]);

    useEffect(() => {
        fetchProjections();
    }, [fetchProjections]);

    return { 
        gridData, 
        years, 
        loading, 
        refresh: fetchProjections,
        put,
        patch,
        post
    };
};