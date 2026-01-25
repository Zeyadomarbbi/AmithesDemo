import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import './KPIDashboard.css';

// Import the 4 modular sections
import FundCard from './FundCard/FundCard';
import FundValueChart from './FundValueChart/FundValueChart';
import PortfolioValueChart from './PortfolioValueChart/PortfolioValueChart';
import PortfolioCard from './PortfolioCard/PortfolioCard';

// --- CENTRAL MOCK DATA SOURCE ---
// Data structure keyed by fundId, then by 'Quarter-Year' string.
const ALL_MOCK_KPI_DATA = {
  '1': {
    '1': { // Data for Fund 1, Q1 2024
      FundMetrics: [
        { label: 'Total Commitments', value: '150 000 000' },
        { label: 'Amount Called', value: '75 987 250' },
        { label: '% Called', value: '50.66%' },
        { label: 'Distributions (A)', value: '27 654 259' },
        { label: 'NAV (B)', value: '98 528 957' },
        { label: 'Total Value (A+B)', value: '126 183 216' },
        { label: 'DPI', value: '0.36x' },
        { label: 'RVPI', value: '1.30x' },
        { label: 'TVPI', value: '1.66x' },
        { label: 'Net IRR', value: '11.93%' },
      ],
      FundValueChartData: [
        { name: 'Total\nAmount Called', value: 3000000 },
        { name: 'Total\nFund Value', value: 600 },
      ],
      PortfolioValueChartData: [
        { name: 'Portfolio\nInvestment Cost', value: 45, isHatched: true },
        { name: 'Porfolio\nTotal Value', value: 80 },
      ],
      PortfolioCardData: [
        /* Portfolio card data for fund 1, Q1-2024, structured as an array of { label, value } */
        { label: 'Investment Cost', value: '69 878 009' },
        { label: 'Proceed (A)', value: '28 900 365' },
        { label: 'Porfolio Fair Market Value (B)', value: '71 685 123' },
        { label: 'Total Value (A+B)', value: '97 008 658' },
        { label: 'Gross Multiple', value: '2.17x' },
        { label: 'Gross IRR', value: '27.68%' },
      ],
    },
    '3': { // Data for Fund 1, Q2 2024
      FundMetrics: [
        { label: 'Total Commitments', value: '150 000 000' },
        { label: 'Amount Called', value: '60 323 000' },
        { label: '% Called', value: '40.00%' },
        { label: 'Distributions (A)', value: '10 000 000' },
        { label: 'NAV (B)', value: '80 000 000' },
        { label: 'Total Value (A+B)', value: '90 000 000' },
        { label: 'DPI', value: '0.17x' },
        { label: 'RVPI', value: '1.33x' },
        { label: 'TVPI', value: '1.50x' },
        { label: 'Net IRR', value: '10.50%' },
      ],
      FundValueChartData: { /* Q2-2024 chart data for fund 1 */ },
      PortfolioValueChartData: { /* Q2-2024 portfolio chart data for fund 1 */ },
      PortfolioCardData: { /* Q2-2024 portfolio card data for fund 1 */ },
    },
  },
  '2': {
    '1': { // Data for Fund 2, Q2 2024
      FundMetrics: [
        { label: 'Total Commitments', value: '250 000 000' },
        { label: 'Amount Called', value: '100 000 000' },
        { label: ' % Called', value: '40.00%' },
        { label: 'Distributions (A)', value: '15 000 000' },
        { label: 'NAV (B)', value: '110 000 000' },
        { label: 'Total Value (A+B)', value: '125 000 000' },
        { label: 'DPI', value: '0.15x' },
        { label: 'RVPI', value: '1.10x' },
        { label: 'TVPI', value: '1.25x' },
        { label: 'Net IRR', value: '8.50%' },
      ],
      FundValueChartData: { /* Q2-2024 chart data for fund 2 */ },
      PortfolioValueChartData: { /* Q2-2024 portfolio chart data for fund 2 */ },
      PortfolioCardData: { /* Q2-2024 portfolio card data for fund 2 */ },
    },
    // No other quarters defined for Fund 2
  },
  // Fund '3' might exist but have no data in the MOCK_KPI_DATA object
};


function KPIDashboard() {
  const { fundId } = useOutletContext();
  const { timeframeId } = useParams();
  const [activeData, setActiveData] = useState({});

  useEffect(() => {
    const fId = String(fundId);
    const tId = String(timeframeId);

    if (fId && tId) {
      const fundData = ALL_MOCK_KPI_DATA[fId];
      const specificData = fundData ? fundData[tId] : null;
      setActiveData(specificData || {});
    } else {
      setActiveData({});
    }
  }, [fundId, timeframeId]);

  // Destructure with defaults to prevent crashes in child components
  const { 
    FundMetrics = [],
    FundValueChartData = [],
    PortfolioValueChartData = [],
    PortfolioCardData = [],
  } = activeData;

  // Optional: Handle empty state
  if (!timeframeId) {
    return <div className="no-selection-message">Please select a timeframe to view data.</div>;
  }

  return (
    <div className="kpi-dashboard-grid">
      <FundCard data={FundMetrics} />
      <FundValueChart data={FundValueChartData} />
      <PortfolioValueChart data={PortfolioValueChartData} />
      <PortfolioCard data={PortfolioCardData} />
    </div>
  );
}

export default KPIDashboard;