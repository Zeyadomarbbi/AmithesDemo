import React from 'react';
import './KPIDashboard.css';

// Import the 4 modular sections
import FundCard from './FundCard/FundCard';
import FundValueChart from './FundValueChart/FundValueChart';
import PortfolioValueChart from './PortfolioValueChart/PortfolioValueChart';
import PortfolioCard from './PortfolioCard/PortfolioCard';

// --- CENTRAL MOCK DATA SOURCE ---
// Data structure keyed by fundId
const ALL_MOCK_KPI_DATA = {
  '1': { // Data for fundId '1'
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
    FundValueChartData: { /* ... chart data for fund 1 ... */ },
    PortfolioValueChartData: { /* ... chart data for fund 1 ... */ },
    PortfolioCardData: { /* ... portfolio data for fund 1 ... */ },
  },
  '2': { // Data for fundId '2'
    FundMetrics: [
      { label: 'Total Commitments', value: '250 000 000' },
      { label: 'Amount Called', value: '100 000 000' },
      { label: '% Called', value: '40.00%' },
      { label: 'Distributions (A)', value: '15 000 000' },
      { label: 'NAV (B)', value: '110 000 000' },
      { label: 'Total Value (A+B)', value: '125 000 000' },
      { label: 'DPI', value: '0.15x' },
      { label: 'RVPI', value: '1.10x' },
      { label: 'TVPI', value: '1.25x' },
      { label: 'Net IRR', value: '8.50%' },
    ],
    FundValueChartData: { /* ... chart data for fund 2 ... */ },
    PortfolioValueChartData: { /* ... chart data for fund 2 ... */ },
    PortfolioCardData: { /* ... portfolio data for fund 2 ... */ },
  },
};
// --- END MOCK DATA ---


function KPIDashboard({ fundId }) {
  // Select data based on fundId. Default to '1' if not provided or invalid.
  const currentFundId = fundId?.toString() || '1';
  const fundData = ALL_MOCK_KPI_DATA[currentFundId] || ALL_MOCK_KPI_DATA['1'];
  
  // Destructure and provide empty array/object fallback if data is missing
  const { 
    FundMetrics: fundMetricsData = [],
    FundValueChartData: fundValueChartData = {},
    PortfolioValueChartData: portfolioValueChartData = {},
    PortfolioCardData: portfolioCardData = {},
  } = fundData;

  return (
    <div className="kpi-dashboard-grid">
      
      {/* 1. FUND (Left Column, Spans 2 Rows) */}
      <FundCard data={fundMetricsData} />

      {/* 2. FUND VALUE CREATION (Middle Top) */}
      <FundValueChart data={fundValueChartData} />

      {/* 3. PORTFOLIO VALUE CREATION (Right Top) */}
      <PortfolioValueChart data={portfolioValueChartData} />
      
      {/* 4. PORTFOLIO (Bottom Wide) */}
      <PortfolioCard data={portfolioCardData} />

    </div>
  );
}

export default KPIDashboard;