import React from 'react';
import { useParams } from 'react-router-dom';
import './Header.css';

// CHANGED: Accept funds as a prop with a default empty array
function Header({ funds = [] }) {
  const { fundId } = useParams();

  // REMOVED: Hardcoded funds array

  const currentFund = funds.find(f => f.id.toString() === fundId);
  
  // Guard clause: if no fund found, render empty header or fallback
  if (!currentFund) return <header className="top-header"></header>;

  return (
    <header className="top-header">
      <div className="header-text-container">
        <span className="header-fund-name">{currentFund.name}</span>
      </div>
    </header>
  );
}

export default Header;