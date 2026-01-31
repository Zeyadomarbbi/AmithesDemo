import React, { useState, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import AmethisLogo from '../../../../assets/amethis-logo.svg';
import { useFundData } from '../../hooks/Core/FundContext'; 
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
  const [searchQuery, setSearchQuery] = useState("");
  
  const { funds } = useFundData();
  const activeFundId = useActiveFund();
  
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split('/');
  const currentSection = pathSegments[1] === 'funds' && pathSegments[3] 
    ? pathSegments[3] 
    : 'dashboard';

  const filteredFunds = useMemo(() => {
    return funds.filter(fund => 
      fund.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fund.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [funds, searchQuery]);

  const currentFund = funds.length > 0 
    ? (funds.find(f => f.id.toString() === activeFundId?.toString()) || funds[0]) 
    : { name: 'Loading...', id: '' }; 

  const handleSwitchFund = (newFundId) => {
    navigate(`/funds/${newFundId}/${currentSection}`);
    setIsFundSelectorOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="side-panel">
      
      <div className="frame-1">
        <div className="logo-container">
          <img src={AmethisLogo} alt="Amethis Logo" className="logo-img" />
        </div>

        <div className="frame-1-2">
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
            
            {isFundSelectorOpen && (
              <div className="fund-selector-dropdown" onClick={(e) => e.stopPropagation()}>
                
                <div className="dropdown-search-container">
                  <SearchIcon />
                  <input 
                    type="text" 
                    placeholder="Search by name or code" 
                    className="dropdown-search-input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="dropdown-action-row">
                  <Link to="/all-funds" className="see-all-funds-link">
                    See all funds
                  </Link>
                </div>

                <div className="dropdown-scroll">
                  {filteredFunds.length > 0 ? (
                    filteredFunds.map(fund => (
                      <div
                        key={fund.id}
                        className={`side-panel-dropdown-item ${fund.id.toString() === activeFundId?.toString() ? 'selected' : ''}`}
                        onClick={() => handleSwitchFund(fund.id)}
                      >
                        <div className="side-panel-dropdown-item-content">
                          <span className="side-panel-item-name">{fund.name}</span> 
                          <span className="side-panel-item-code">{fund.code}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-no-results" style={{ padding: '12px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                      No funds found
                    </div>
                  )}
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
            <NavLink to={`/funds/${activeFundId}/scenario-dashboard`} className="nav-item">
              <ScenariosIcon /> <span>Scenarios</span>
            </NavLink>
          </nav>
          
          <div className="sidebar-separator"></div>

        </div>
      </div>

      <div className="frame-2-waves"></div>

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