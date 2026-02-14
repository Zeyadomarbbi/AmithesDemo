import React, { useState, useEffect } from 'react';
import FinancialTable from './FinancialTable/FinancialTable';
import ManagementFees from './ManagementFees/ManagementFees';
import { useScenarioFinancialsProjections } from './utils/useScenarioFinancialsProjections.js';
import DDFees from './DDFees/DDFees';
import { DownloadIcon, PlusIcon, MinusIcon } from './Icons';
import './SetFinancials.css';

function SetFinancials({ fundId, scenarioId }) {
  // 1. Fetch Data
  const { gridData, years: apiYears, loading, refresh } = useScenarioFinancialsProjections(fundId, scenarioId);
  const [years, setYears] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 2. Automatic Timeline Calculation
  useEffect(() => {
    if (!loading && apiYears.length > 0 && gridData.length > 0) {
      const minYear = Math.min(...apiYears);
      const maxDataYear = Math.max(...apiYears);
      
      // Calculate maxRealizedYear from the grid data status
      let maxRealizedYear = 0;
      gridData.forEach(row => {
        Object.entries(row.values).forEach(([year, val]) => {
          if (val.status === 'REALIZED' && parseInt(year) > maxRealizedYear) {
            maxRealizedYear = parseInt(year);
          }
        });
      });

      // Default start to 2021 (based on your data) or minYear
      const startYear = minYear; 
      // Ensure at least 5 years of projection beyond the last realized
      const endYear = Math.max(maxDataYear, maxRealizedYear + 5);

      const newYears = [];
      for (let y = startYear; y <= endYear; y++) {
        newYears.push({
          year: String(y),
          type: y <= maxRealizedYear ? 'realized' : 'projected'
        });
      }
      
      setYears(newYears);
    }
  }, [apiYears, gridData, loading]);

  const handleClose = () => setActiveTab(null);

  const addProjectedYear = () => {
    if (years.length === 0) return;
    
    const startYear = parseInt(years[0].year);
    const lastYear = parseInt(years[years.length - 1].year);
    const maxAllowedYear = startYear + 16;

    if (lastYear >= maxAllowedYear) {
      // Limit reached: Start Year + 16
      return;
    }

    const newYear = { year: String(lastYear + 1), type: 'projected' };
    setYears(prev => [...prev, newYear]);
  };

  const removeProjectedYear = () => {
    if (years.length === 0) return;

    const lastIndex = years.length - 1;
    // Only allow removal if the last year is marked as 'projected'
    if (years[lastIndex].type === 'projected') {
      setYears(prev => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Future: Submit local grid changes to backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    refresh(); 
    setIsSaving(false);
  };

  return (
    <div className="sf-financials-page-layout">
      <div className="sf-financials-main-content">
        <div className="sf-fin-toolbar">
          <div className="sf-fin-view-selector">
            <button
              className={`sf-view-badge ${activeTab === 'management' ? 'active' : ''}`}
              onClick={() => setActiveTab('management')}
            >
              Management fees
            </button>
            <button
              className={`sf-view-badge ${activeTab === 'diligence' ? 'active' : ''}`}
              onClick={() => setActiveTab('diligence')}
            >
              Due diligence fees
            </button>
          </div>
          <div className="sf-fin-actions">
            <button className="sf-action-btn sf-btn-download">
              <DownloadIcon />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="sf-fin-sub-toolbar">
          <div className="sf-legend-wrapper">
            <span className="sf-legend-text sf-realized">Realized</span>
            <span className="sf-legend-text sf-projected">Projected</span>
          </div>
          <div className="sf-fin-timeline-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="sf-view-badge" onClick={addProjectedYear}>
              <PlusIcon />
              <span>Add Projected Year</span>
            </button>
            <button className="sf-view-badge" onClick={removeProjectedYear}>
              <MinusIcon />
              <span>Remove Projected Year</span>
            </button>
          </div>
        </div>

        <div className="sf-fin-content-wrapper">
           {loading && years.length === 0 ? (
             <div className="sf-loading-state">Loading Financials...</div>
           ) : (
             <FinancialTable 
              scenarioId={scenarioId} 
              years={years} 
              rows={gridData} 
            />
           )}
        </div>
      </div>

      <div className="sf-footer">
        <div className="sf-actions">
          <button 
            className="sf-btn-save" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {activeTab === 'management' && (
        <div className="sf-overlay fullscreen">
          <div className="sf-overlay-content">
            <ManagementFees 
              fundId={fundId} 
              scenarioId={scenarioId}
              onClose={handleClose} 
            />
          </div>
        </div>
      )}

      {activeTab === 'diligence' && (
        <div className="sf-overlay modal">
          <DDFees 
            fundId={fundId} 
            scenarioId={scenarioId} 
            onClose={handleClose} 
          />
        </div>
      )}
    </div>
  );
}

export default SetFinancials;