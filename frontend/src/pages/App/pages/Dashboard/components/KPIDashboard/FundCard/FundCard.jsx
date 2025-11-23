import React from 'react';
import './FundCard.css'; // <--- Import the new CSS
// Internal helper for the dashed rows
const DataRow = ({ label, value }) => (
  <div className="fund-data-row">
    <span className="row-label">{label}</span>
    <div className="row-separator"></div>
    <span className="row-value">{value}</span>
  </div>
);

function FundCard() {
  return (
    <div className="kpi-card card-fund">
      
      {/* Header */}
      <div className="fund-card-header">
        <span className="fund-title">FUND</span>
        <span className="fund-unit">(m€)</span>
      </div>

      {/* Metrics List */}
      <div className="fund-metrics-container">
        <DataRow label="Total Commitments" value="150 000 000" />
        <DataRow label="Amount Called" value="75 987 250" />
        <DataRow label="% Called" value="50.00%" />
        <DataRow label="Distributions (A)" value="27 654 259" />
        <DataRow label="NAV (B)" value="98 528 957" />
        <DataRow label="Total Value (A+B)" value="125 698 306" />
        <DataRow label="DPI" value="0.16x" />
        <DataRow label="RVPI" value="1.43x" />
        <DataRow label="TVPI" value="1.59x" />
        <DataRow label="Net IRR" value="11.93%" />
      </div>
      
    </div>
  );
}

export default FundCard;