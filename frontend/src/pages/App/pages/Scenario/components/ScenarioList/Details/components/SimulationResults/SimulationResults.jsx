import React, { useState } from 'react';
import Shares from './KPIs/Shares';
import Operations from './KPIs/Operations';
import { useScenarioWaterfall } from './utils/useScenarioWaterfall'; // Adjust path
import './SimulationResults.css';

const SimulationResults = ({ scenarioId, fundId }) => {
  // If IDs come from props, use them. Otherwise, grab from URL params if needed.
  // const fId = fundId || paramFundId;
  // const sId = scenarioId || paramScenarioId;
  
  const [breakdownMode, setBreakdownMode] = useState('shares');
  const { data, loading, error } = useScenarioWaterfall(fundId, scenarioId);

  if (loading) return <div className="sim-results-container">Loading simulation...</div>;
  if (error) return <div className="sim-results-container">Error: {error}</div>;
  if (!data || !data.simulation_results) return null;

  const { allocations, operations, performance, breakeven } = data.simulation_results;

  return (
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
            {breakdownMode === 'shares' ? (
                <Shares allocations={allocations} performance={performance} />
            ) : (
                <Operations operations={operations} performance={performance} />
            )}
        </div>

        <div className="kpi-row">
            <div className="kpi-card">
                <span className="kpi-title">Break-even Hurdle</span>
                <span className="kpi-number">
                    {breakeven?.hurdle ? `${breakeven.hurdle.toFixed(2)}x` : '-'}
                </span>
            </div>
            <div className="kpi-card">
                <span className="kpi-title">Break-even DPI 1.00x</span>
                <span className="kpi-number">
                    {breakeven?.dpi_1x ? `${breakeven.dpi_1x.toFixed(2)}x` : '-'}
                </span>
            </div>
        </div>
    </div>
  );
};

export default SimulationResults;