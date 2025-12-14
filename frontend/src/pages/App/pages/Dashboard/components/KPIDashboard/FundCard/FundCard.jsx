import React from 'react';
import './FundCard.css'; 

// Internal helper for the dashed rows
const DataRow = ({ label, value }) => (
  <div className="fund-data-row">
    <span className="row-label">{label}</span>
    <div className="row-separator"></div>
    <span className="row-value">{value}</span>
  </div>
);

function FundCard({ data }) { // Accept data as prop
  // If data is null or empty, display a loading/empty state message
  if (!data || data.length === 0) {
    return (
      <div className="kpi-card card-fund">
        <div className="fund-card-header">
          <span className="fund-title">FUND</span>
          <span className="fund-unit">(m€)</span>
        </div>
        <div className="fund-metrics-container" style={{padding: '20px', textAlign: 'center'}}>
          No Fund Metrics Available.
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-card card-fund">
      
      {/* Header */}
      <div className="fund-card-header">
        <span className="fund-title">FUND</span>
        <span className="fund-unit">(m€)</span>
      </div>

      {/* Metrics List */}
      <div className="fund-metrics-container">
        {data.map((row, index) => (
          <DataRow key={index} label={row.label} value={row.value} />
        ))}
      </div>
      
    </div>
  );
}

export default FundCard;  