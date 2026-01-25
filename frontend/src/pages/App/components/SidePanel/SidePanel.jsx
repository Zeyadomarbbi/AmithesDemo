import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import AmethisLogo from '../../../../assets/amethis-logo.svg';
import { useFundData } from '../../hooks/useFundData'; 
import { useActiveFund } from '../../hooks/useActiveFund';
import { 
  DashboardIcon, PortfolioIcon, FinancialsIcon, ScenariosIcon,
  LPsIcon, AllFundsIcons, AdminsIcon, HelpIcon,
  SettingsIcon, ChevronDownIcon, ProfileExpandIcon,
  SearchIcon
} from '../Icons';

import './SidePanel.css';

function SidePanel() {
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  
  // 1. Get Global Data & Current State
  const { funds } = useFundData(); // Access global list of funds
  const activeFundId = useActiveFund(); // Get current ID from URL (Source of Truth)
  
  const location = useLocation();
  const navigate = useNavigate();

  // 2. Determine Current Section (e.g., 'dashboard', 'settings', 'portfolio')
  // URL structure: /funds/:id/:section
  const pathSegments = location.pathname.split('/');
  // pathSegments[0] is empty, [1] is 'funds', [2] is id, [3] is section
  const currentSection = pathSegments[1] === 'funds' && pathSegments[3] 
    ? pathSegments[3] 
    : 'dashboard'; // Default to dashboard if no section found

  // 3. derive the Active Fund Object
  // We compare as strings to avoid type mismatch (e.g., "1" vs 1)
  const currentFund = funds.length > 0 
    ? (funds.find(f => f.id.toString() === activeFundId?.toString()) || funds[0]) 
    : { name: 'Loading...', id: '' }; 

  // 4. Handle Fund Switching
  const handleSwitchFund = (newFundId) => {
    // This updates the URL. The rest of the app listens to the URL change.
    navigate(`/funds/${newFundId}/${currentSection}`);
    setIsFundSelectorOpen(false);
  };

  return (
    <div className="side-panel">
      
      {/* === FRAME 1: TOP SECTION === */}
      <div className="frame-1">
        <div className="logo-container">
          <img src={AmethisLogo} alt="Amethis Logo" className="logo-img" />
        </div>

        <div className="frame-1-2">
          {/* FUND SELECTOR */}
          <div className="fund-selector-container">
            <div className="fund-selector-button">
              <div className="fund-info-section">
                <span className="side-panel-fund-name">{currentFund.name}</span>
                
                <Link 
                  to={currentFund.id ? `/funds/${currentFund.id}/settings` : '#'} 
                  className="fund-setup-row"
                >
                  <SettingsIcon />
                  <span className="fund-setup">Fund setup</span>
                </Link>
              </div>

              <div 
                className={`dropdown-arrow-icon ${isFundSelectorOpen ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); 
                  setIsFundSelectorOpen(!isFundSelectorOpen);
                }}
              >
                <ChevronDownIcon />
              </div>
            </div>
            
            {/* DROPDOWN MENU */}
            {isFundSelectorOpen && (
              <div className="fund-selector-dropdown" onClick={(e) => e.stopPropagation()}>
                
                <div className="dropdown-search-container">
                  <SearchIcon />
                  <input type="text" placeholder="Search" className="dropdown-search-input" />
                </div>

                <div className="dropdown-action-row">
                  <Link to="/all-funds" className="see-all-funds-link">
                    See all funds
                  </Link>
                </div>

                <div className="dropdown-scroll">
                  {funds.map(fund => (
                    <div
                      key={fund.id}
                      className={`dropdown-item ${fund.id.toString() === activeFundId?.toString() ? 'selected' : ''}`}
                      onClick={() => handleSwitchFund(fund.id)}
                    >
                      <div className="dropdown-item-content">
                        <span className="item-name">{fund.name}</span> 
                        <span className="item-code">{fund.code}</span>
                      </div>
                      {/* Optional: Add a checkmark icon if selected */}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* NAVIGATION LINKS */}
          {/* Using NavLink automatically handles 'active' styling based on URL */}
          <nav className="side-panel-nav">
            <NavLink to={`/funds/${activeFundId}/dashboard`} className="nav-item">
              <DashboardIcon /> <span>Dashboard</span>
            </NavLink>
            <NavLink to={`/funds/${activeFundId}/lps-statement`} className="nav-item">
              <LPsIcon /> <span>LPs Statement</span>
            </NavLink>
            <NavLink to={`/funds/${activeFundId}/portfolio`} className="nav-item">
              <PortfolioIcon /> <span>Portfolio</span>
            </NavLink>
            <NavLink to={`/funds/${activeFundId}/financials`} className="nav-item">
              <FinancialsIcon /> <span>Financials</span>
            </NavLink>
            <NavLink to={`/funds/${activeFundId}/scenarios`} className="nav-item">
              <ScenariosIcon /> <span>Scenarios</span>
            </NavLink>
          </nav>
          
          <div className="sidebar-separator"></div>

        </div>
      </div>

      <div className="frame-2-waves"></div>

      {/* === FRAME 3: FOOTER SECTION === */}
      <div className="frame-3">
        <div className="footer-links">
          <NavLink to="/all-funds" className="footer-item">
              <AllFundsIcons /> <span>All funds</span>
          </NavLink>
          <NavLink to="/admins" className="footer-item">
              <AdminsIcon /> <span>Admins</span>
          </NavLink>
          <NavLink to="/help" className="footer-item">
              <HelpIcon /> <span>Help</span>
          </NavLink>
        </div>

        <div className="user-profile">
          <div className="user-avatar">MR</div>
          <div className="user-details">
            <span className="user-name">Mathieu Rigot</span>
            <span className="user-email">mathieu.rigot@likifunds.com</span>
          </div>
          <ProfileExpandIcon />
        </div>
      </div>
    </div>
  );
}

export default SidePanel;