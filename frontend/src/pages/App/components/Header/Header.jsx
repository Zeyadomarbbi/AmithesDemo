import React from 'react';
// 1. Remove useParams (we will use the custom hook instead for consistency)
// import { useParams } from 'react-router-dom'; 

import { useFundData } from '../../hooks/Core/FundContext';     // Import the Data Hook
import { useActiveFund } from '../../hooks/useActiveFund'; // Import the ID Hook
import './Header.css';

// 2. Remove the props argument
function Header() { 
  // 3. Get the Global Data
  const { funds } = useFundData();
  
  // 4. Get the Current ID
  const activeFundId = useActiveFund();

  // 5. Find the Fund
  const currentFund = funds.find(f => f.id.toString() === activeFundId.toString());
  
  // Guard clause
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