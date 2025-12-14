import React, { useState } from 'react';
import { Link, NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import AmethisLogo from '../../../../assets/amethis-logo.svg';
import { useActiveFund } from '../../hooks/useActiveFund';
import { 
  DashboardIcon, PortfolioIcon, FinancialsIcon, ScenariosIcon,
  LPsIcon, AllFundsIcons, AdminsIcon, HelpIcon,
  SettingsIcon, ChevronDownIcon, ProfileExpandIcon,
  SearchIcon
} from '../Icons';

import './SidePanel.css';

// CHANGED: Accept funds as a prop with a default empty array
function SidePanel({ funds = [] }) {
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const activeFundId = useActiveFund();
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/');
  const currentSection = pathSegments[1] === 'funds' && pathSegments[3] ? pathSegments[3] : 'dashboard';

  // REMOVED: Hardcoded funds array

  // CHANGED: Use the passed funds prop. Added safety check for empty array.
  const currentFund = funds.length > 0 
    ? (funds.find(f => f.id.toString() === activeFundId.toString()) || funds[0]) 
    : { name: 'Loading...', id: '' }; // Fallback object if data hasn't loaded
  
  return (
    <div className="side-panel">
      
      {/* === FRAME 1: TOP SECTION === */}
      <div className="frame-1">
        <div className="logo-container">
          <img src={AmethisLogo} alt="Amethis Logo" className="logo-img" />
        </div>

        <div className="frame-1-2">
          <div className="fund-selector-container">
            <div className="fund-selector-button">
              <div className="fund-info-section">
                <span className="fund-name">{currentFund.name}</span>
                
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
            
            {isFundSelectorOpen && (
              <div className="fund-selector-dropdown" onClick={(e) => e.stopPropagation()}>
                
                <div className="dropdown-search-container">
                  <SearchIcon />
                  <input type="text" placeholder="Search" className="dropdown-search-input" />
                </div>

                <div className="dropdown-action-row">
                  <Link to="/allfunds" className="see-all-funds-link">
                    See all funds
                  </Link>
                </div>

                <div className="dropdown-scroll">
                  {/* CHANGED: Mapping over the passed funds prop */}
                  {funds.map(fund => (
                    <div
                      key={fund.id}
                      className="dropdown-item" 
                      onClick={() => {
                        navigate(`/funds/${fund.id}/${currentSection}`);
                        setIsFundSelectorOpen(false);
                      }}
                    >
                      <div className="dropdown-item-content">
                        <span className="item-name">{fund.name}</span> 
                        <span className="item-code">{fund.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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

      <div className="frame-3">
        <div className="footer-links">
          <NavLink to="/allfunds" className="footer-item">
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