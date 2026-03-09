import React, { createContext, useContext } from 'react';
import { useTimeframes } from './useTimeframes';

const TimeframeContext = createContext(null);

export function TimeframeProvider({ fundId, children }) {
    const timeframes = useTimeframes(fundId);
    return (
        <TimeframeContext.Provider value={timeframes}>
            {children}
        </TimeframeContext.Provider>
    );
}

export function useTimeframeContext() {
    const ctx = useContext(TimeframeContext);
    if (!ctx) throw new Error('useTimeframeContext must be used within TimeframeProvider');
    return ctx;
}