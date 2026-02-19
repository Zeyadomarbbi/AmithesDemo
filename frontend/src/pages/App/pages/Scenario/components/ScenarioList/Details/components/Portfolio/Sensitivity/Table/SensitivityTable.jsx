import React, { useState, useMemo, useEffect } from 'react';
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

const SensitivityTable = ({ 
    data = null, 
    kpiOptions = [], 
    isLoading = false,
    moicValues = [],
    durationValues = [],
    onMoicChange,
    onDurationChange
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedKpi, setSelectedKpi] = useState("");

    useEffect(() => {
        if (kpiOptions.length > 0 && !selectedKpi) {
            setSelectedKpi(kpiOptions[0].value);
        }
    }, [kpiOptions, selectedKpi]);

    const displayData = useMemo(() => {
        if (data && selectedKpi && data[selectedKpi]) {
            return data[selectedKpi];
        }
        return new Array(5).fill(0).map(() => new Array(5).fill("0.00%"));
    }, [data, selectedKpi]);

    return (
        <div className="sensitivity-wrapper">
            <div className="sensitivity-header-wrapper">
                <span className="sensitivity-title-text">Sensitivity table</span>
                <div className="sensitivity-controls-group">
                    <div className="sensitivity-header-dropdown-container">
                        <select 
                            className="sensitivity-header-control-dropdown" 
                            value={selectedKpi}
                            onChange={(e) => {
                                setIsDropdownOpen(false);
                                setSelectedKpi(e.target.value);
                            }}
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            onBlur={() => setIsDropdownOpen(false)}
                            disabled={kpiOptions.length === 0}
                        >
                            {kpiOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <span className={`sensitivity-dropdown-icon ${isDropdownOpen ? 'sensitivity-dropdown-icon--open' : ''}`}>
                            <ChevronDownIcon />
                        </span>
                    </div>
                </div>
            </div>

            <div className="sensitivity-main-grid" style={{ position: 'relative' }}>
                {isLoading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Loading...
                    </div>
                )}

                <div className="sensitivity-grid-cell sensitivity-moic-label-cell">
                    <span className="sensitivity-moic-label-text">MOIC</span>
                    <span className="sensitivity-duration-label-text">Duration (yrs)</span>
                </div>

                {moicValues.map((val, index) => (
                    <div key={`moic-cell-${index}`} className="sensitivity-moic-input sensitivity-grid-cell">
                        <StyledInput
                            className="sensitivity-moic-input-field"
                            value={val}
                            onChange={(e) => onMoicChange(index, e.target.value)}
                        />
                    </div>
                ))}

                {durationValues.map((duration, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                        <div className="sensitivity-moic-input sensitivity-grid-cell">
                            <StyledInput
                                className="sensitivity-moic-input-field"
                                value={duration}
                                onChange={(e) => onDurationChange(rowIndex, e.target.value)}
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