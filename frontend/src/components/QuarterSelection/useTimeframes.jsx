import { useState, useEffect, useCallback } from 'react';

export function apiRowToQuarter(row) {
    return {
        id: row.timeframe_id,
        quarter: `Q${row.quarter}`,
        year: String(row.year),
        date: new Date(row.full_date).toLocaleDateString(),
        display_label: row.display_label,
        rawDate: row.full_date // Keep raw date for logic/comparison if needed
    };
}

export function useTimeframes(fundId) {
    const [quarters, setQuarters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuarters = useCallback(async () => {
        if (!fundId) return;
        try {
            setIsLoading(true);
            const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/timeframes/`);
            if (!response.ok) throw new Error("Failed to fetch");
            const rows = await response.json();
            setQuarters(rows.map(apiRowToQuarter));
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