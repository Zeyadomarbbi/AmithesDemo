import React from 'react';
import './Portfolio.css';
import { SortIcon } from '.././Icons';

function Portfolio() {
  const data = [
    { name: 'Singlet ticket', subText: 'Art 12.7', description: 'No single investment shall represent more than 15.00%', limit: '15.00%' },
    { name: 'Countries', subText: 'Art 12.8', description: 'No more than 60.00% shall be invested in Spain', limit: '60.00%' },
  ];

  return (
    <div className="limits-card-portfolio">
      <div className="limits-header">
        <h2 className="header-title">Portfolio</h2>
        <span className="header-count">{data.length}</span>
      </div>

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

export default Portfolio;