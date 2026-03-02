import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../../../../../../hooks/api/useApi";

export const useMasterManFees = (fundId, scenarioId) => {
    const api = useApi();
    const [pivotedData, setPivotedData] = useState([]); 
    const [columns, setColumns] = useState([]);      
    const [annualTotals, setAnnualTotals] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!fundId || !scenarioId) return;
        
        setLoading(true);
        setError(null);

        try {
            // 1. Parallel Fetch using the api engine
            const [feeData, commitYearData] = await Promise.all([
                api.get(`/api/funds/${fundId}/scenario_list/${scenarioId}/master-man-fees/`),
                api.get(`/api/funds/${fundId}/man-fee-commitment-year/`)
            ]);

            // 2. Determine Start Year
            let startYear = new Date().getFullYear(); 
            if (commitYearData && commitYearData.commitment_from_year) {
                startYear = parseInt(commitYearData.commitment_from_year);
            }

            // 3. Process the results
            processData(feeData, startYear, 15);

        } catch (err) {
            console.error("Failed to fetch Master Man Fees:", err.message);
            setError("Failed to load fee data");
        } finally {
            setLoading(false);
        }
    }, [fundId, scenarioId, api]);

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
                    const amount = parseFloat(item.fee_amount || 0);
                    yearsMap[item.year][colKey] = amount;
                    yearsMap[item.year].total += amount;
                }
            });
        }

        // C. Sort Rows
        const sortedRows = Object.values(yearsMap).sort((a, b) => a.year - b.year);

        // D. Create Simplified Aggregates
        const simpleTotals = sortedRows.map(row => ({
            year: row.year,
            total_amount: row.total
        }));

        // E. Sort Columns
        const typeOrder = { 'Share Class': 1, 'Tranche': 2, 'Portfolio': 3 };
        const sortedColumns = Array.from(uniqueEntities.values()).sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) {
                return typeOrder[a.type] - typeOrder[b.type];
            }
            return a.label.localeCompare(b.label);
        });

        setPivotedData(sortedRows);
        setAnnualTotals(simpleTotals);
        setColumns(sortedColumns);
    };

    return { 
        pivotedData,   
        columns,       
        annualTotals,  
        loading, 
        error, 
        refresh: fetchData 
    };
};