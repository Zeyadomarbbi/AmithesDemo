import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../../hooks/useApi';

export const useMasterManFees = (fundId, scenarioId) => {
    const [pivotedData, setPivotedData] = useState([]); 
    const [columns, setColumns] = useState([]);      
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!fundId || !scenarioId) return;
        
        setLoading(true);
        try {
            // 1. Parallel Fetch: Fee Data AND The Commitment Year Definition
            const [feeRes, commitYearRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/funds/${fundId}/scenario_list/${scenarioId}/master-man-fees/`),
                axios.get(`${API_BASE_URL}/api/funds/${fundId}/man-fee-commitment-year/`)
            ]);

            // --- DEBUG LOGS ---
            
            // 2. Determine Start Year
            let startYear = new Date().getFullYear(); // Default
            if (commitYearRes.status === 'fulfilled' && commitYearRes.value.data) {
                // Use the explicit Year column from your derived table
                if (commitYearRes.value.data.commitment_from_year) {
                    startYear = parseInt(commitYearRes.value.data.commitment_from_year);
                }
            } else {
                console.warn("Could not fetch Commitment Year table (Phase 1 not set?)");
            }


            // 3. Process Fee Data
            if (feeRes.status === 'fulfilled') {
                processData(feeRes.value.data, startYear, 15);
            } else {
                throw new Error(feeRes.reason);
            }
            
            console.groupEnd();
            setError(null);

        } catch (err) {
            console.error("Failed to fetch Master Man Fees", err);
            setError("Failed to load fee data");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const processData = (data, startYear, duration) => {
        // A. Generate Skeleton (Start Year -> +15 Years)
        const yearsMap = {};
        for (let i = 0; i < duration; i++) {
            const currentYear = startYear + i;
            yearsMap[currentYear] = { year: currentYear, total: 0 };
        }

        const uniqueEntities = new Map(); 

        // B. Fill Data
        if (data && data.length > 0) {
            data.forEach(item => {
                const colKey = `${item.entity_type} - ${item.entity_name}`;
                
                if (!uniqueEntities.has(colKey)) {
                    uniqueEntities.set(colKey, {
                        label: item.entity_name,
                        type: item.entity_type,
                        key: colKey
                    });
                }

                if (yearsMap[item.year]) {
                    yearsMap[item.year][colKey] = parseFloat(item.fee_amount);
                    yearsMap[item.year].total += parseFloat(item.fee_amount);
                }
            });
        }

        // C. Sort Rows
        const sortedRows = Object.values(yearsMap).sort((a, b) => a.year - b.year);

        // D. Sort Columns
        const typeOrder = { 'Share Class': 1, 'Tranche': 2, 'Portfolio': 3 };
        const sortedColumns = Array.from(uniqueEntities.values()).sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) {
                return typeOrder[a.type] - typeOrder[b.type];
            }
            return a.label.localeCompare(b.label);
        });

        setPivotedData(sortedRows);
        setColumns(sortedColumns);
    };

    return { pivotedData, columns, loading, error, refresh: fetchData };
};