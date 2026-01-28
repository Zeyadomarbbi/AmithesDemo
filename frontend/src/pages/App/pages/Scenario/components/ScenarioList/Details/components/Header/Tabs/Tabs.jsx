import React from 'react';
import { 
  PlayIcon, 
  GearIcon, 
} from '../../../../Icons'; 
import './Tabs.css';

function Tabs({ activeTab, onTabChange }) {
  
  const isActive = (key) => activeTab?.toLowerCase() === key.toLowerCase();

  return (
    <div className="scenario-tabs-frame">
      
      {/* 1. SIMULATION RESULTS */}
      <button 
        className={`scenario-tab-item ${isActive('simulation-results') ? 'active' : ''}`}
        onClick={() => onTabChange('simulation-results')}
      >
        <PlayIcon />
        Simulation Results
      </button>

      {/* 2. PORTFOLIO */}
      <button 
        className={`scenario-tab-item ${isActive('portfolio') ? 'active' : ''}`}
        onClick={() => onTabChange('portfolio')}
      >
        <PlayIcon />
        Portfolio
      </button>
      
      {/* 3. SET FINANCIALS */}
      <button 
        className={`scenario-tab-item ${isActive('set-financials') ? 'active' : ''}`}
        onClick={() => onTabChange('set-financials')}
      >
        <GearIcon />
        Set financials
      </button>

      {/* 4. FUND FLOWS */}
      <button 
        className={`scenario-tab-item ${isActive('fund-flows') ? 'active' : ''}`}
        onClick={() => onTabChange('fund-flows')}
      >
        <GearIcon />
        Fund flows
      </button>

    </div>
  );
}

export default Tabs;