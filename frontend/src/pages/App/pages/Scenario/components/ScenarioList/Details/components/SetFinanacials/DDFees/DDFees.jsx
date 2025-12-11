import React, { useState } from 'react';
import { CloseIcon } from '../Icons'; 
import './DDFees.css';

const initialData = [
  { 
    id: 1, 
    name: 'Investment #1', 
    period: '2020 - 2024', 
    entryPct: 'In portfolio', 
    exitPct: 'Exited', 
    entryVal: 'In portfolio', 
    exitVal: 'Exited', 
    entryType: 'text', 
    exitType: 'text' 
  },
  { 
    id: 2, 
    name: 'Investment #2', 
    period: '2021 - 2026', 
    entryPct: 'In portfolio', 
    exitPct: '0.20%', 
    entryVal: 'In portfolio', 
    exitVal: '20 000', 
    entryType: 'text', 
    exitType: 'input' 
  },
  { 
    id: 3, 
    name: 'Investment #3', 
    period: '2022 - 2026', 
    entryPct: '1.50%', 
    exitPct: '0.80%', 
    entryVal: '150 000', 
    exitVal: '80 000', 
    entryType: 'input', 
    exitType: 'input' 
  },
  { 
    id: 4, 
    name: 'Investment #4', 
    period: '2023 - 2027', 
    entryPct: '0.75%', 
    exitPct: '0.50%', 
    entryVal: '750 000', 
    exitVal: '50 000', 
    entryType: 'input', 
    exitType: 'input' 
  },
  { 
    id: 5, 
    name: 'Investment #5', 
    period: '2024 - 2027', 
    entryPct: '1.25%', 
    exitPct: '0.00%', 
    entryVal: '125 000', 
    exitVal: '-', 
    entryType: 'input', 
    exitType: 'input' 
  },
  { 
    id: 6, 
    name: 'Investment #6', 
    period: '2025 - 2028', 
    entryPct: '1.00%', 
    exitPct: '0.75%', 
    entryVal: '100 000', 
    exitVal: '75 000', 
    entryType: 'input', 
    exitType: 'input' 
  },
];

const DDFees = ({ onClose }) => {
  const [rows, setRows] = useState(initialData);

  const handleInputChange = (e, id, field) => {
    const newVal = e.target.value;
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: newVal } : r));
  };

  return (
    <div className="dd-container">
      {/* Header with Close Button */}
      <div className="dd-header">
        <h2>Due diligences fees</h2>
        <button className="dd-close-btn" onClick={onClose}>
            <CloseIcon className="close-icon-svg" />
        </button>
      </div>

      {/* Table Area */}
      <div className="dd-table-wrapper">
        <table className="dd-table">
          <thead>
            <tr>
              <th className="th-inv"></th>
              <th className="th-center">Entry (% Cost)</th>
              <th className="th-center">Exit (% Cost)</th>
              <th className="th-right">Entry</th>
              <th className="th-right">Exit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {/* Investment Name Column (Will be white via CSS) */}
                <td className="td-name">
                  <div className="inv-name-group">
                    <span className="inv-title">{row.name}</span>
                    <span className="inv-period">{row.period}</span>
                  </div>
                </td>

                {/* Entry % Column */}
                <td className="td-center">
                  {row.entryType === 'input' ? (
                    <input 
                      className="dd-input" 
                      value={row.entryPct} 
                      onChange={(e) => handleInputChange(e, row.id, 'entryPct')}
                    />
                  ) : (
                    <span className="status-text">{row.entryPct}</span>
                  )}
                </td>

                {/* Exit % Column */}
                <td className="td-center">
                  {row.exitType === 'input' ? (
                    <input 
                      className="dd-input" 
                      value={row.exitPct}
                      onChange={(e) => handleInputChange(e, row.id, 'exitPct')}
                    />
                  ) : (
                    <span className="status-text">{row.exitPct}</span>
                  )}
                </td>

                {/* Entry Value Column */}
                <td className="td-right">
                  <span className="val-text">{row.entryVal}</span>
                </td>

                {/* Exit Value Column */}
                <td className="td-right">
                  <span className="val-text">{row.exitVal}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <div className="dd-footer">
        <button className="btn-dd-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-dd-save" onClick={onClose}>Save</button>
      </div>
    </div>
  );
};

export default DDFees;