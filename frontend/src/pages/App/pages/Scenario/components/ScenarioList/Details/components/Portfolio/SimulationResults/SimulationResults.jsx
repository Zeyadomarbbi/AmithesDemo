import React from 'react';
import { ChevronDoubleRightIcon, ChevronDoubleLeftIcon } from '../Icons'; 
import SimulationHeader from './SimulationHeader/SimulationHeader';
import './SimulationResults.css';

function SimulationResults({ isCollapsed, onToggleCollapse }) {
  // Dynamic Icon based on state
  const ChevronIcon = isCollapsed ? ChevronDoubleLeftIcon : ChevronDoubleRightIcon;

  return (
    // RESTORED: Collapse class applied to container
    <div className={`simulation-results-container ${isCollapsed ? 'collapsed' : ''}`}>
      
      {/* Icon Trigger (Always visible) */}
      <div className="sr-collapse-trigger" onClick={onToggleCollapse}>
         <div className="sr-icon-box">
             <ChevronIcon width={16} color="#FFFFFF" />
         </div>
      </div>
      
      {/* Full Content Wrapper (Hidden when collapsed) */}
      <div className={`sr-content-wrapper ${isCollapsed ? 'hidden-content' : ''}`}>
        
        <SimulationHeader />

        {/* === TABS ROW === */}
        <div className="sr-tabs-row">
          <span className="breakdown-label">Breakdown :</span>
          <div className="sr-segmented-tabs">
            <div className="sr-tab-item active"><span>Label</span></div>
            <div className="sr-tab-item"><span>Label</span></div>
          </div>
        </div>

        {/* === METRICS ROW === */}
        <div className="sr-metrics-row">
          <div className="metric-card">
            <span className="metric-heading">Heading</span>
            <span className="metric-value">50</span>
          </div>
          <div className="metric-card">
            <span className="metric-heading">Heading</span>
            <span className="metric-value">52</span>
          </div>
        </div>

        {/* === DATA LIST === */}
        <div className="sr-data-list">
          {/* ... table structure ... */}
        </div>
        
      </div>
    </div>
  );
}

export default SimulationResults;