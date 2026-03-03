import React, { useState } from 'react';
import './FundFlows.css';

// Sub-components
import AllOperations from './AllOperations/AllOperations';
import CapitalCalls from './CapitalCalls/CapitalCalls';
import Distributions from './Distributions/Distributions';
import AddOperation from './AddOperation/AddOperation';
import Toast from '../../../../../../../components/Toast/Toast';
import { PermissionGate } from '../../../../../../../../../hooks/Auth/PermissionGate';
import { PlusIcon } from './Icons';

// Hooks
import { useScenarioFFCapitalCall } from '../../../../../../../hooks/Scenarios/useScenarioFFCapitalCall';

function FundFlows({ fundId, scenarioId }) {
  const [activeView, setActiveView] = useState('all_operations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState(null);

  // Hook instance used ONLY for the 'Add Operation' modal logic (creating the entry)
  // The actual list display is handled by the children
  const { createCustomDate } = useScenarioFFCapitalCall(fundId, scenarioId);

  // Handle modal save (Creation of new operation)
  const handleModalCreateOperation = () => {
    // 1. Signal ALL children to refresh 
    // (CapitalCalls, Distributions, and AllOperations will all catch this)
    setRefreshTrigger(prev => prev + 1);
    
    setToast({
      type: 'success',
      title: 'Operation created',
      message: 'New entry added successfully'
    });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'calls': 
        return <CapitalCalls 
                 fundId={fundId}
                 scenarioId={scenarioId}
                 refreshTrigger={refreshTrigger}
               />;
      case 'dist': 
        return <Distributions 
                 fundId={fundId} 
                 scenarioId={scenarioId} 
                 refreshTrigger={refreshTrigger} 
               />;
      case 'all_operations':
      default: 
        return <AllOperations 
                 fundId={fundId} 
                 scenarioId={scenarioId} 
                 refreshTrigger={refreshTrigger}
               />;
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
          <PermissionGate>
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
          </PermissionGate>
        </div>

        <div className="flows-section-content">
          {renderActiveView()}
        </div>
      </div>

      <AddOperation 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        fundId={fundId}
        scenarioId={scenarioId}
        onCreateDate={async (payload) => {
          // Use hook to create data on server
          await createCustomDate(payload);
          // Trigger the UI refresh
          handleModalCreateOperation();
        }}
      />

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

export default FundFlows;