import React from 'react';
import { ChevronDoubleRightIcon } from '../../Icons'; // Adjust path as needed
import './SimulationHeader.css';

function SimulationHeader() {
  return (
    <div className="sr-header">
      
      {/* Renamed class to avoid conflict with Admin Panel */}
      <div className="sr-icon-box">
        <ChevronDoubleRightIcon width={16} color="#FFFFFF" />
      </div>

      {/* Title */}
      <h2 className="sr-title">Simulation Results</h2>
      
    </div>
  );
}
export default SimulationHeader;