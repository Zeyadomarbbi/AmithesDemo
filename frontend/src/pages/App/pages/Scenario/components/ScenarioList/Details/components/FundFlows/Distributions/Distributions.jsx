// Distributions.js
import React from 'react';
import './Distributions.css';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';
import { SortIcon } from '../Icons'; 


const Distributions = ({ data = [], loading = false, error = null }) => {
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();
  const formatDate = useDateFormatter();
  const calculateDividendsAndInterests = (row) => {
    const dividends = parseFloat(row.dividends || 0);
    const interests = parseFloat(row.interests || 0);
    return dividends + interests;
  };

  if (loading) {
    return (
      <div className="all-ops-container">
        <div className="table-responsive-wrapper">
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading distributions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-ops-container">
        <div className="table-responsive-wrapper">
          <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>Error: {error}</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="all-ops-container">
        <div className="table-responsive-wrapper">
          <div style={{ padding: '40px', textAlign: 'center' }}>No distributions found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">   
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left"><div className="th-content">Date <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Divestment <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Dividends & Interests <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Other <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Distributed <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.summary_id}>
                <td className="td-date">{formatDate(row.date)}</td>
                <td className="td-right">{formatNumber(row.flows)}</td>
                <td className="td-right">{formatNumber(row.divestment)}</td>
                <td className="td-right">{formatNumber(calculateDividendsAndInterests(row))}</td>
                <td className="td-right">{formatNumber(row.other)}</td>
                <td className="td-right">{formatPercentage(row.pct_distributed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Distributions;