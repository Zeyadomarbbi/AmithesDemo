import React, { useState } from 'react';
import SimulationResults from './SimulationResults/SimulationResults';
import './Portfolio.css';

// Static Data for Realized Portfolio (as requested)
const realizedData = [
  { id: 1, name: "Terapia Group", date: "30.06.20", duration: "5 yrs", cost: "6 000 000", exitVal: "12 000 000", irr: "12.54%", moic: "2.00x" }
];

function Portfolio({ scenarioId }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // State for toggles: 'sensitivity', 'target', or null (none)
  const [activeMode, setActiveMode] = useState(null);

  const handleToggle = (mode) => {
    // If clicking the currently active mode, turn it off (null). 
    // Otherwise, switch to the new mode (mutual exclusivity).
    setActiveMode(prev => prev === mode ? null : mode);
  };

  return (
    <div className="portfolio-page-layout">
      
      {/* === LEFT COLUMN: MAIN CONTENT === */}
      <div className="portfolio-main-content">
        <div className="portfolio-tab-container">
          
          {/* === TOGGLE CONTROLS SECTION === */}
          <div className="portfolio-controls-header">
            
            {/* Toggle 1: Sensitivity Table */}
            <div 
              className="toggle-group" 
              onClick={() => handleToggle('sensitivity')}
            >
              <div className={`toggle-track ${activeMode === 'sensitivity' ? 'active' : ''}`}>
                <div className="toggle-knob"></div>
              </div>
              <span className="toggle-label">Sensitivity table</span>
            </div>

            {/* Toggle 2: Target Mode */}
            <div 
              className="toggle-group" 
              onClick={() => handleToggle('target')}
            >
              <div className={`toggle-track ${activeMode === 'target' ? 'active' : ''}`}>
                <div className="toggle-knob"></div>
              </div>
              <span className="toggle-label">Target mode</span>
            </div>

          </div>

          {/* SECTION 1: REALIZED PORTFOLIO (Static) */}
          <div className="portfolio-section">
            <h3 className="section-title">Realized portfolio <span style={{color:'#64748b', fontSize:'14px', marginLeft:'4px'}}>{realizedData.length}</span></h3>
            
            {/* Simple Table Render for Static Data */}
            <div className="static-table-container">
               <table className="std-table">
                  <thead>
                     <tr>
                        <th>Deal Name</th>
                        <th>Duration</th>
                        <th className="text-right">Cost (€)</th>
                        <th className="text-right">Exit val (€)</th>
                        <th className="text-right">IRR</th>
                        <th className="text-right">MOIC</th>
                     </tr>
                  </thead>
                  <tbody>
                     {realizedData.map(row => (
                       <tr key={row.id}>
                         <td>
                            <div style={{display:'flex', flexDirection:'column'}}>
                               <span style={{fontWeight:500}}>{row.name}</span>
                               <span style={{fontSize:'12px', color:'#375A89'}}>{row.date}</span>
                            </div>
                         </td>
                         <td>{row.duration}</td>
                         <td className="text-right">{row.cost}</td>
                         <td className="text-right">{row.exitVal}</td>
                         <td className="text-right">{row.irr}</td>
                         <td className="text-right">{row.moic}</td>
                       </tr>
                     ))}
                     {/* Summary Row */}
                     <tr className="row-summary">
                        <td>Total</td>
                        <td></td>
                        <td className="text-right">34 000 000</td>
                        <td className="text-right">78 500 000</td>
                        <td className="text-right">16.88%</td>
                        <td className="text-right">2.05x</td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </div>

          {/* SECTION 2: INVESTED PORTFOLIO (Affected by Toggles) */}
          <div className="portfolio-section">
            <h3 className="section-title">Invested portfolio</h3>
            <div className="placeholder-box">
               {activeMode === 'sensitivity' ? 'Showing Sensitivity Analysis...' : 
                activeMode === 'target' ? 'Showing Target Mode Inputs...' : 
                'Standard Invested Table Placeholder'}
            </div>
          </div>

           {/* SECTION 3: PROJECTED PORTFOLIO (Affected by Toggles) */}
           <div className="portfolio-section">
            <h3 className="section-title">Projected portfolio</h3>
             <div className="placeholder-box">
                {activeMode === 'sensitivity' ? 'Showing Sensitivity Analysis...' : 
                 activeMode === 'target' ? 'Showing Target Mode Inputs...' : 
                 'Standard Projected Table Placeholder'}
            </div>
          </div>

        </div>
      </div>

      {/* === RIGHT COLUMN: SIMULATION RESULTS === */}
      <div className={`portfolio-side-panel ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <SimulationResults 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

    </div>
  );
}

export default Portfolio;