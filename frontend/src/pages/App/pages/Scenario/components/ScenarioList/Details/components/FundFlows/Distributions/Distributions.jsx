import React, { useState } from 'react';
import './Distributions.css';
import { SortIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateInput'; // Ensure this path is correct

const Distributions = ({ scenarioId }) => {
  const [rows, setRows] = useState([
    { 
      id: 1, 
      date: '01/01/2027', 
      flow: '17 500 000', 
      divestment: '17 000 000', 
      dividends: '500 000', 
      recycling: '0', 
      other: '-', 
      distPercent: '17.50%' 
    },
    { 
      id: 2, 
      date: '01/03/2027', 
      flow: '350 000', 
      divestment: '-', 
      dividends: '300 000', 
      recycling: '0', 
      other: '50 000', 
      distPercent: '0.35%' 
    },
    { 
      id: 3, 
      date: '01/09/2027', 
      flow: '700 000', 
      divestment: '-', 
      dividends: '500 000', 
      recycling: '0', 
      other: '200 000', 
      distPercent: '0.70%' 
    },
    { 
      id: 4, 
      date: '01/01/2028', 
      flow: '22 000 000', 
      divestment: '22 000 000', 
      dividends: '-', 
      recycling: '0', 
      other: '-', 
      distPercent: '22.00%' 
    },
    { 
      id: 5, 
      date: '01/03/2028', 
      flow: '15 000 000', 
      divestment: '15 000 000', 
      dividends: '-', 
      recycling: '1 000 000', 
      other: '-', 
      distPercent: '15.00%' 
    },
  ]);

  // Helper: Convert Date object back to "DD/MM/YYYY" string
  const formatDateForTable = (dateObj) => {
    if (!dateObj) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper: Convert "DD/MM/YYYY" string to Date object
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  };

  // Handler: Update specific row when DateInput changes
  const handleDateChange = (rowId, newDate) => {
    const newDateStr = formatDateForTable(newDate);
    
    setRows((prevRows) => 
      prevRows.map((row) => {
        if (row.id === rowId) {
          return { ...row, date: newDateStr };
        }
        return row;
      })
    );
  };

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">   
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left">
                <div className="th-content">
                   Date <SortIcon className="sort-icon" />
                </div>
              </th>

              <th className="th-right"> 
                <div className="th-content right">
                   Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              <th className="th-right"> 
                <div className="th-content right">
                   Divestment <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              <th className="th-right"> 
                <div className="th-content right">
                   Dividends & Interests <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              <th className="th-right"> 
                <div className="th-content right">
                   Recycling <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              <th className="th-right"> 
                <div className="th-content right">
                   Other <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              <th className="th-right">
                <div className="th-content right">
                   % Distributed <SortIcon className="sort-icon" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.isHighlight ? 'row-highlight' : ''}>
                <td className="td-date">
                  <DateInputWithPicker 
                    initialDate={parseDateString(row.date)}
                    onDateChange={(newDate) => handleDateChange(row.id, newDate)}
                    isSingle={true}
                  />
                </td>
                
                <td className="td-right">{row.flow}</td>
                <td className="td-right">{row.divestment}</td>
                <td className="td-right">{row.dividends}</td>
                <td className="td-right">{row.recycling}</td>
                <td className="td-right">{row.other}</td>
                <td className="td-right">{row.distPercent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Distributions;