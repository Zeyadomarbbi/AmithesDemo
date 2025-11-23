import React from 'react';
import './PortfolioCard.css';

// Local DataRow component
const DataRow = ({ label, value, isMultiLine = false }) => (
  <div className={`portfolio-data-row ${isMultiLine ? 'multi-line' : ''}`}>
    <span className="row-label">{label}</span>
    <div className="row-separator"></div>
    <span className="row-value">{value}</span>
  </div>
);

function PortfolioCard() {
  return (
    <div className="kpi-card card-portfolio-wide">
      
      {/* HEADER */}
      <div className="fund-card-header">
        <span className="fund-title">PORTFOLIO</span>
        <span className="fund-unit">(m€)</span>
      </div>

      {/* BODY: Two Columns */}
      <div className="portfolio-body">
        
        {/* Left Column */}
        <div className="portfolio-column">
          <DataRow label="Investment Cost" value="69 878 009" />
          <DataRow label="Proceed (A)" value="28 900 365" />
          {/* This row is taller (56px) and wraps text */}
          <DataRow 
            label="Porfolio Fair Market Value (B)" 
            value="71 685 123" 
            isMultiLine={true}
          />
        </div>

        {/* Right Column */}
        <div className="portfolio-column">
          <DataRow label="Total Value (A+B)" value="97 008 658" />
          <DataRow label="Gross Multiple" value="2.17x" />
          <DataRow label="Gross IRR" value="27.68%" />
        </div>

      </div>

    </div>
  );
}

export default PortfolioCard;