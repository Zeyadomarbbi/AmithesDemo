import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import SensitivityTable from './Table/SensitivityTable.jsx'; 
import { useShareClasses } from '../../../../../../../../hooks/useShareClass.js';
import { useSensitivityAnalysis } from './useSensitivityAnalysis.js'; // Adjust path if needed
import './Sensitivity.css';

function Sensitivity({ rowData, fundId, scenarioId, isClosing }) {
    const baseMoic = parseFloat(rowData.input_moic) || 1.5;
    const baseDur = parseFloat(rowData.input_duration) || 5.0;
    const mStep = 0.5;
    const dStep = 1.0;

    // Initialize 5x5 axes based on base values
    const [moicValues, setMoicValues] = useState([
        (baseMoic - mStep * 2).toFixed(2),
        (baseMoic - mStep).toFixed(2),
        baseMoic.toFixed(2),
        (baseMoic + mStep).toFixed(2),
        (baseMoic + mStep * 2).toFixed(2)
    ]);

    const [durationValues, setDurationValues] = useState([
        (baseDur - dStep * 2).toFixed(2),
        (baseDur - dStep).toFixed(2),
        baseDur.toFixed(2),
        (baseDur + dStep).toFixed(2),
        (baseDur + dStep * 2).toFixed(2)
    ]);

    // 1. Fetch Dynamic Share Classes
    const { data: shareClasses } = useShareClasses(fundId);

    // 2. Initialize the Sensitivity Hook
    const { matrixData, loading, fetchMatrix } = useSensitivityAnalysis(fundId, scenarioId);
    const kpiOptions = useMemo(() => {
        const baseOptions = [
            { label: "Portfolio IRR", value: "portfolio_irr" },
            { label: "Fund IRR Net", value: "fund_irr_net" },
            { label: "Fund IRR Gross", value: "fund_irr_gross" }
        ];

        const dynamicOptions = (shareClasses || []).map(sc => {
            const className = sc.name || sc.share_class_name || "Unknown";
            return {
                label: `${className} IRR`,
                value: `irr_${className.replace(/\s+/g, '_').toLowerCase()}`
            };
        });

        return [...baseOptions, ...dynamicOptions];
    }, [shareClasses]);

    // 3. Bind the Hook to the Debounce
    const debouncedFetch = useCallback(
        debounce((m, d) => {
            const payload = {
                investment_id: rowData.id,
                moic_inputs: m.map(v => parseFloat(v) || 0),
                duration_inputs: d.map(v => parseFloat(v) || 0)
            };
            console.log("DEBOUNCE FIRED - Sending Payload to Hook:", payload);
            fetchMatrix(payload);
        }, 2000), // 2-second debounce
        [rowData.id, fetchMatrix] 
    );

    // 4. Trigger Debounce on input change
    useEffect(() => {
        debouncedFetch(moicValues, durationValues);
        return () => debouncedFetch.cancel(); 
    }, [moicValues, durationValues, debouncedFetch]);

    const handleMoicChange = (index, value) => {
        setMoicValues(prev => prev.map((v, i) => i === index ? value : v));
    };

    const handleDurationChange = (index, value) => {
        setDurationValues(prev => prev.map((v, i) => i === index ? value : v));
    };

    return (
        <div className={`sensitivity-table-wrapper ${isClosing ? 'sensitivity-table-closing' : ''}`}>
            <SensitivityTable 
                data={matrixData} 
                kpiOptions={kpiOptions}
                isLoading={loading} // Use hook's loading state
                moicValues={moicValues}
                durationValues={durationValues}
                onMoicChange={handleMoicChange}
                onDurationChange={handleDurationChange}
            />
        </div>
    );
}

export default Sensitivity;