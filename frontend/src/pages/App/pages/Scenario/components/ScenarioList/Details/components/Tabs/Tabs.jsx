import React from 'react';
import { 
  PlayIcon, 
  GearIcon, 
} from '../../../Icons'; 
import './Tabs.css';

function Tabs({ activeTab, onTabChange }) {
  
  // Helper: Case-insensitive check, though keys are now strict lowercase
  const isActive = (key) => activeTab?.toLowerCase() === key.toLowerCase();

  return (
    <div className="tabs-frame">
      
      {/* 1. PORTFOLIO */}
      <button 
        className={`tab-item ${isActive('portfolio') ? 'active' : ''}`}
        // Pass strictly 'portfolio'
        onClick={() => onTabChange('portfolio')}
      >
        <PlayIcon width={16} />
        Portfolio
      </button>
      
      {/* 2. SET FINANCIALS */}
      <button 
        className={`tab-item ${isActive('setfinancials') ? 'active' : ''}`}
        // Pass strictly 'setfinancials' (matches URL param)
        onClick={() => onTabChange('setfinancials')}
      >
        <GearIcon width={16} />
        Set financials
      </button>

      {/* 3. FUND FLOWS */}
      <button 
        className={`tab-item ${isActive('fundflows') ? 'active' : ''}`}
        // Pass strictly 'fundflows' (matches URL param)
        onClick={() => onTabChange('fundflows')}
      >
        <GearIcon width={16} />
        Fund flows
      </button>

    </div>
  );
}

export default Tabs;