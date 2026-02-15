// FundFlows.js - Updated
import React, { useState } from 'react';
import './FundFlows.css';

// Sub-components
import AllOperations from './AllOperations/AllOperations';
import CapitalCalls from './CapitalCalls/CapitalCalls';
import Distributions from './Distributions/Distributions';
import AddOperation from './AddOperation/AddOperation'; 
import { useScenarioFFDistribution } from './utils/useScenarioFFDistribution';
import { useScenarioFFCapitalCall } from './utils/useScenarioFFCapitalCall';
import Toast from '../../../../../../../components/Toast/Toast';

import { DownloadIcon, PlusIcon } from './Icons';

function FundFlows({ fundId, scenarioId }) {
  const [activeView, setActiveView] = useState('all_operations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch distribution data from API
  const { 
    distributions, 
    loading: distLoading, 
    error: distError 
  } = useScenarioFFDistribution(fundId, scenarioId);

  // Fetch capital call data from API
  const { 
    capitalCalls, 
    loading: ccLoading, 
    error: ccError,
    createCustomDate,
    deleteEntry,
    updateEntry,
    refresh
  } = useScenarioFFCapitalCall(fundId, scenarioId);

  // Handle save for capital calls
  const handleCapitalCallSave = async (changes) => {
    try {
      for (const [id, updateData] of Object.entries(changes)) {
        await updateEntry(id, { date: updateData.date });
      }
      
      await refresh(); // Refresh data after save
      
      setToast({
        type: 'success',
        title: 'Changes saved',
        message: `${Object.keys(changes).length} date${Object.keys(changes).length > 1 ? 's' : ''} updated successfully`
      });
      
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      setToast({
        type: 'error',
        title: 'Save failed',
        message: 'Unable to save changes. Please try again.'
      });
      return false;
    }
  };

  // Handle modal save (create new operation)
  const handleModalCreateOperation = async () => {
    await refresh(); // Refresh to show new entry
    
    setToast({
      type: 'success',
      title: 'Operation created',
      message: 'New capital call entry added successfully'
    });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'calls': 
        return <CapitalCalls 
                  fundId={fundId}
                  scenarioId={scenarioId}
                  data={capitalCalls}
                  loading={ccLoading}
                  error={ccError}
                  onCreateDate={createCustomDate}
                  onDeleteEntry={deleteEntry}
                  onSave={handleCapitalCallSave}
               />;
      case 'dist': 
        return <Distributions 
                  data={distributions}
                  loading={distLoading}
                  error={distError}
               />;
      case 'all_operations':
      default: 
        return <AllOperations data={[...capitalCalls, ...distributions]} />;
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
        fundId={fundId}
        scenarioId={scenarioId}
        onCreateDate={async (payload) => {
          await createCustomDate(payload);
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