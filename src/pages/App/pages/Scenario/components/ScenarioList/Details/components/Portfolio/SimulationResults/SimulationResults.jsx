import React, { useState } from 'react';
import { ChevronDoubleRightIcon } from '../Icons'; 
import Shares from './Shares/Shares';
import Operations from './Operations/Operations';
import './SimulationResults.css';


const SimulationResults = ({ isCollapsed, onToggleCollapse }) => {
  const [breakdownMode, setBreakdownMode] = useState('shares');

  return (
    <div className="sim-results-container">
      
      {/* === HEADER SECTION (Icon + Title) === */}
      <div className={`sim-header ${isCollapsed ? 'collapsed' : ''}`}>
        
        {/* Toggle Button */}
        <button 
          className="sim-toggle-btn" 
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          <ChevronDoubleRightIcon className={`chevron-icon ${!isCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Title: Hidden when collapsed */}
        {!isCollapsed && (
          <h2 className="sim-header-title">
            Simulation Results
          </h2>
        )}
      </div>

      {/* === BREAKDOWN ROW (Below Header, Right Aligned) === */}
      {!isCollapsed && (
        <div className="sim-breakdown-row fade-in">
           <span className="breakdown-label">Breakdown :</span>
           
           <div className="breakdown-toggle-track">
              {/* Shares Option */}
              <button 
                className={`breakdown-option ${breakdownMode === 'shares' ? 'active' : ''}`}
                onClick={() => setBreakdownMode('shares')}
              >
                Shares
              </button>

              {/* Operations Option */}
              <button 
                className={`breakdown-option ${breakdownMode === 'operations' ? 'active' : ''}`}
                onClick={() => setBreakdownMode('operations')}
              >
                Operations
              </button>
           </div>
        </div>
      )}

      {/* === CONTENT SECTION === */}
      {!isCollapsed && (
        <div className="sim-content fade-in">
           {breakdownMode === 'shares' ? (
             /* SHARES VIEW */
             <Shares />
           ) : (
             /* OPERATIONS VIEW */
             <Operations />
           )}
        </div>
      )}

    </div>
  );
};

export default SimulationResults;