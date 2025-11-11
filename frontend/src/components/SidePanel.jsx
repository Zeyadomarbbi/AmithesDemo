import React, { useState } from 'react';
// 1. Import useParams to read the URL, Link to navigate
import { Link, NavLink, useParams } from 'react-router-dom';
import './SidePanel.css';

function SidePanel() {
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  
  // 2. Read the current fundId from the URL
  const { fundId } = useParams();

  // (Dummy data for the dropdown, this will come from your API)
  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
  ];
  const currentFund = funds.find(f => f.id === parseInt(fundId)) || funds[0];

  return (
    <div className="side-panel">
      {/* ... (logo) ... */}
      <div className="fund-selector-container">
        <button 
          className="fund-selector-button" 
          onClick={() => setIsFundSelectorOpen(!isFundSelectorOpen)}
        >
          <div>
            {/* Display the name of the currently active fund */}
            <span className="fund-name">{currentFund.name}</span>
            <span className="fund-setup">Fund setup</span>
          </div>
          {/* ... (arrow) ... */}
        </button>
        
        {isFundSelectorOpen && (
          <div className="fund-selector-dropdown">
            <input type="text" placeholder="Search" className="dropdown-search" />
            
            {/* 3. The fund items are now LINKS that change the URL */}
            {funds.map(fund => (
              <Link
                key={fund.id}
                // This link navigates to the new fund's dashboard
                to={`/funds/${fund.id}/dashboard`}
                className="dropdown-item"
                onClick={() => setIsFundSelectorOpen(false)} // Close dropdown on click
              >
                <span>{fund.name}</span> <span>{fund.code}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 4. ALL your NavLinks must now include the current fundId */}
      <nav className="side-panel-nav">
        <NavLink to={`/funds/${fundId}/dashboard`} className="nav-item">Dashboard</NavLink>
        <NavLink to={`/funds/${fundId}/lps-statement`} className="nav-item">LPs Statement</NavLink>
        <NavLink to={`/funds/${fundId}/portfolio`} className="nav-item">Portfolio</NavLink>
        <NavLink to={`/funds/${fundId}/financials`} className="nav-item">Financials</NavLink>
        <NavLink to={`/funds/${fundId}/scenarios`} className="nav-item">Scenarios</NavLink>
      </nav>
      {/* ... (footer) ... */}
    </div>
  );
}
export default SidePanel;