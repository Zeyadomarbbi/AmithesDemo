import React, { useState } from 'react';
import './FundFlows.css';

// Sub-components
import AllOperations from './AllOperations/AllOperations';
import CapitalCalls from './CapitalCalls/CapitalCalls';
import Distributions from './Distributions/Distributions';
import AddOperation from './AddOperation/AddOperation'; // New Module

// Icons
import { DownloadIcon, PlusIcon } from './Icons';

function FundFlows({ scenarioId }) {
  const [activeView, setActiveView] = useState('all_operations');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'calls': return <CapitalCalls scenarioId={scenarioId} />;
      case 'dist': return <Distributions scenarioId={scenarioId} />;
      case 'all_operations':
      default: return <AllOperations scenarioId={scenarioId} />;
    }
  };

  const handleSaveOperation = (data) => {
    console.log("Saving operation:", data);
    // Add logic to save data to backend
    setIsModalOpen(false);
  };

  return (
    <div className="fund-flows-layout-wrapper">
      <div className="flows-tab-container">
        
        {/* --- TOOLBAR --- */}
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
            <button className="action-btn btn-download">
               <DownloadIcon />
               <span>Download</span>
            </button>

            <button className="action-btn btn-add" onClick={() => setIsModalOpen(true)}>
              <PlusIcon />
              <span>Create Operation</span>
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flows-section-content">
          {renderActiveView()}
        </div>
      </div>

      {/* --- MODAL --- */}
      <AddOperation 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOperation}
      />

    </div>
  );
}

export default FundFlows;