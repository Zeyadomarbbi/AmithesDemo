import React, { useState } from 'react';
import FinancialTable from './FinancialTable/FinancialTable';
import ManagementFees from './ManagementFees/ManagementFees';
import DDFees from './DDFees/DDFees';
import { CloseIcon } from './Icons'; 
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

      {/* === ALWAYS RENDER DEFAULT CONTENT (Background Table) === */}
      <div className="fin-main-content">
         <div className="fin-sub-toolbar">
            <div className="legend-wrapper">
               <span className="legend-text realized">Realized</span>
               <span className="legend-text projected">Projected</span>
            </div>
         </div>
         
         <div className="fin-content-wrapper">
            <FinancialTable scenarioId={scenarioId} />
         </div>
      </div>

      {/* === OVERLAY 1: MANAGEMENT FEES (Fullscreen) === */}
      {activeTab === 'management' && (
        <div className="fullscreen-overlay" style={{background: 'rgba(255,255,255,1)'}}>
          <button className="overlay-floating-close" onClick={handleClose}>
            <CloseIcon className="close-icon-svg" />
          </button>
          <div className="overlay-content">
            <ManagementFees />
          </div>
        </div>
      )}

      {/* === OVERLAY 2: DUE DILIGENCE FEES (Modal Box) === */}
      {activeTab === 'diligence' && (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            zIndex: 1000,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)' /* Gray dimming background */
        }}>
          
          {/* Modal Container Wrapper */}
          <div style={{ 
              position: 'relative', 
              width: '80%', 
              maxWidth: '1000px', 
              background: '#fff', 
              padding: '20px', 
              borderRadius: '8px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            {/* DDFees now handles its own close button inside */}
            <DDFees onClose={handleClose} />
          </div>
        </div>
      )}

    </div>
  );
}

export default SetFinancials;