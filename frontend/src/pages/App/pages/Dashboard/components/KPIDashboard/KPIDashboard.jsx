import React from 'react';
import './KPIDashboard.css';

// Import the 4 modular sections
import FundCard from './FundCard/FundCard';
import FundValueChart from './FundValueChart/FundValueChart';
import PortfolioValueChart from './PortfolioValueChart/PortfolioValueChart';
import PortfolioCard from './PortfolioCard/PortfolioCard';

function KPIDashboard() {
  return (
    <div className="kpi-dashboard-grid">
      
      {/* 1. FUND (Left Column, Spans 2 Rows) */}
      <FundCard />

      {/* 2. FUND VALUE CREATION (Middle Top) */}
      <FundValueChart />

      {/* 3. PORTFOLIO VALUE CREATION (Right Top) */}
      <PortfolioValueChart />
      
      {/* 4. PORTFOLIO (Bottom Wide) */}
      <PortfolioCard />

    </div>
  );
}

export default KPIDashboard;