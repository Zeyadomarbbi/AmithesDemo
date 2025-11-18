import React, { useState } from 'react';
// 1. Import useLocation
import { Link, NavLink, useParams, useLocation } from 'react-router-dom';
import './SidePanel.css';

function SidePanel() {
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const { fundId } = useParams();
  
  // 2. Get the current location object
  const location = useLocation();

  // 3. Determine the current section (tab)
  // Example URL: /funds/1/scenarios/detail
  // segments: ["", "funds", "1", "scenarios", "detail"]
  // We want index 3 ("scenarios")
  const pathSegments = location.pathname.split('/');
  // If we are in a fund view, keep the section. Otherwise default to 'dashboard'.
  const currentSection = pathSegments[1] === 'funds' && pathSegments[3] 
    ? pathSegments[3] 
    : 'dashboard';

  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
  ];

  const currentFund = funds.find(f => f.id.toString() === fundId) || funds[0];

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <div className="logo">Hurdium</div>
        
        <div className="fund-selector-container">
          <button 
            className="fund-selector-button" 
            onClick={() => setIsFundSelectorOpen(!isFundSelectorOpen)}
          >
            <div>
              <span className="fund-name">{currentFund.name}</span>
              <span className="fund-setup">Fund setup</span>
            </div>
            <span className="dropdown-arrow">{isFundSelectorOpen ? '▲' : '▼'}</span>
          </button>
          
          {isFundSelectorOpen && (
            <div className="fund-selector-dropdown">
              <input type="text" placeholder="Search" className="dropdown-search" />
              
              <div className="dropdown-scroll">
                {funds.map(fund => (
                  <Link
                    key={fund.id}
                    // 4. DYNAMIC LINK: Use the calculated currentSection
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
      </div>

      <nav className="side-panel-nav">
        <NavLink to={`/funds/${fundId}/dashboard`} className="nav-item">Dashboard</NavLink>
        <NavLink to={`/funds/${fundId}/lps-statement`} className="nav-item">LPs Statement</NavLink>
        <NavLink to={`/funds/${fundId}/portfolio`} className="nav-item">Portfolio</NavLink>
        <NavLink to={`/funds/${fundId}/financials`} className="nav-item">Financials</NavLink>
        <NavLink to={`/funds/${fundId}/scenarios`} className="nav-item">Scenarios</NavLink>
      </nav>

      <div className="side-panel-footer">
        <Link to="/funds-overview" className="footer-item">Funds overview</Link>
        <Link to="/admins" className="footer-item">Admins</Link>
        <Link to="/help" className="footer-item">Help</Link>
        <div className="user-profile">
          <div className="user-avatar">MR</div>
          <div className="user-details">
            <span className="user-name">Mathieu Rigot</span>
            <span className="user-email">mathieu.rigot@ikifunds.com</span>
          </div>
          <span className="dropdown-arrow">▼</span>
        </div>
      </div>
    </div>
  );
}

export default SidePanel;