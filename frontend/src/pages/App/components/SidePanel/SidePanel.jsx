import React, { useState } from 'react';
import { Link, NavLink, useParams, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import AmethisLogo from '../../../../assets/amethis-logo.svg';
import { useActiveFund } from '../../hooks/useActiveFund';
import { 
  DashboardIcon, PortfolioIcon, FinancialsIcon, ScenariosIcon,
  LPsIcon, AllFundsIcons, AdminsIcon, HelpIcon,
  SettingsIcon, ChevronDownIcon, ProfileExpandIcon
} from '../Icons';

import './SidePanel.css';

function SidePanel() {
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const activeFundId = useActiveFund();
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/');
  const currentSection = pathSegments[1] === 'funds' && pathSegments[3] ? pathSegments[3] : 'dashboard';
  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
  ];
  const currentFund = funds.find(f => f.id.toString() === activeFundId.toString()) || funds[0];
  
  return (
    <div className="side-panel">
      
      {/* === FRAME 1: TOP SECTION === */}
      <div className="frame-1">
        
        {/* 1. Logo */}
        <div className="logo-container">
          <img src={AmethisLogo} alt="Amethis Logo" className="logo-img" />
        </div>

        {/* 2. Frame 1_2 (Fund + Tabs + Line) */}
        <div className="frame-1-2">
          
          <div className="fund-selector-container">
            <div className="fund-selector-button">
              
              <div className="fund-info-section">
                <span className="fund-name">{currentFund.name}</span>
                
                {/* --- THE FIX: Use Link directly --- */}
                {/* We use currentFund.id to ensure we go to settings for the fund being displayed */}
                <Link 
                  to={`/funds/${currentFund.id}/settings`} 
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
              <div className="fund-selector-dropdown">
                <input type="text" placeholder="Search" className="dropdown-search" />
                <div className="dropdown-scroll">
                  {funds.map(fund => (
                    <Link
                      key={fund.id}
                      to={`/funds/${fund.id}/${currentSection}`}
                      className="dropdown-item"
                      onClick={() => setIsFundSelectorOpen(false)}
                    >
                      <span>{fund.name}</span> 
                      <span className="fund-code">{fund.code}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
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
          
          {/* The Line */}
          <div className="sidebar-separator"></div>

        </div>
      </div>
      {/* === FRAME 2: WAVY IMAGE (Background Layer) === */}
      <div className="frame-2-waves"></div>

      {/* === FRAME 3: FOOTER (Content Layer) === */}
      {/* This sits at the bottom, on top of the waves */}
      <div className="frame-3">
        <div className="footer-links">
          <Link to="/allfunds" className="footer-item">
              <AllFundsIcons /> <span>All funds</span>
          </Link>
          <Link to="/admins" className="footer-item">
              <AdminsIcon /> <span>Admins</span>
          </Link>
          <Link to="/help" className="footer-item">
              <HelpIcon /> <span>Help</span>
          </Link>
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