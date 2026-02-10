import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from "../useApi";

/**
 * Maps the Backend Timeframe model to the Frontend display format
 */
export function apiRowToQuarter(row) {
    return {
        id: row.timeframe_id,
        quarter: `Q${row.quarter}`, // Backend returns integer, we add 'Q'
        year: String(row.year),     // Backend returns integer
        date: new Date(row.date).toLocaleDateString(), // row.date matches backend
        display_label: row.name,    // row.name matches backend
        rawDate: row.date
    };
}

export function useTimeframes(fundId) {
    const [quarters, setQuarters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuarters = useCallback(async () => {
        if (!fundId) return;
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/timeframes/`);
            if (!response.ok) throw new Error("Failed to fetch");
            
            const rows = await response.json();
            
            // Sort Ascending: Oldest (Top) -> Newest (Bottom)
            const sortedQuarters = rows
                .map(apiRowToQuarter)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setQuarters(sortedQuarters);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fundId]);

    useEffect(() => {
        fetchQuarters();
    }, [fetchQuarters]);

    return { quarters, isLoading, refresh: fetchQuarters, setQuarters };
}

/**
 * Persistence helper for creating new Timeframes
 */
export async function saveNewTimeframe(fundId, timeframe) {
    const payload = {
        // 'fund' is read_only in serializer but handled by fund_id in view.post
        // We send name and date to match Serializer.fields
        name: timeframe.name, 
        date: timeframe.endDate instanceof Date 
            ? timeframe.endDate.toISOString().split('T')[0] 
            : timeframe.endDate
    };
    
    const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/timeframes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw errorData; 
    }
    
    const savedRow = await response.json();
    return apiRowToQuarter(savedRow);
}

export function useTimeframeNavigation(location, navigate) {
    const toggleTimeframe = useCallback((selectedIds, timeframeId) => {
        const newIds = selectedIds.includes(timeframeId)
            ? selectedIds.filter(id => id !== timeframeId)
            : [...selectedIds, timeframeId];
        
        const validIds = newIds.filter(id => id > 0); // Clean before writing
        
        if (validIds.length > 0) {
            navigate(`${location.pathname}?timeframes=${validIds.join(",")}`);
        } else {
            navigate(location.pathname); // Remove param if empty
        }
    }, [location.pathname, navigate]);

    return { toggleTimeframe };
}