import React from 'react';
import {ChevronDownIcon} from '../../Icons'; 

import './SensitivityTableHeader.css';

function SensitivityTableHeader({ handleDurationChange, handleNetIRRChange }) {
    return (
        <div className="sensitivity-header-wrapper">
            
            {/* Sensitivity table title */}
            <span className="sensitivity-title-text">Sensitivity table</span>
            
            {/* Controls Group */}
            <div className="sensitivity-controls-group">
                
                {/* Duration Dropdown */}
                <div className="header-dropdown-container duration-control-container">
                    <select 
                        className="header-control-dropdown" 
                        onChange={handleDurationChange}
                    >
                        <option>Duration</option>
                    </select>
                    {/* Insert the icon next to the select element */}
                    <ChevronDownIcon className="dropdown-icon" />
                </div>
                
                {/* Net IRR Dropdown */}
                <div className="header-dropdown-container net-irr-control-container">
                    <select 
                        className="header-control-dropdown" 
                        onChange={handleNetIRRChange}
                    >
                        <option>Net IRR</option>
                    </select>
                    {/* Insert the icon next to the select element */}
                    <ChevronDownIcon className="dropdown-icon" />
                </div>

            </div>
        </div>
    );
}

export default SensitivityTableHeader;