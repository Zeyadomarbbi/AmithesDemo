import React from 'react';
import { useParams } from 'react-router-dom'; // 1. Import useParams
import './DashboardPage.css';

function DashboardPage() {
  // 2. Get the fundId from the URL
  const { fundId } = useParams();

  // 3. Define the funds (Same data as SidePanel)
  // In a real app, you would fetch this or use a global Context
  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
  ];

  // 4. Find the active fund
  const currentFund = funds.find(f => f.id.toString() === fundId) || funds[0];

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header">
        {/* Dynamic Welcome Message */}
        <h1>Welcome on {currentFund.name}</h1>
        <button className="date-selector">Q2 2024 ▾</button>
      </div>

      {/* Tabs Section */}
      <div className="dashboard-tabs">
        <div className="tab active">KPI</div>
        <div className="tab">Limits</div>
      </div>

      {/* Main Content Grid (Unchanged) */}
      <div className="dashboard-grid">
        
        {/* 1. FUND Card */}
        <div className="card card-fund">
          <h3>FUND (m€)</h3>
          <div className="data-row"><span>Total Commitments</span> <span>150 000 000</span></div>
          <div className="data-row"><span>Amount Called</span> <span>75 987 250</span></div>
          <div className="data-row"><span>% Called</span> <span>50.00%</span></div>
          <div className="data-row"><span>Distributions (A)</span> <span>27 654 259</span></div>
          <div className="data-row"><span>NAV (B)</span> <span>98 528 957</span></div>
          <div className="data-row total"><span>Total Value (A+B)</span> <span>125 698 306</span></div>
          <br />
          <div className="data-row"><span>DPI</span> <span>0.16x</span></div>
          <div className="data-row"><span>RVPI</span> <span>1.43x</span></div>
          <div className="data-row"><span>TVPI</span> <span>1.59x</span></div>
          <div className="data-row"><span>Net IRR</span> <span>11.93%</span></div>
        </div>

        {/* 2. FUND VALUE CREATION */}
        <div className="card card-fund-value">
          <h3>FUND VALUE CREATION (m€)</h3>
          <div style={{height: '200px', display: 'flex', alignItems: 'end', justifyContent: 'center', gap: '20px'}}>
              <div style={{width: '40px', height: '60%', background: '#718096'}}></div>
              <div style={{width: '40px', height: '90%', background: '#CBD5E0'}}></div>
          </div>
        </div>

        {/* 3. PORTFOLIO VALUE CREATION */}
        <div className="card card-portfolio-value">
          <h3>PORTFOLIO VALUE CREATION (m€)</h3>
           <div style={{height: '200px', display: 'flex', alignItems: 'end', justifyContent: 'center', gap: '20px'}}>
              <div style={{width: '40px', height: '70%', background: '#CBD5E0'}}></div>
              <div style={{width: '40px', height: '95%', background: '#718096'}}></div>
          </div>
        </div>

        {/* 4. PORTFOLIO Table */}
        <div className="card card-portfolio-table">
          <h3>PORTFOLIO (m€)</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px'}}>
             <div>
                <div className="data-row"><span>Investment Cost</span> <span>69 878 009</span></div>
                <div className="data-row"><span>Proceed (A)</span> <span>28 900 365</span></div>
                <div className="data-row"><span>Portfolio Fair Market Value (B)</span> <span>71 685 123</span></div>
             </div>
             <div>
                <div className="data-row"><span>Total Value (A+B)</span> <span>97 008 658</span></div>
                <div className="data-row"><span>Gross Multiple</span> <span>2.17x</span></div>
                <div className="data-row"><span>Gross IRR</span> <span>27.68%</span></div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;