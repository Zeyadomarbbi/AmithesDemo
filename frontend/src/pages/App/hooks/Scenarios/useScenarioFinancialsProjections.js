import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../useApi';

export const useScenarioFinancialsProjections = (fundId, scenarioId) => {
    const [gridData, setGridData] = useState([]); 
    const [years, setYears] = useState([]); 
    const [loading, setLoading] = useState(false);

    const fetchProjections = useCallback(async () => {
        if (!fundId || !scenarioId) return;

        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/funds/${fundId}/scenarios/${scenarioId}/projections/`);
            const rawData = res.data;

            // 1. Extract Unique Years
            const uniqueYears = [...new Set(rawData.map(r => r.year))].sort((a, b) => a - b);
            setYears(uniqueYears);

            // 2. Pivot
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
                
                // 3. Assign Value & Status (Automatic from API)
                pivotMap[rowId].values[item.year] = {
                    amount: item.amount,
                    id: item.projection_id, 
                    // The API now explicitly tells us the status
                    status: item.status 
                };
            });

            setGridData(Object.values(pivotMap));

        } catch (err) {
            console.error("Failed to fetch projections", err);
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]); // Dependencies simplified

    useEffect(() => {
        fetchProjections();
    }, [fetchProjections]);

    return { gridData, years, loading, refresh: fetchProjections };
};