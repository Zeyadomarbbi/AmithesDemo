import React from 'react';
import './Portfolio.css';
import { SortIcon } from '.././Icons';

function Portfolio({ data }) { // Accept data as prop
  // data is now received from LimitsDashboard
  const count = data ? data.length : 0;

  return (
    <div className="pf-limits-card">
      <div className="pf-limits-header">
        <h2 className="pf-header-title">Portfolio</h2>
        <span className="pf-header-count">{count}</span>
      </div>

      <div className="pf-limits-table-container">
        <table className="pf-limits-table">
          <thead>
            <tr>
              <th className="pf-th-name">Name <span className="pf-icon"><SortIcon /></span></th>
              <th className="pf-th-desc">Description <span className="pf-icon"><SortIcon /></span></th>
              <th className="pf-th-limit">Limits <span className="pf-icon"><SortIcon /></span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="pf-td-name">
                  <div className="pf-name-primary">{row.name}</div>
                  <div className="pf-name-secondary">{row.subText}</div>
                </td>
                <td className="pf-td-desc">{row.description}</td>
                <td className="pf-td-limit">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Portfolio;