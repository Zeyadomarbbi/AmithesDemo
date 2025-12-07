import React, { useState } from 'react';
import AllOperationsTable from './AllOperationsTable.svg';
import DistributionTable from './DistributionTable.svg';
import CapitalCallTable from './CapitalCallTable.svg';
import { DownloadIcon, PlusIcon } from './Icons';
import './FundFlows.css';

function FundFlows({ scenarioId })  {
  const [activeView, setActiveView] = useState('control');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operationType, setOperationType] = useState('call'); // 'call' or 'dist'

  // ... (getViewContent remains the same)
  const getViewContent = () => {
    switch (activeView) {
      case 'calls': return { image: CapitalCallTable, alt: 'Capital Calls Table' };
      case 'dist': return { image: DistributionTable, alt: 'Distributions Table' };
      case 'control':
      default: return { image: AllOperationsTable, alt: 'All Operations Table' };
    }
  };
  const currentView = getViewContent();

  return (
    <div className="flows-tab-container">
      {/* ... (Toolbar code remains the same) ... */}
      <div className="flows-toolbar">
         {/* ... View Selectors ... */}
         <div className="flows-view-selector">
          <button className={`view-badge ${activeView === 'control' ? 'active' : ''}`} onClick={() => setActiveView('control')}>Control Mode</button>
          <button className={`view-badge ${activeView === 'calls' ? 'active' : ''}`} onClick={() => setActiveView('calls')}>Capital Calls</button>
          <button className={`view-badge ${activeView === 'dist' ? 'active' : ''}`} onClick={() => setActiveView('dist')}>Distributions</button>
        </div>
        
        {/* ... Actions ... */}
        <div className="flows-actions">
          <button className="action-btn btn-download">
             <DownloadIcon width={20} />
             <span>Download</span>
          </button>
          <button className="action-btn btn-add" onClick={() => setIsModalOpen(true)}>
            <PlusIcon width={20} />
            <span>Create operation</span>
          </button>
        </div>
      </div>

      <div className="flows-section table-view">
        <div className="table-image-wrapper">
          <img src={currentView.image} alt={currentView.alt} />
        </div>
      </div>

      {/* === MODAL OVERLAY === */}
      {isModalOpen && (
        <div className="modal-overlay">
          
          {/* Main Modal Frame (Mobile) */}
          <div className="modal-container">
            
            {/* 1. Close Button Row */}
            <div className="modal-close-row">
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                {/* SVG for X icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#375A89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* 2. Main Content Frame */}
            <div className="modal-content">
              
              {/* Header: Title + Toggles */}
              <div className="modal-header-group">
                <h3 className="modal-title">Add an operation</h3>
                
                <div className="modal-toggles">
                  {/* Option 1: Capital Call */}
                  <div 
                    className={`toggle-card ${operationType === 'call' ? 'selected' : ''}`}
                    onClick={() => setOperationType('call')}
                  >
                    <div className="radio-circle"></div>
                    <div className="toggle-badge yellow">Capital call</div>
                  </div>
                  
                  {/* Option 2: Distribution */}
                  <div 
                    className={`toggle-card ${operationType === 'dist' ? 'selected' : ''}`}
                    onClick={() => setOperationType('dist')}
                  >
                    <div className="radio-circle"></div>
                    <div className="toggle-badge blue">Distribution</div>
                  </div>
                </div>
              </div>

              {/* Inputs Group */}
              <div className="modal-inputs-group">
                
                {/* Date Input */}
                <div className="input-field-col">
                  <label>Date</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="DD/MM/YYYY" />
                  </div>
                </div>

                {/* Amount Input */}
                <div className="input-field-col">
                  <label>Amount</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="0.00" />
                    {/* Euro Icon SVG */}
                    <div className="input-icon-euro">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 10h12"></path>
                          <path d="M4 14h9"></path>
                          <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"></path>
                       </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="modal-footer">
                <button className="modal-btn btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button className="modal-btn btn-save">
                  Save
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FundFlows;