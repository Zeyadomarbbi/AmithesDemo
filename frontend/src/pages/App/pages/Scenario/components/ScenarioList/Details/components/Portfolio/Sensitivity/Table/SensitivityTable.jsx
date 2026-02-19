import React, { useState, useMemo } from 'react';
import { ChevronDownIcon } from '../../Icons';
import './SensitivityTable.css';

const StyledInput = ({ value, onChange, className, type = "text" }) => (
    <input
        className={className}
        value={value}
        onChange={onChange}
        type={type}
    />
);

const SensitivityTable = ({ data = [] }) => {
    const [moicValues, setMoicValues] = useState(new Array(5).fill("0.00x"));
    const [durationValues, setDurationValues] = useState(new Array(5).fill("0.00"));
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    const handleNetIRRChange = (e) => {
        // handler placeholder
    };

    return (
        <div className="sensitivity-wrapper">
            {/* Header */}
            <div className="sensitivity-header-wrapper">
                <span className="sensitivity-title-text">Sensitivity table</span>
                <div className="sensitivity-controls-group">
                    <div className="sensitivity-header-dropdown-container">
                        <select 
                            className="sensitivity-header-control-dropdown" 
                            onChange={(e) => {
                                setIsDropdownOpen(false);
                                handleNetIRRChange(e);
                            }}
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            onBlur={() => setIsDropdownOpen(false)}
                        >
                            <option>Net IRR</option>
                        </select>
                        <span className={`sensitivity-dropdown-icon ${isDropdownOpen ? 'sensitivity-dropdown-icon--open' : ''}`}>
                            <ChevronDownIcon />
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="sensitivity-main-grid">

                {/* A. Top-Left Axis Label Cell */}
                <div className="sensitivity-grid-cell sensitivity-moic-label-cell">
                    <span className="sensitivity-moic-label-text">MOIC</span>
                    <span className="sensitivity-duration-label-text">Duration (yrs)</span>
                </div>

                {/* B. MOIC Inputs (X-Axis Header) */}
                {moicValues.map((val, index) => (
                    <div key={`moic-cell-${index}`} className="sensitivity-moic-input sensitivity-grid-cell">
                        <StyledInput
                            className="sensitivity-moic-input-field"
                            value={val}
                            onChange={(e) => handleMoicChange(index, e.target.value)}
                        />
                    </div>
                ))}

                {/* C. Duration Inputs (Y-Axis) + Result Rows */}
                {durationValues.map((duration, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                        <div className="sensitivity-moic-input sensitivity-grid-cell">
                            <StyledInput
                                className="sensitivity-moic-input-field"
                                value={duration}
                                onChange={(e) => handleDurationChange(rowIndex, e.target.value)}
                            />
                        </div>
                        {displayData[rowIndex].map((val, colIndex) => (
                            <div
                                key={`result-${rowIndex}-${colIndex}`}
                                className="sensitivity-irr-result-cell sensitivity-grid-cell"
                            >
                                {val}
                            </div>
                        ))}
                    </React.Fragment>
                ))}

            </div>
        </div>
    );
};

export default SensitivityTable;