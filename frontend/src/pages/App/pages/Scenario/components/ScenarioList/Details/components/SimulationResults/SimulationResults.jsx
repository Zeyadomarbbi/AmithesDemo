import React, { useState } from 'react';
import Shares from './KPIs/Shares';
import Operations from './KPIs/Operations';
import './SimulationResults.css';

const SimulationResults = ({ scenarioId }) => {
  const [breakdownMode, setBreakdownMode] = useState('shares');

  return (
    /* Changed class to match the CSS container */
    <div className="sim-results-container">
        {/* === HEADER SECTION === */}
        <div className="sim-header">
            <h2 className="sim-header-title">Simulation Analysis</h2>
            
            <div className="sim-breakdown-row">
            <span className="breakdown-label">Breakdown :</span>
            <div className="breakdown-toggle-track">
                <button 
                    className={`breakdown-option ${breakdownMode === 'shares' ? 'active' : ''}`}
                    onClick={() => setBreakdownMode('shares')}
                >
                Shares
                </button>
                <button 
                    className={`breakdown-option ${breakdownMode === 'operations' ? 'active' : ''}`}
                    onClick={() => setBreakdownMode('operations')}
                >
                Operations
                </button>
            </div>
            </div>
        </div>

      {/* === CONTENT SECTION === */}
        <div className="sim-content">
            {breakdownMode === 'shares' ? <Shares /> : <Operations />}
        </div>

        <div className="kpi-row">
            <div className="kpi-card">
                <span className="kpi-title">Break-even Hurdle</span>
                <span className="kpi-number">1.76x</span>
            </div>
            <div className="kpi-card">
                <span className="kpi-title">Break-even DPI 1.00x</span>
                <span className="kpi-number">1.23x</span>
            </div>
        </div>
    </div>
  );
};

export default SimulationResults;