import { useState, useEffect, useCallback } from 'react';
import useApi from "../api/useApi"; 

/**
 * Maps the Backend Timeframe model to the Frontend display format
 */
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

/**
 * RESTORED: Standalone persistence helper
 * Now requires the 'api' instance to be passed in.
 */
export async function saveNewTimeframe(api, fundId, timeframe) {
    const payload = {
        name: timeframe.name, 
        date: timeframe.endDate instanceof Date 
            ? timeframe.endDate.toISOString().split('T')[0] 
            : timeframe.endDate
    };
    
    const savedRow = await api.post(`/api/funds/${fundId}/timeframes/`, payload);
    return apiRowToQuarter(savedRow);
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
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setQuarters(sortedQuarters);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fundId, api]);

    /**
     * Helper to add a timeframe and update local state immediately
     */
    const addTimeframe = async (timeframe) => {
        const formatted = await saveNewTimeframe(api, fundId, timeframe);
        setQuarters(prev => [...prev, formatted].sort((a, b) => new Date(a.date) - new Date(b.date)));
        return formatted;
    };

    useEffect(() => {
        fetchQuarters();
    }, [fetchQuarters]);

    return { 
        quarters, 
        isLoading, 
        refresh: fetchQuarters, 
        addTimeframe, 
        setQuarters 
    };
}

export function useTimeframeNavigation(location, navigate) {
    const toggleTimeframe = useCallback((selectedIds, timeframeId) => {
        const newIds = selectedIds.includes(timeframeId)
            ? selectedIds.filter(id => id !== timeframeId)
            : [...selectedIds, timeframeId];
        
        const validIds = newIds.filter(id => id > 0); 
        
        if (validIds.length > 0) {
            navigate(`${location.pathname}?timeframes=${validIds.join(",")}`);
        } else {
            navigate(location.pathname); 
        }
    }, [location.pathname, navigate]);

    return { toggleTimeframe };
}