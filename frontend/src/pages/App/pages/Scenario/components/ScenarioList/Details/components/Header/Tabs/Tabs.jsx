import React from 'react';
import { PlayIcon } from '/src/components/Icons/InteractiveIcons';
import { GearIcon } from '/src/components/Icons/MiscIcons'; 
import './Tabs.css';

function Tabs({ activeTab, onTabChange }) {
  
  const isActive = (key) => activeTab?.toLowerCase() === key.toLowerCase();

  return (
    <div className="scenario-tabs-frame">
      {/* 1. PORTFOLIO */}
      <button 
        className={`scenario-tab-item ${isActive('portfolio') ? 'active' : ''}`}
        onClick={() => onTabChange('portfolio')}
      >
        <PlayIcon />
        Portfolio
      </button>
      
      {/* 2. SET FINANCIALS */}
      <button 
        className={`scenario-tab-item ${isActive('set-financials') ? 'active' : ''}`}
        onClick={() => onTabChange('set-financials')}
      >
        <GearIcon />
        Set financials
      </button>

      {/* 3. FUND FLOWS */}
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