// useScenarioFinancialsProjections.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../hooks/useApi';

export const useScenarioFinancialsProjections = (fundId, scenarioId) => {
    const [gridData, setGridData] = useState([]); 
    const [years, setYears] = useState([]); 
    const [loading, setLoading] = useState(false);

    const fetchProjections = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/`
            );
            const rawData = res.data;

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
            console.error("Failed to fetch projections", err);
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    const put = useCallback(async (projectionId, payload) => {
        try {
            await axios.put(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/${projectionId}/`,
                payload
            );
            await fetchProjections();
        } catch (err) {
            console.error("PUT failed", err);
            throw err;
        }
    }, [fundId, scenarioId, fetchProjections]);

    const patch = useCallback(async (projectionId, payload) => {
        try {
            await axios.patch(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/${projectionId}/`,
                payload
            );
            await fetchProjections();
        } catch (err) {
            console.error("PATCH failed", err);
            throw err;
        }
    }, [fundId, scenarioId, fetchProjections]);

    const post = useCallback(async (payload) => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/financials-projections/`,
                {
                    fund: fundId,
                    scenario: scenarioId,
                    ...payload
                }
            );
            await fetchProjections();
        } catch (err) {
            console.error("POST failed", err);
            throw err;
        }
    }, [fundId, scenarioId, fetchProjections]);

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