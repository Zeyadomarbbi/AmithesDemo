import React from 'react';
import './DashboardTabs.css';

function DashboardTabs({ activeTab, onTabChange }) {
  return (
    <div className="dashboard-tabs-frame">
      {/* The buttons are direct children of the flex container now */}
      
      <button 
        className={`tab-item ${activeTab === 'KPI' ? 'active' : ''}`}
        onClick={() => onTabChange('KPI')}
      >
        KPI
      </button>
      
      <button 
        className={`tab-item ${activeTab === 'Limits' ? 'active' : ''}`}
        onClick={() => onTabChange('Limits')}
      >
        Limits
      </button>

    </div>
  );
}

export default DashboardTabs;