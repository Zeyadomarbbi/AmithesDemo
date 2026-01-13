import React, { useState } from 'react';
import './FundFlows.css';

// Import the 3 new modules
import AllOperations from './AllOperations/AllOperations';
import CapitalCalls from './CapitalCalls/CapitalCalls';
import Distributions from './Distributions/Distributions';
import { DownloadIcon, PlusIcon, CalendarIcon } from './Icons';
import DatePicker from '../../../../../../../../../components/DatePicker';

function FundFlows({ scenarioId })  {
  const [activeView, setActiveView] = useState('all_operations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operationType, setOperationType] = useState('call');
  
  // State for DatePicker in Modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const renderActiveView = () => {
    switch (activeView) {
      case 'calls': return <CapitalCalls scenarioId={scenarioId} />;
      case 'dist': return <Distributions scenarioId={scenarioId} />;
      case 'all_operations':
      default: return <AllOperations scenarioId={scenarioId} />;
    }
  };

  const handleApplyDate = (selection) => {
    if (selection && selection.start) {
      setSelectedDate(selection.start);
    }
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toggleModal = (isOpen) => {
    setIsModalOpen(isOpen);
    if (!isOpen) {
        setShowDatePicker(false);
        setSelectedDate(null);
        setOperationType('call');
    }
  };

  return (
    <div className="fund-flows-layout-wrapper">

      {/* === 2. MAIN CONTENT CONTAINER === */}
      <div className="flows-tab-container">

        {/* --- TOOLBAR --- */}
        <div className="flows-toolbar">
          <div className="flows-view-selector">
            <button className={`view-badge ${activeView === 'all_operations' ? 'active' : ''}`} onClick={() => setActiveView('all_operations')}>All Operations</button>
            <button className={`view-badge ${activeView === 'calls' ? 'active' : ''}`} onClick={() => setActiveView('calls')}>Capital Calls</button>
            <button className={`view-badge ${activeView === 'dist' ? 'active' : ''}`} onClick={() => setActiveView('dist')}>Distributions</button>
          </div>

          <div className="flows-actions">
            <button className="action-btn btn-download">
               <DownloadIcon />
               <span>Download</span>
            </button>

            <button className="action-btn btn-add" onClick={() => toggleModal(true)}>
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

      {/* === 3. MODAL (Overlay) === */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-close-row">
              <button className="close-btn" onClick={() => toggleModal(false)}>X</button>
            </div>

            <div className="modal-content">
              <div className="modal-header-group">
                <h3 className="modal-title">Add an operation</h3>
                <div className="modal-toggles">
                  <div className={`toggle-card ${operationType === 'call' ? 'selected' : ''}`} onClick={() => setOperationType('call')}>
                    <div className="radio-circle"></div>
                    <div className="toggle-badge yellow">Capital call</div>
                  </div>
                  <div className={`toggle-card ${operationType === 'dist' ? 'selected' : ''}`} onClick={() => setOperationType('dist')}>
                    <div className="radio-circle"></div>
                    <div className="toggle-badge blue">Distribution</div>
                  </div>
                </div>
              </div>

              <div className="modal-inputs-group">
                {/* DATE FIELD */}
                <div className="input-field-col" style={{ position: 'relative' }}>
                  <label>Date</label>
                  <div 
                    className="input-wrapper date-picker-trigger" 
                    onClick={() => setShowDatePicker(true)}
                    style={{ cursor: 'pointer', paddingRight: '36px' }}
                  >
                    <input 
                        type="text" 
                        placeholder="DD/MM/YYYY" 
                        value={formatDateForDisplay(selectedDate)}
                        readOnly
                        style={{ pointerEvents: 'none', width: '100%' }}
                    />
                    <div className="modal-input-icon">
                        <CalendarIcon />
                    </div>
                  </div>
                  
                  {/* DatePicker Popover */}
                  {showDatePicker && (
                    <div className="modal-datepicker-popover">
                        <DatePicker 
                            onClose={() => setShowDatePicker(false)}
                            onApply={handleApplyDate}
                            initialDate={selectedDate || new Date()} 
                        />
                    </div>
                  )}
                </div>
                
                {/* AMOUNT FIELD */}
                <div className="input-field-col">
                  <label>Amount</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="0.00" />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-btn btn-cancel" onClick={() => toggleModal(false)}>Cancel</button>
                <button className="modal-btn btn-save">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FundFlows;