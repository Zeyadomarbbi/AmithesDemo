import React from 'react';
import './LPsStatement.css';
import { SortIcon } from '.././Icons'; // Adjust path if needed

function LPsStatement({ data }) { // Accept data as prop
  // data is now received from LimitsDashboard
  const count = data ? data.length : 0;

  return (
    <div className="lps-limits-card">
      
      {/* 1. Header */}
      <div className="lps-limits-header">
        <h2 className="lps-header-title">LPs Statement</h2>
        <span className="lps-header-count">{count}</span>
      </div>

      {/* 2. Table */}
      <div className="lps-limits-table-container">
        <table className="lps-limits-table">
          <thead>
            <tr>
              <th className="lps-th-name">Name <span className="lps-icon"><SortIcon /></span></th>
              <th className="lps-th-desc">Description <span className="lps-icon"><SortIcon /></span></th>
              <th className="lps-th-limit">Limits <span className="lps-icon"><SortIcon /></span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="lps-td-name">
                  <div className="lps-name-primary">{row.name}</div>
                  <div className="lps-name-secondary">{row.subText}</div>
                </td>
                <td className="lps-td-desc">{row.description}</td>
                <td className="lps-td-limit">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

export default LPsStatement;