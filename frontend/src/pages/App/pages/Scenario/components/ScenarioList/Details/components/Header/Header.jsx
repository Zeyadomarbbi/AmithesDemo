import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from '../../../Icons'; 

// Sub-components
import Tabs from './Tabs/Tabs';
import HeaderActionsMenu from './HeaderActionsMenu/HeaderActionsMenu';
import DuplicateModal from './DuplicateModal/DuplicateModal';
import Toast from './Toast/Toast';

import './Header.css';

function Header({ 
  fundId,
  title,
  scenarioId,
  author, 
  date, 
  description, 
  activeTab,
  onBack 
}) {
  const navigate = useNavigate();
  
  // State for Modals and Toasts
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Handlers
  const handleDuplicateSave = () => {
    setIsDuplicateModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleTabChange = (newTab) => {
    const tabKey = newTab.toLowerCase();
    const baseUrl = `/funds/${fundId}/scenarios/${scenarioId}`;
    
    if (tabKey === 'portfolio') navigate(`${baseUrl}/portfolio`);
    else if (tabKey === 'setfinancials') navigate(`${baseUrl}/setfinancials`);
    else if (tabKey === 'fundflows') navigate(`${baseUrl}/fundflows`);
  };

  return (
    <div className="header-container">
      
      {/* === SECTION 1: INFO === */}
      <div className="header-info-section">
        
        <div className="header-titles-col">
          {/* Back Button */}
          <div 
            className="back-button-wrapper" 
            onClick={onBack ? onBack : () => navigate(`/funds/${fundId}/scenarios`)}
          >
            <div className="back-icon-box"><BackIcon width={16} /></div>
            <span className="back-text">Back</span>
          </div>

          {/* Title & Meta */}
          <div className="title-row">
            <div className="title-group">
              <h2 className="scenario-title">{title}</h2>
              <span className="scenario-meta">Created on {date} by {author}</span>
            </div>
            <span className="scenario-desc">{description}</span>
          </div>
        </div>

        {/* === RIGHT ACTIONS (The Menu Module) === */}
        <HeaderActionsMenu 
          onDuplicate={() => setIsDuplicateModalOpen(true)}
          onEdit={() => console.log("Edit clicked")}
          onDelete={() => console.log("Delete clicked")}
        />

      </div>

      {/* === SECTION 2: TABS === */}
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* === MODALS & NOTIFICATIONS === */}
      <DuplicateModal 
        isOpen={isDuplicateModalOpen}
        currentTitle={title}
        onClose={() => setIsDuplicateModalOpen(false)}
        onSave={handleDuplicateSave}
      />

      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />

    </div>
  );
}

export default Header;