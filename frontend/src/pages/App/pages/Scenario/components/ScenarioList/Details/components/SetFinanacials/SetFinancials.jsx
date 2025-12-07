import React, { useState } from 'react';
import FinancialTable from './FinancialTable/FinancialTable';
import './SetFinancials.css';

function SetFinancials({ scenarioId }) {
  const [activeTab, setActiveTab] = useState(null);
  const handleClose = () => setActiveTab(null);

  return (
    <div className="financials-tab-container">
      
      {/* === TOP TOOLBAR === */}
      <div className="fin-toolbar">
        <div className="fin-view-selector">
          <button 
            className={`view-badge ${activeTab === 'management' ? 'active' : ''}`}
            onClick={() => setActiveTab('management')}
          >
            Management fees
          </button>
          <button 
            className={`view-badge ${activeTab === 'diligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('diligence')}
          >
            Due diligence fees
          </button>
        </div>
        <div className="fin-actions">
          <button className="action-btn btn-download">
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* === DEFAULT CONTENT === */}
      {activeTab !== 'management' && (
         <>
          <div className="fin-sub-toolbar">
             {/* Text-only Legend */}
             <div className="legend-wrapper">
                <span className="legend-text realized">Realized</span>
                <span className="legend-text projected">Projected</span>
             </div>
           </div>
           
           <div className="fin-content-wrapper">
              <FinancialTable scenarioId={scenarioId} />
           </div>
         </>
      )}

      {/* === OVERLAY 1: MANAGEMENT FEES === */}
      {activeTab === 'management' && (
        <div className="fullscreen-overlay">
          <button className="overlay-floating-close" onClick={handleClose}>
            X
          </button>
          <div className="overlay-content">
            <div>Management Fees Data Placeholder</div>
          </div>
        </div>
      )}

      {/* === OVERLAY 2: DUE DILIGENCE FEES === */}
      {activeTab === 'diligence' && (
        <div className="modal-overlay">
          <button className="overlay-floating-close" onClick={handleClose}>
            X
          </button>
          
          <div style={{ position: 'relative', width: '80%', background: '#fff', padding: '20px', borderRadius: '8px' }}>
            <div>Due Diligence Data Placeholder</div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SetFinancials;