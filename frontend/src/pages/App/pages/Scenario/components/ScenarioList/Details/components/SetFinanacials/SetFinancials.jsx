import React, { useState } from 'react';
import FinancialTable from './FinancialTable/FinancialTable';
import ManagementFees from './ManagementFees/ManagementFees';
import DDFees from './DDFees/DDFees';
import { CloseIcon, DownloadIcon } from './Icons'; 
import './SetFinancials.css';

function SetFinancials({ scenarioId }) {
  const [activeTab, setActiveTab] = useState(null);
  const handleClose = () => setActiveTab(null);

  return (
    <div className="financials-page-layout">
      
      {/* DIRECTLY WRAP CONTENT HERE */}
      <div className="financials-main-content">
          
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
                <DownloadIcon />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* === MAIN CONTENT === */}
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

      {/* === OVERLAYS === */}
      {activeTab === 'management' && (
        <div className="fullscreen-overlay">
          <button className="overlay-floating-close" onClick={handleClose}>
            <CloseIcon className="close-icon-svg" />
          </button>
          <div className="overlay-content">
            <ManagementFees />
          </div>
        </div>
      )}

      {activeTab === 'diligence' && (
        <div className="modal-overlay">
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
            <DDFees onClose={handleClose} />
          </div>
        </div>
      )}

    </div>
  );
}

export default SetFinancials;