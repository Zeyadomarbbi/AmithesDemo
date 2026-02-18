import React, { useState, useEffect } from 'react';
import Shares from './KPIs/Shares';
import Operations from './KPIs/Operations';
import { useScenarioWaterfall } from './utils/useScenarioWaterfall'; 
import { useNumberFormatter } from '../../../../../../../../../../components/useFormatter';
import { ChevronDoubleLeftIcon } from '../Icons'; 
import './SimulationResults.css';

const SimulationResults = ({ scenarioId, fundId, isOpen, onToggle, refreshTrigger}) => {
  const [breakdownMode, setBreakdownMode] = useState('shares');
  const { data, loading, error, refetch } = useScenarioWaterfall(fundId, scenarioId);
  const formatNumber = useNumberFormatter();
  useEffect(() => {
    if (refreshTrigger > 0) {
        refetch();
  }
  }, [refreshTrigger, refetch]);
  if (loading) return <div className="sim-results-container">Loading simulation...</div>;
  if (error) return <div className="sim-results-container">Error: {error}</div>;
  if (!data || !data.simulation_results) return null;

  const { allocations, operations, performance, breakeven } = data.simulation_results;

  return (
    <div className={`sim-results-container ${!isOpen ? 'collapsed' : ''}`}>
        {/* === HEADER SECTION === */}
        <div className="sim-header">
            {/* Title Row with Toggle Chevron */}
            <div className="sim-header-top">
                <div 
                    className={`sim-chevron-btn ${!isOpen ? 'collapsed' : ''}`}
                    onClick={onToggle}
                    title={isOpen ? "Collapse" : "Expand"}
                >
                    <ChevronDoubleLeftIcon />
                </div>
                
                {/* Conditional Title Rendering */}
                {isOpen ? (
                    <h2 className="sim-header-title">Simulation Analysis</h2>
                ) : (
                    <div className="sim-vertical-title">Simulation Results</div>
                )}
            </div>
            
            {/* Breakdown Toggles - Only show when Open */}
            {isOpen && (
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
            )}
        </div>

      {/* === CONTENT SECTION (Hidden when collapsed) === */}
        {isOpen && (
            <>
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
                            {breakeven?.hurdle ? `${formatNumber(breakeven.hurdle)}x` : '-'}
                        </span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-title">Break-even DPI 1.00x</span>
                        <span className="kpi-number">
                            {breakeven?.dpi_1x ? `${formatNumber(breakeven.dpi_1x)}x` : '-'}
                        </span>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default SimulationResults;