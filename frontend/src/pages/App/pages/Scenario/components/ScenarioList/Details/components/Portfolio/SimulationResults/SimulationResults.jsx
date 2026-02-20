import React, { useState, useEffect } from 'react';
import { OperationsTable } from './KPIs/Operations';
import { WaterfallTable, PerformanceTable } from './KPIs/Shares';
import { useScenarioWaterfall } from './utils/useScenarioWaterfall'; 
import { useNumberFormatter } from '../../../../../../../../../../components/useFormatter';
import { ChevronDoubleLeftIcon } from '../Icons'; 
import './SimulationResults.css';

const SimulationResults = ({ scenarioId, fundId, isOpen, onToggle, refreshTrigger }) => {
  const [breakdownMode, setBreakdownMode] = useState('shares');
  const { data, loading, error, refetch } = useScenarioWaterfall(fundId, scenarioId);
  const formatNumber = useNumberFormatter();

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const simulationResults = data?.simulation_results;
  const { allocations, operations, performance, breakeven } = simulationResults ?? {};

  const renderContent = () => {
    if (loading) {
      return (
        <div className="sim-state-panel">
          <div className="sim-state-spinner" />
          <span className="sim-state-text">Loading simulation...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="sim-state-panel sim-state-panel--error">
          <span className="sim-state-icon">⚠</span>
          <span className="sim-state-text">{error}</span>
          <button className="sim-state-retry" onClick={refetch}>Retry</button>
        </div>
      );
    }
    if (!simulationResults) {
      return (
        <div className="sim-state-panel sim-state-panel--empty">
          <span className="sim-state-icon">—</span>
          <span className="sim-state-text">No simulation results available.</span>
        </div>
      );
    }
    return (
        <>
            <div className="sim-content">
                {breakdownMode === 'shares' ? (
                    <WaterfallTable allocations={allocations} />
                ) : (
                    <OperationsTable operations={operations} />
                )}
            </div>

            <PerformanceTable performance={performance} />

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
    );
  };

  return (
    <div className={`sim-results-container ${!isOpen ? 'collapsed' : ''}`}>

      {/* === HEADER SECTION === */}
      <div className="sim-header">
        <div className="sim-header-top">
          <div
            className={`sim-chevron-btn ${!isOpen ? 'collapsed' : ''}`}
            onClick={onToggle}
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            <ChevronDoubleLeftIcon />
          </div>
          {isOpen ? (
            <h2 className="sim-header-title">Simulation Analysis</h2>
          ) : (
            <div className="sim-vertical-title">Simulation Results</div>
          )}
        </div>

        {isOpen && !loading && !error && simulationResults && (
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

      {/* === CONTENT SECTION === */}
      {isOpen && (
        <div className="sim-content-wrapper">
          {renderContent()}
        </div>
      )}

    </div>
  );
};

export default SimulationResults;