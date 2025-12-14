import React from 'react';
import './LimitsDashboard.css';

// Import the modular sections
import LPsStatement from './LPsStatement/LPsStatement';
import Financials from './Financials/Financials';
import Portfolio from './Portfolio/Portfolio';

// --- CENTRAL MOCK DATA SOURCE ---
// Structure is now keyed by fundId, containing the category limits for that fund.
const ALL_MOCK_LIMITS_DATA = {
  '1': { // Assuming fundId '1'
    LPsStatement: [
      { name: 'Shares A', subText: 'Art 15.1', description: 'Shares A shall represent 99.00% of the total commitment', limit: '99.00%' },
      { name: 'Shares B', subText: 'Art 15.1', description: 'Shares B shall represent 1.00% of the total commitment', limit: '1.00%' },
    ],
    Financials: [
      { name: 'Due dil. fees', subText: 'Art 8.7', description: 'Due diligence fees borne by the fund shall be capped to 2.00%', limit: '2.00%' },
      { name: 'Opex', subText: 'Art 8.8', description: 'Operating expenses borne by the fund shall be capped to 4.00%', limit: '4.00%' },
      { name: 'Man. fees', subText: 'Art 8.9', description: 'Management Fee to be paid shall be capped to 17.00%', limit: '17.00%' },
    ],
    Portfolio: [
      { name: 'Singlet ticket', subText: 'Art 12.7', description: 'No single investment shall represent more than 15.00%', limit: '15.00%' },
      { name: 'Countries', subText: 'Art 12.8', description: 'No more than 60.00% shall be invested in Spain', limit: '60.00%' },
    ],
  },
  '2': { // Data for a different fund, fundId '2'
    LPsStatement: [
      { name: 'Class X', subText: 'Art 15.1', description: 'Class X shall represent 95.00% of the total commitment', limit: '95.00%' },
      { name: 'Class Y', subText: 'Art 15.1', description: 'Class Y shall represent 5.00% of the total commitment', limit: '5.00%' },
    ],
    Financials: [
      { name: 'Due dil. fees', subText: 'Art 8.7', description: 'Due diligence fees capped to 1.50%', limit: '1.50%' },
      { name: 'Opex', subText: 'Art 8.8', description: 'Operating expenses capped to 3.00%', limit: '3.00%' },
    ],
    Portfolio: [
      { name: 'Singlet ticket', subText: 'Art 12.7', description: 'No single investment shall represent more than 20.00%', limit: '20.00%' },
      { name: 'Sector Cap', subText: 'Art 12.9', description: 'No more than 40.00% shall be invested in Tech sector', limit: '40.00%' },
    ],
  },
  // Add more fund IDs as needed...
};
// --- END MOCK DATA ---


function LimitsDashboard({ fundId }) { 
  // Get the data for the current fund_id. Use fund_1 data as a default if fundId is missing or invalid.
  const currentFundId = fundId?.toString() || '1'; 
  const fundData = ALL_MOCK_LIMITS_DATA[currentFundId] || {};

  const { 
    LPsStatement: lpsData = [], 
    Financials: financialsData = [], 
    Portfolio: portfolioData = [] 
  } = fundData;

  return (
    <div className="limits-dashboard-frame">
      <LPsStatement data={lpsData} />
      <Financials data={financialsData} />
      <Portfolio data={portfolioData} />
    </div>
  );
}

export default LimitsDashboard;