import React from 'react';
import './Financials.css';
import { SortIcon } from '/src/components/Icons/InteractiveIcons';

function Financials({ data }) { // Accept data as prop
  // data is now received from LimitsDashboard
  const count = data ? data.length : 0;

  return (
    <div className="fns-limits-card">
      <div className="fns-limits-header">
        <h2 className="fns-header-title">Financials</h2>
        <span className="fns-header-count">{count}</span>
      </div>

      <div className="fns-limits-table-container">
        <table className="fns-limits-table">
          <thead>
            <tr>
              <th className="fns-th-name">Name <span className="fns-icon"><SortIcon /></span></th>
              <th className="fns-th-desc">Description <span className="fns-icon"><SortIcon /></span></th>
              <th className="fns-th-limit">Limits <span className="fns-icon"><SortIcon /></span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="fns-td-name">
                  <div className="fns-name-primary">{row.name}</div>
                  <div className="fns-name-secondary">{row.subText}</div>
                </td>
                <td className="fns-td-desc">{row.description}</td>
                <td className="fns-td-limit">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Financials;