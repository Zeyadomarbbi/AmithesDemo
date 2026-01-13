// src/components/Sensitivity.jsx

import React, { useState } from 'react';
import SensitivityTableHeader from './Header/SensitivityTableHeader.jsx'; 
import SensitivityTable from './Table/SensitivityTable.jsx'; 

import './Sensitivity.css';

function Sensitivity() {
    
    // Placeholder functions for interactivity (Keep high-level handlers here)
    const handleHeaderDurationChange = (e) => {
        // Logic for Duration dropdown in header
    };
    
    const handleNetIRRChange = (e) => {
        // Logic for Net IRR dropdown in header
    };

    return (
        <div className="sensitivity-table-wrapper">
            
            {/* 1. TOP TITLE AND CONTROLS */}
            <SensitivityTableHeader 
                handleDurationChange={handleHeaderDurationChange} 
                handleNetIRRChange={handleNetIRRChange}
            />

            {/* 2. MAIN GRID STRUCTURE - Now entirely handled by SensitivityTable */}
            <SensitivityTable />
        </div>
    );
}

export default Sensitivity;