import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi"; 

export function apiRowToQuarter(row) {
    return {
        id: row.timeframe_id,
        quarter: `Q${row.quarter}`, 
        year: String(row.year),     
        date: new Date(row.date).toLocaleDateString(), 
        display_label: row.name,    
        rawDate: row.date
    };
}

export function useTimeframes(fundId) {
    const api = useApi();
    const [quarters, setQuarters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuarters = useCallback(async () => {
        if (!fundId) return;
        try {
            setIsLoading(true);
            const rows = await api.get(`/api/funds/${fundId}/timeframes/`);
            const sortedQuarters = rows
                .map(apiRowToQuarter)
                .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
            setQuarters(sortedQuarters);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fundId, api]);

    const saveTimeframe = async (timeframe) => {
        console.log("saveTimeframe payload:", timeframe);
        const isEdit = !!timeframe.id;
        const payload = {
            name: timeframe.name,
            date: timeframe.endDate 
        };

        const url = isEdit 
            ? `/api/funds/${fundId}/timeframes/${timeframe.id}/` 
            : `/api/funds/${fundId}/timeframes/`;
        
        const method = isEdit ? 'put' : 'post';
        const savedRow = await api[method](url, payload);
        const formatted = apiRowToQuarter(savedRow);

        setQuarters(prev => {
            const filtered = isEdit ? prev.filter(q => q.id !== timeframe.id) : prev;
            return [...filtered, formatted].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
        });

        return formatted;
    };

    const deleteTimeframe = async (timeframeId) => {
        await api.delete(`/api/funds/${fundId}/timeframes/${timeframeId}/`);
        setQuarters(prev => prev.filter(q => q.id !== timeframeId));
    };

    useEffect(() => {
        fetchQuarters();
    }, [fetchQuarters]);

    return { 
        quarters, 
        isLoading, 
        refresh: fetchQuarters, 
        saveTimeframe, // Unified Create/Update
        deleteTimeframe,
        setQuarters 
    };
}