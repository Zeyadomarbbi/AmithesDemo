// src/components/Table/SensitivityTable.jsx

import React, { useState } from 'react';
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

const SensitivityTable = () => {
    // State for MOIC inputs (X-Axis) - Moved here
    const [moicValues, setMoicValues] = useState(["1.75x", "1.90x", "2.00x", "2.50x"]);
    // State for Duration inputs (Y-Axis) - Moved here
    const [durationValues, setDurationValues] = useState(["4.25", "4.50", "4.75", "4.68", "5.00", "5.50"]);
    // Placeholder for the Net IRR results - Moved here
    const [irrData] = useState([
        ["6.78%", "7.40%", "8.21%", "9.50%"],
        ["6.57%", "7.25%", "8.02%", "9.12%"],
        ["6.32%", "7.10%", "7.85%", "8.65%"],
        ["6.18%", "6.87%", "7.54%", "8.54%"],
        ["6.04%", "6.57%", "7.36%", "8.23%"],
        ["5.76%", "6.34%", "7.14%", "7.69%"],
    ]);

    // Function to handle changes in MOIC inputs 
    const handleMoicChange = (index, value) => {
        setMoicValues(prev => prev.map((v, i) => i === index ? value : v));
    };
    
    // Function to handle changes in Duration inputs 
    const handleDurationChange = (index, value) => {
        setDurationValues(prev => prev.map((v, i) => i === index ? value : v));
    };

    return (
        <div className="sensitivity-main-grid">
            
            {/* A. Top-Left Axis Label Cell */}
            <div className="grid-cell moic-label-cell">
                <span className="moic-label-text">MOIC</span>
                <span className="duration-label-text">Duration (yrs)</span>
            </div>

            {/* B. MOIC INPUTS (X-Axis Header) */}
            {moicValues.map((val, index) => (
                <div key={`moic-cell-${index}`} className="moic-input grid-cell">
                    {/* Input element nested inside the grid cell for styling control */}
                    <StyledInput
                        className="moic-input-field"
                        value={val}
                        onChange={(e) => handleMoicChange(index, e.target.value)}
                        type="text" 
                    />
                </div>
            ))}

            {/* C. Duration Inputs (Y-Axis) and IRR Results (Data Grid) */}
            {durationValues.map((duration, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                    
                    {/* Y-Axis Input Cell (Duration) */}
                    <div className="duration-input grid-cell">
                        {/* Input element nested inside the grid cell for styling control */}
                        <StyledInput
                            className="duration-input-field"
                            value={duration}
                            onChange={(e) => handleDurationChange(rowIndex, e.target.value)}
                            type="text" 
                        />
                    </div>

                    {/* Main Data Cells (Net IRR Results) for this row */}
                    {irrData[rowIndex].map((irr, colIndex) => (
                        <div
                            key={`irr-${rowIndex}-${colIndex}`}
                            className="irr-result-cell grid-cell"
                        >
                            {irr}
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
};

export default SensitivityTable;