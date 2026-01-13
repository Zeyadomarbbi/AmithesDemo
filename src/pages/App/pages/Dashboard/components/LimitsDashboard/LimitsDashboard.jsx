import React from 'react';
import './LimitsDashboard.css';

// Import the modular sections
import LPsStatement from './LPsStatement/LPsStatement';
import Financials from './Financials/Financials';
import Portfolio from './Portfolio/Portfolio';

function LimitsDashboard() {
  return (
    <div className="limits-dashboard-frame">
      <LPsStatement />
      <Financials />
      <Portfolio />
    </div>
  );
}

export default LimitsDashboard;