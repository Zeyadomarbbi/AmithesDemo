import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import SensitivityTable from './Table/SensitivityTable.jsx'; 
import { useShareClasses } from '../../../../../../../../hooks/useShareClass.js';
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

    const [matrixData, setMatrixData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data: shareClasses } = useShareClasses(fundId);

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

    const fetchSensitivityData = (mValues, dValues) => {
        setIsLoading(true);
        
        const payload = {
            investment_id: rowData.id,
            fund_id: fundId,
            scenario_id: scenarioId,
            moic_inputs: mValues.map(v => parseFloat(v) || 0),
            duration_inputs: dValues.map(v => parseFloat(v) || 0)
        };

        console.log("DEBOUNCE FIRED - Payload Data:", payload);

        setTimeout(() => {
            const mockResponse = {};
            // Mock changing data based on first input just to see UI react
            const mockVal = `${parseFloat(mValues[0] || 0) + 10}%`; 
            const mockMatrix = new Array(5).fill(0).map(() => new Array(5).fill(mockVal));
            
            kpiOptions.forEach(opt => {
                mockResponse[opt.value] = mockMatrix;
            });

            setMatrixData(mockResponse); 
            setIsLoading(false);
        }, 300);
    };

    const debouncedFetch = useCallback(
        debounce((m, d) => {
            fetchSensitivityData(m, d);
        }, 2000),
        [fundId, scenarioId, rowData.id, kpiOptions] 
    );

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
                isLoading={isLoading}
                moicValues={moicValues}
                durationValues={durationValues}
                onMoicChange={handleMoicChange}
                onDurationChange={handleDurationChange}
            />
        </div>
    );
}

export default Sensitivity;