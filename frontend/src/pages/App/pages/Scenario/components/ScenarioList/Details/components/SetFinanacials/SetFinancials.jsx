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
    <div className="sf-financials-page-layout">
      <div className="sf-financials-main-content">
        <div className="sf-fin-toolbar">
          <div className="sf-fin-view-selector">
            <button
              className={`sf-view-badge ${activeTab === 'management' ? 'active' : ''}`}
              onClick={() => setActiveTab('management')}
            >
              Management fees
            </button>
            <button
              className={`sf-view-badge ${activeTab === 'diligence' ? 'active' : ''}`}
              onClick={() => setActiveTab('diligence')}
            >
              Due diligence fees
            </button>
          </div>
          <div className="sf-fin-actions">
            <button className="sf-action-btn sf-btn-download">
              <DownloadIcon />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="sf-fin-sub-toolbar">
          <div className="sf-legend-wrapper">
            <span className="sf-legend-text sf-realized">Realized</span>
            <span className="sf-legend-text sf-projected">Projected</span>
          </div>
        </div>

        <div className="sf-fin-content-wrapper">
          <FinancialTable scenarioId={scenarioId} />
        </div>
      </div>

      {activeTab === 'management' && (
        <div className="sf-overlay fullscreen">
          <button className="sf-overlay-floating-close" onClick={handleClose}>
            <CloseIcon />
          </button>
          <div className="sf-overlay-content">
            <ManagementFees />
          </div>
        </div>
      )}

      {activeTab === 'diligence' && (
        <div className="sf-overlay modal">
          <div className="sf-modal-content">
            <DDFees onClose={handleClose} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SetFinancials;
