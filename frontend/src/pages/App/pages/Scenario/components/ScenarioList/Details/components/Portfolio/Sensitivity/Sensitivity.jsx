import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import SensitivityTableHeader from './Header/SensitivityTableHeader.jsx'; 
import SensitivityTable from './Table/SensitivityTable.jsx'; 
import './Sensitivity.css';

function Sensitivity({ rowData, fundId, scenarioId }) {
    const [moicCenter, setMoicCenter] = useState(parseFloat(rowData.input_moic) || 1.5);
    const [durationCenter, setDurationCenter] = useState(parseFloat(rowData.input_duration) || 5.0);
    const [moicStep, setMoicStep] = useState(0.5); 
    const [durationStep, setDurationStep] = useState(1.0); 

    const [matrixData, setMatrixData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSensitivityData = (mCenter, dCenter, mStep, dStep) => {
        setIsLoading(true);
        
        const payload = {
            investment_id: rowData.id,
            fund_id: fundId,
            scenario_id: scenarioId,
            moic_center: mCenter,
            duration_center: dCenter,
            moic_step: mStep,
            duration_step: dStep
        };

        console.log("Sensitivity Payload Data:", payload);

        setTimeout(() => {
            setMatrixData([]); 
            setIsLoading(false);
        }, 300);
    };

    const debouncedFetch = useCallback(
        debounce((mC, dC, mS, dS) => {
            fetchSensitivityData(mC, dC, mS, dS);
        }, 500),
        [fundId, scenarioId, rowData.id] 
    );

    useEffect(() => {
        debouncedFetch(moicCenter, durationCenter, moicStep, durationStep);
        return () => debouncedFetch.cancel(); 
    }, [moicCenter, durationCenter, moicStep, durationStep, debouncedFetch]);

    const handleCenterChange = (type, value) => {
        if (type === 'moic') setMoicCenter(value);
        if (type === 'duration') setDurationCenter(value);
    };

    return (
        <div className="sensitivity-table-wrapper">
            <SensitivityTableHeader 
                moicCenter={moicCenter}
                durationCenter={durationCenter}
                onCenterChange={handleCenterChange}
            />
            {isLoading ? (
                <div>Calculating Virtual Matrix...</div>
            ) : (
                <SensitivityTable data={matrixData} />
            )}
        </div>
    );
}

export default Sensitivity;