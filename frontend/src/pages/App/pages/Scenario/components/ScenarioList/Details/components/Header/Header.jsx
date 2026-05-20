import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from '/src/components/Icons/DirectionIcons';

// Sub-components
import Tabs from './Tabs/Tabs';

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

  // Handlers
  const handleTabChange = (newTab) => {
      const tabKey = newTab.toLowerCase();
      
      const baseUrl = `/funds/${fundId}/scenario-dashboard/scenario-details/${scenarioId}`;

       if (tabKey === 'portfolio') {
          navigate(`${baseUrl}/portfolio`);
      } else if (tabKey === 'set-financials') {
          navigate(`${baseUrl}/set-financials`);
      } else if (tabKey === 'fund-flows') {
          navigate(`${baseUrl}/fund-flows`);
      }
  };

  return (
    <div className="scenario-header-container">
      
      {/* === SECTION 1: INFO === */}
      <div className="scenario-header-info-section">
        
        <div className="scenario-header-titles-col">
          {/* Back Button */}
          <div 
            className="scenario-header-back-button-wrapper" 
            onClick={onBack ? onBack : () => navigate(`/funds/${fundId}/scenario-dashboard`)}
          >
            <div className="scenario-header-back-icon-box"><BackIcon width={16} /></div>
            <span className="scenario-header-back-text">Back</span>
          </div>

          {/* Title & Meta */}
          <div className="scenario-header-title-row">
            <div className="scenario-header-title-group">
              <h2 className="scenario-header-title">{title}</h2>
              <span className="scenario-header-meta">Created on {date} - Created by {author}</span>
            </div>
            <span className="scenario-header-desc">{description}</span>
          </div>
        </div>

      </div>

      {/* === SECTION 2: TABS === */}
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />

    </div>
  );
}

export default Header;