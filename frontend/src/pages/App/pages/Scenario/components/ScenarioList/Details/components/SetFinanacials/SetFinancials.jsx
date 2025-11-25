import React, { useState } from 'react';
import MFTable from './MFTable.svg';
import DFees from './DFees.svg'; 
import RealizedTable from './RealizedTable.svg';
import { DownloadIcon } from './Icons'; 
import './SetFinancials.css';

function SetFinancials() {
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
            <DownloadIcon width={20} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* === DEFAULT CONTENT === */}
      {/* Rendered when activeTab is NULL OR DILIGENCE (so it stays visible behind diligence) */}
      {activeTab !== 'management' && (
         <>
          <div className="fin-sub-toolbar">
             <button className="sub-btn realized">Realized</button>
             <button className="sub-btn projected">Projected</button>
           </div>
           <div className="fin-content-wrapper">
              <div className="table-image-wrapper">
                 <img src={RealizedTable} alt="Realized Data Table" />
              </div>
           </div>
         </>
      )}

      {/* === OVERLAY 1: MANAGEMENT FEES (Full Screen White Override) === */}
      {activeTab === 'management' && (
        <div className="fullscreen-overlay">
          <button className="overlay-floating-close" onClick={handleClose}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="overlay-content">
            <img src={MFTable} alt="Management Fees Table" />
          </div>
        </div>
      )}

      {/* === OVERLAY 2: DUE DILIGENCE FEES (Dimmed Modal on Top) === */}
      {activeTab === 'diligence' && (
        <div className="modal-overlay">
          <button className="overlay-floating-close" onClick={handleClose}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {/* Content Container to center the SVG */}
          <div style={{ position: 'relative', maxWidth: '80%' }}>
            <img src={DFees} alt="Due Diligence Fees Table" style={{ display: 'block', maxWidth: '100%', borderRadius: '8px' }} />
          </div>
        </div>
      )}

    </div>
  );
}

export default SetFinancials;