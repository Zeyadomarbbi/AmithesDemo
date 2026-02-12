import React from 'react';
import './FundCard.css'; 

// Internal helper for the dashed rows
const DataRow = ({ label, value }) => (
  <div className="fc-fund-data-row">
    <span className="fc-row-label">{label}</span>
    <div className="fc-row-separator"></div>
    <span className="fc-row-value">{value}</span>
  </div>
);

function FundCard({ data }) { // Accept data as prop
  // If data is null or empty, display a loading/empty state message
  if (!data || data.length === 0) {
    return (
      <div className="fc-card-fund">
        <div className="fc-fund-card-header">
          <span className="fc-fund-title">FUND</span>
          <span className="fc-fund-unit">(m€)</span>
        </div>
        <div className="fc-fund-metrics-container fc-empty-state">
          No Fund Metrics Available.
        </div>
      </div>
    );
  }

  return (
    <div className="fc-card-fund">
      
      {/* Header */}
      <div className="fc-fund-card-header">
        <span className="fc-fund-title">FUND</span>
        <span className="fc-fund-unit">(m€)</span>
      </div>

      {/* Metrics List */}
      <div className="fc-fund-metrics-container">
        {data.map((row, index) => (
          <DataRow key={index} label={row.label} value={row.value} />
        ))}
      </div>
      
    </div>
  );
}

export default FundCard;