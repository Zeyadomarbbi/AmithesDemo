import React, { useState } from 'react';
import SimulationResults from './SimulationResults/SimulationResults';
import './Portfolio.css';

function Portfolio() {
  // RESTORED: Collapse state management
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Calculate dynamic width and margin
  const EXPANDED_WIDTH = 587;
  const COLLAPSED_WIDTH = 72;
  const sidePanelWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const investedAssets = [
    { id: 1, name: "Asterium", date: "12/2020", cost: "5.0M", value: "8.2M", moic: "1.6x" },
    { id: 2, name: "Lynx", date: "03/2021", cost: "3.5M", value: "4.1M", moic: "1.2x" },
    { id: 3, name: "Vortex", date: "06/2021", cost: "2.0M", value: "1.8M", moic: "0.9x" },
  ];

  return (
    <div className="portfolio-page-layout">
      
      {/* === LEFT COLUMN: MAIN CONTENT === */}
      <div 
        className="portfolio-main-content"
        // RESTORED: Dynamic margin to create the space for the panel
        style={{ marginRight: sidePanelWidth }}
      >
        <div className="portfolio-tab-container">
          {/* SECTION 1: INVESTED PORTFOLIO */}
          <div className="portfolio-section">
            <h3 className="section-title">Invested Portfolio</h3>
            {/* ... table content ... */}
          </div>
          {/* SECTION 2: REALIZED (Placeholder) */}
          <div className="portfolio-section">
            <h3 className="section-title">Realized Portfolio</h3>
            <div className="empty-state">No realized assets in this scenario yet.</div>
          </div>
        </div>
      </div>

      {/* === RIGHT COLUMN: SIMULATION RESULTS === */}
      <div className="portfolio-side-panel">
        <SimulationResults 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
    </div>
  );
}

export default Portfolio;