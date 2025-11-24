import React from 'react';
import './Financials.css';
import { SortIcon } from '.././Icons'; // Adjust path if needed

function Financials() {
  const data = [
    { name: 'Due dil. fees', subText: 'Art 8.7', description: 'Due diligence fees borne by the fund shall be capped to 2.00%', limit: '2.00%' },
    { name: 'Opex', subText: 'Art 8.8', description: 'Operating expenses borne by the fund shall be capped to 4.00%', limit: '4.00%' },
    { name: 'Man. fees', subText: 'Art 8.9', description: 'Management Fee to be paid shall be capped to 17.00%', limit: '17.00%' },
  ];

  return (
    <div className="limits-card-financials">
      <div className="limits-header">
        <h2 className="header-title">Financials</h2>
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

export default Financials;