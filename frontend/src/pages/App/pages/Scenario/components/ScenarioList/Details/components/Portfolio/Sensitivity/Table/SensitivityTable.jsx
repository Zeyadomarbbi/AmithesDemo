import React, { useState, useMemo } from 'react';
import './SensitivityTable.css';

// Helper component for styled input fields (MOIC and Duration axes)
const StyledInput = ({ value, onChange, className, type = "text" }) => (
    <input
        className={className}
        value={value}
        onChange={onChange}
        type={type}
    />
);

const SensitivityTable = ({ data = [] }) => {
    // 1. Initialize X-Axis (MOIC) with 5 default values (0)
    const [moicValues, setMoicValues] = useState(new Array(5).fill("0.00x"));
    
    // 2. Initialize Y-Axis (Duration) with 5 default values (0)
    const [durationValues, setDurationValues] = useState(new Array(5).fill("0.00"));

    // 3. IRR Data Logic: Use props if available, otherwise 5x5 matrix of 0%
    const displayData = useMemo(() => {
        if (data && data.length > 0) return data;
        return new Array(5).fill(0).map(() => new Array(5).fill("0.00%"));
    }, [data]);

    const handleMoicChange = (index, value) => {
        setMoicValues(prev => prev.map((v, i) => i === index ? value : v));
    };
    
    const handleDurationChange = (index, value) => {
        setDurationValues(prev => prev.map((v, i) => i === index ? value : v));
    };

    return (
        <div className="sensitivity-main-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(6, 1fr)` // 1 for label + 5 for inputs
        }}>
            
            {/* A. Top-Left Axis Label Cell */}
            <div className="grid-cell moic-label-cell">
                <span className="moic-label-text">MOIC</span>
                <span className="duration-label-text">Duration (yrs)</span>
            </div>

            {/* B. MOIC INPUTS (X-Axis Header) - 5 Cells */}
            {moicValues.map((val, index) => (
                <div key={`moic-cell-${index}`} className="moic-input grid-cell">
                    <StyledInput
                        className="moic-input-field"
                        value={val}
                        onChange={(e) => handleMoicChange(index, e.target.value)}
                    />
                </div>
            ))}

            {/* C. Duration Inputs (Y-Axis) and Results - 5 Rows */}
            {durationValues.map((duration, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                    
                    {/* Y-Axis Input Cell (Duration) */}
                    <div className="moic-input grid-cell">
                        <StyledInput
                            className="moic-input-field"
                            value={duration}
                            onChange={(e) => handleDurationChange(rowIndex, e.target.value)}
                        />
                    </div>

                    {/* Main Data Cells (Results) - 5 Columns per row */}
                    {displayData[rowIndex].map((val, colIndex) => (
                        <div
                            key={`result-${rowIndex}-${colIndex}`}
                            className="irr-result-cell grid-cell"
                        >
                            {val}
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
};

export default SensitivityTable;