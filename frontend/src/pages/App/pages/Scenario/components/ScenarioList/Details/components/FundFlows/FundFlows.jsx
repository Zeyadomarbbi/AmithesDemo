import React, { useState } from 'react';
import './FundFlows.css';

// Sub-components
import AllOperations from './AllOperations/AllOperations';
import CapitalCalls from './CapitalCalls/CapitalCalls';
import Distributions from './Distributions/Distributions';
import AddOperation from './AddOperation/AddOperation'; 

import { DownloadIcon, PlusIcon } from './Icons';

// Initial Mock Data
const INITIAL_DATA = [
  // Calls
  { id: 1, type: 'call', date: '01/02/2025', flow: '11 500 000', investment: '10 000 000', mgmtFees: '500 000', structFees: '500 000', dueDil: '300 000', other: '200 000', capCalled: '11.50%' },
  { id: 2, type: 'call', date: '01/04/2025', flow: '1 050 000', investment: '-', mgmtFees: '500 000', structFees: '-', dueDil: '500 000', other: '50 000', capCalled: '1.05%' },
  { id: 3, type: 'call', date: '01/08/2025', flow: '2 500 000', investment: '2 000 000', mgmtFees: '500 000', structFees: '-', dueDil: '-', other: '-', capCalled: '2.50%' },
  { id: 4, type: 'call', date: '01/10/2025', flow: '400 000', investment: '-', mgmtFees: '-', structFees: '-', dueDil: '400 000', other: '-', capCalled: '0.40%' },
  // Distributions
  { id: 101, type: 'dist', date: '01/01/2027', flow: '17 500 000', divestment: '17 000 000', dividends: '500 000', recycling: '0', other: '-', distPercent: '17.50%' },
  { id: 102, type: 'dist', date: '01/03/2027', flow: '350 000', divestment: '-', dividends: '300 000', recycling: '0', other: '50 000', distPercent: '0.35%' },
];

function FundFlows({ scenarioId }) {
  const [activeView, setActiveView] = useState('all_operations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operations, setOperations] = useState(INITIAL_DATA);

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
      type: type, // 'call' or 'dist'
      date: `01/01/${year}`, // Default to Jan 1st of that year
      flow: '-', investment: '-', mgmtFees: '-', structFees: '-', dueDil: '-', other: '-', capCalled: '0.00%', distPercent: '0.00%', divestment: '-', dividends: '-', recycling: '-'
    };
    setOperations([...operations, newOp]);
  };

  // 2. Remove the last row of a specific year and type
  const handleRemoveRow = (year, type) => {
    // Find all rows for this year & type
    const yearRows = operations.filter(op => op.type === type && op.date.endsWith(year));
    
    // If only 1 or 0 rows left, don't remove
    if (yearRows.length <= 1) return;

    // Get the ID of the last one
    const lastRowId = yearRows[yearRows.length - 1].id;

    // Remove it from the main list
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
                  data={operations.filter(op => op.type === 'dist')} 
                  // Pass handlers if Distributions needs add/remove too
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
            <button className={`view-badge ${activeView === 'all_operations' ? 'active' : ''}`} onClick={() => setActiveView('all_operations')}>All Operations</button>
            <button className={`view-badge ${activeView === 'calls' ? 'active' : ''}`} onClick={() => setActiveView('calls')}>Capital Calls</button>
            <button className={`view-badge ${activeView === 'dist' ? 'active' : ''}`} onClick={() => setActiveView('dist')}>Distributions</button>
          </div>
          <div className="flows-actions">
            <button className="action-btn btn-download"><DownloadIcon /><span>Download</span></button>
            <button className="action-btn btn-add" onClick={() => setIsModalOpen(true)}><PlusIcon /><span>Create Operation</span></button>
          </div>
        </div>
        <div className="flows-section-content">
          {renderActiveView()}
        </div>
      </div>
      <AddOperation isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveOperation} />
    </div>
  );
}

export default FundFlows;