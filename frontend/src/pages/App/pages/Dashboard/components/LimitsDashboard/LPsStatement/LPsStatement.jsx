import React from 'react';
import './LPsStatement.css';
import { SortIcon } from '.././Icons'; // Adjust path if needed

function LPsStatement() {
  // Specific Data
  const data = [
    { name: 'Shares A', subText: 'Art 15.1', description: 'Shares A shall represent 99.00% of the total commitment', limit: '99.00%' },
    { name: 'Shares B', subText: 'Art 15.1', description: 'Shares B shall represent 1.00% of the total commitment', limit: '1.00%' },
  ];

  return (
    <div className="limits-card-lps">
      
      {/* 1. Header */}
      <div className="limits-header">
        <h2 className="header-title">LPs Statement</h2>
        <span className="header-count">{data.length}</span>
      </div>

      {/* 2. Table */}
      <div className="limits-table-container">
        <table className="limits-table">
          <thead>
            <tr>
              <th className="th-name">Name <span className="icon"><SortIcon /></span></th>
              <th className="th-desc">Description <span className="icon"><SortIcon /></span></th>
              <th className="th-limit">Limits <span className="icon"><SortIcon /></span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="td-name">
                  <div className="name-primary">{row.name}</div>
                  <div className="name-secondary">{row.subText}</div>
                </td>
                <td className="td-desc">{row.description}</td>
                <td className="td-limit">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

export default LPsStatement;