import React, { useState, useMemo, useEffect } from 'react';
import SimpleDropdown from '../../../../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx';
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

    const kpiOptionsMapped = useMemo(() => 
        kpiOptions.map(opt => ({ id: opt.value, name: opt.label })),
    [kpiOptions]);

    return (
        <div className="sensitivity-wrapper">
            <div className="sensitivity-header-wrapper">
                <span className="sensitivity-title-text">Sensitivity table</span>
                <div className="sensitivity-controls-group">
                    <div className="sensitivity-header-dropdown-container">
                        <SimpleDropdown
                            options={kpiOptionsMapped}
                            value={selectedKpi}
                            onChange={(val) => setSelectedKpi(val)}
                            placeholder="Select KPI..."
                            disabled={kpiOptions.length === 0}
                            labelKey="name"
                            valueKey="id"
                        />
                    </div>
                </div>
            </div>

            <div className="sensitivity-main-grid" style={{ position: 'relative' }}>
                {isLoading && (
                    <div className="sensitivity-loading-overlay">
                        <div className="sensitivity-loading-spinner" />
                        <span className="sensitivity-loading-text">Loading...</span>
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