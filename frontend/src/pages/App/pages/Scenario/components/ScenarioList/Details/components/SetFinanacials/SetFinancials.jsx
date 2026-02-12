import React, { useState } from 'react';
import FinancialTable from './FinancialTable/FinancialTable';
import ManagementFees from './ManagementFees/ManagementFees';
import DDFees from './DDFees/DDFees';
import { DownloadIcon, PlusIcon } from './Icons';
import './SetFinancials.css';

function SetFinancials({ fundId, scenarioId, realizedYears = [2024, 2025] }) {
  const [activeTab, setActiveTab] = useState(null);
  const [years, setYears] = useState(() => {
    const realized = realizedYears.map(y => ({ year: String(y), type: 'realized' }));
    const lastRealized = Math.max(...realizedYears);
    const projected = Array.from({ length: 6 }, (_, i) => ({
      year: String(lastRealized + i + 1),
      type: 'projected'
    }));
    return [...realized, ...projected];
  });

  const handleClose = () => setActiveTab(null);

  const addProjectedYear = () => {
    const lastYear = parseInt(years[years.length - 1].year);
    const newYear = { year: String(lastYear + 1), type: 'projected' };
    setYears(prev => [...prev, newYear]);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Placeholder for future API integration
    console.log('Saving financials for scenario:', scenarioId, 'Years:', years);
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1000));
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
          <button className="sf-view-badge" onClick={addProjectedYear}>
            <PlusIcon />
            <span>Add Projected Year</span>
          </button>
        </div>

        <div className="sf-fin-content-wrapper">
          <FinancialTable scenarioId={scenarioId} years={years} />
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
          {/* Close button removed from here */}
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