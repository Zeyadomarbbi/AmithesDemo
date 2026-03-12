import React, { useState, useEffect } from 'react';
import FinancialTable from './FinancialTable/FinancialTable';
import ManagementFees from './ManagementFees/ManagementFees';
import { useScenarioFinancialsProjections } from '../../../../../../../hooks/Scenarios/useScenarioFinancialsProjections';
import Toast from '../../../../../../../components/Toast/Toast'; 
import DDFees from './DDFees/DDFees';
import { DownloadIcon, PlusIcon, MinusIcon } from '/src/components/Icons/InteractiveIcons';
import './SetFinancials.css';

function SetFinancials({ fundId, scenarioId }) {
  // 1. Fetch Data + CRUD Operations

  const { 
    gridData, 
    years: apiYears, 
    loading, 
    refresh,
    put,
    patch,
    post 
  } = useScenarioFinancialsProjections(fundId, scenarioId);
  console.log("gridData", gridData)
  const [years, setYears] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState({}); // Track unsaved edits
  const [toast, setToast] = useState(null);
  const [downloadTrigger, setDownloadTrigger] = useState(0);

  // 2. Automatic Timeline Calculation
  useEffect(() => {
    if (!loading && apiYears.length > 0 && gridData.length > 0) {
      const minYear = Math.min(...apiYears);
      const maxDataYear = Math.max(...apiYears);
      
      let maxRealizedYear = 0;
      gridData.forEach(row => {
        Object.entries(row.values).forEach(([year, val]) => {
          if (val.status === 'Realized' && parseInt(year) > maxRealizedYear) {
            maxRealizedYear = parseInt(year);
          }
        });
      });

      const startYear = minYear; 
      // Show only 10 years total by default
      const endYear = Math.min(maxDataYear, startYear + 10);

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

    if (lastYear >= maxAllowedYear) return;

    const newYear = { year: String(lastYear + 1), type: 'projected' };
    setYears(prev => [...prev, newYear]);
  };

  const removeProjectedYear = () => {
    if (years.length === 0) return;

    const lastIndex = years.length - 1;
    if (years[lastIndex].type === 'projected') {
      setYears(prev => prev.slice(0, -1));
    }
  };

  // 3. Track Cell Edits
  const handleCellChange = (lineItemId, year, newAmount) => {
    console.log('Cell changed:', { lineItemId, year, newAmount }); // ADD THIS
    const key = `${lineItemId}_${year}`;
    setLocalChanges(prev => ({
      ...prev,
      [key]: { lineItemId, year: parseInt(year), amount: newAmount }
    }));
  };

  // 4. Save All Changes
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const changes = Object.values(localChanges);
      
      for (const change of changes) {
        const { lineItemId, year, amount } = change;
        
        // Find if projection exists
        const row = gridData.find(r => r.line_item_id === lineItemId);
        const existingCell = row?.values[year];
        
        if (existingCell?.id) {
          // Update existing
          await patch(existingCell.id, { amount });
        } else {
          // Create new
          await post({
            line_item: lineItemId,
            year: year,
            amount: amount
          });
        }
      }
      
      setLocalChanges({}); // Clear after save
      await refresh();
      
      setToast({
        type: 'success',
        title: 'Changes saved',
        message: `${changes.length} projection${changes.length > 1 ? 's' : ''} updated successfully`
      });
      
    } catch (err) {
      console.error("Save failed", err);
      setToast({
        type: 'error',
        title: 'Save failed',
        message: 'Unable to save changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = Object.keys(localChanges).length > 0;

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
            <button
              className="sf-action-btn sf-btn-download"
              onClick={() => setDownloadTrigger((n) => n + 1)}
            >
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
              years={years} 
              rows={gridData}
              localChanges={localChanges}
              onCellChange={handleCellChange}
              triggerDownload={downloadTrigger}
            />
           )}
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
      <div className="sf-footer">
        <div className="sf-actions">
          <button 
            className="sf-btn-save" 
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? "Saving..." : hasUnsavedChanges ? `Save (${Object.keys(localChanges).length})` : "Save"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </div>
  );
}

export default SetFinancials;