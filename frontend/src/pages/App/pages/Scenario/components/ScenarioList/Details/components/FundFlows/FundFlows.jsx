// FundFlows.js
import React, { useState } from 'react';
import './FundFlows.css';

// Sub-components
import AllOperations from './AllOperations/AllOperations';
import CapitalCalls from './CapitalCalls/CapitalCalls';
import Distributions from './Distributions/Distributions';
import AddOperation from './AddOperation/AddOperation'; 
import { useScenarioFFDistribution } from './utils/useScenarioFFDistribution'
import { useScenarioFFCapitalCall } from './utils/useScenarioFFCapitalCall'

import { DownloadIcon, PlusIcon } from './Icons';

function FundFlows({ fundId, scenarioId }) {
  const [activeView, setActiveView] = useState('all_operations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operations, setOperations] = useState(INITIAL_DATA);

  // Fetch distribution data from API
  const { distributions, loading, error } = useScenarioFFDistribution(fundId, scenarioId);
  console.log("distributions", distributions)
  // Helper: Date Object -> String
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // --- HANDLERS FOR MODAL ---
  const handleSaveOperation = (modalData) => {
    const newOp = {
      id: Date.now(),
      type: modalData.type,
      date: formatDate(modalData.date),
      flow: modalData.amount || '0', 
      investment: '-', mgmtFees: '-', structFees: '-', dueDil: '-', divestment: '-', dividends: '-', recycling: '-', other: '-', capCalled: '0.00%', distPercent: '0.00%', dpi: '0.00x'
    };
    setOperations([...operations, newOp]);
    setIsModalOpen(false);
  };

  // --- HANDLERS FOR TABLE EDITING ---
  
  // 1. Add a new empty row for a specific year and type
  const handleAddRow = (year, type) => {
    const newOp = {
      id: Date.now(),
      type: type,
      date: `01/01/${year}`,
      flow: '-', investment: '-', mgmtFees: '-', structFees: '-', dueDil: '-', other: '-', capCalled: '0.00%', distPercent: '0.00%', divestment: '-', dividends: '-', recycling: '-'
    };
    setOperations([...operations, newOp]);
  };

  // 2. Remove the last row of a specific year and type
  const handleRemoveRow = (year, type) => {
    const yearRows = operations.filter(op => op.type === type && op.date.endsWith(year));
    if (yearRows.length <= 1) return;
    const lastRowId = yearRows[yearRows.length - 1].id;
    setOperations(operations.filter(op => op.id !== lastRowId));
  };

  // 3. Update a row (e.g. date change)
  const handleUpdateRow = (id, field, value) => {
    setOperations(operations.map(op => (op.id === id ? { ...op, [field]: value } : op)));
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'calls': 
        return <CapitalCalls 
                  data={operations.filter(op => op.type === 'call')} 
                  onAddRow={handleAddRow}
                  onRemoveRow={handleRemoveRow}
                  onUpdateRow={handleUpdateRow}
               />;
      case 'dist': 
        return <Distributions 
                  data={distributions}
                  loading={loading}
                  error={error}
               />;
      case 'all_operations':
      default: 
        return <AllOperations data={operations} />;
    }
  };

  return (
    <div className="fund-flows-layout-wrapper">
      <div className="flows-tab-container">
        <div className="flows-toolbar">
          <div className="flows-view-selector">
            <button 
              className={`view-badge ${activeView === 'all_operations' ? 'active' : ''}`} 
              onClick={() => setActiveView('all_operations')}
            >
              All Operations
            </button>
            <button 
              className={`view-badge ${activeView === 'calls' ? 'active' : ''}`} 
              onClick={() => setActiveView('calls')}
            >
              Capital Calls
            </button>
            <button 
              className={`view-badge ${activeView === 'dist' ? 'active' : ''}`} 
              onClick={() => setActiveView('dist')}
            >
              Distributions
            </button>
          </div>

          <div className="flows-actions">
            {(activeView === 'all_operations' || activeView === 'calls') && (
              <button 
                className="action-btn btn-add" 
                onClick={() => setIsModalOpen(true)}
              >
                <PlusIcon />
                <span>Create Operation</span>
              </button>
            )}
          </div>
        </div>

        <div className="flows-section-content">
          {renderActiveView()}
        </div>
      </div>

      <AddOperation 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveOperation} 
      />
    </div>
  );
}

export default FundFlows;