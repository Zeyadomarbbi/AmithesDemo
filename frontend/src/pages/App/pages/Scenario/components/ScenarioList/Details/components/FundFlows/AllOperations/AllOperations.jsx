import React, { useState } from 'react';
import './AllOperations.css';
import { SortIcon } from '../Icons'; // Removed CalendarIcon
import DateInputWithPicker from '../../../../../../../../../../components/DateInput';

const AllOperations = ({ scenarioId }) => {
  const [rows, setRows] = useState([
    { id: 1, date: '01/01/2025', flow: '11 500 000', capCalled: '11.50%', dist: '0.00%', dpi: '0.00x' },
    { id: 2, date: '01/03/2025', flow: '11 500 000', capCalled: '23.00%', dist: '0.00%', dpi: '0.00x' },
    { id: 3, date: '01/06/2025', flow: '8 000 000', capCalled: '31.00%', dist: '0.00%', dpi: '0.00x' },
    { id: 4, date: '01/03/2026', flow: '9 000 000', capCalled: '40.00%', dist: '0.00%', dpi: '0.00x' },
    { id: 5, date: '01/06/2026', flow: '20 000 000', capCalled: '60.00%', dist: '0.00%', dpi: '0.00x' },
    { id: 6, date: '01/06/2027', flow: '25 000 000', capCalled: '85.00%', dist: '0.00%', dpi: '0.00x' },
    { id: 7, date: '01/08/2027', flow: '-45 000 000', capCalled: '85.00%', dist: '45.00%', dpi: '0.52x' },
    { id: 8, date: '01/06/2028', flow: '-35 000 000', capCalled: '85.00%', dist: '80.00%', dpi: '0.94x' },
    { id: 9, date: '01/06/2029', flow: '-25 000 000', capCalled: '85.00%', dist: '105.00%', dpi: '1.23x', isHighlight: true },
    { id: 10, date: '01/09/2029', flow: '-15 000 000', capCalled: '85.00%', dist: '130.00%', dpi: '1.58xx' },
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
      
      {/* Floating DatePicker logic removed — The DateInput component handles it internally now */}

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
              <th className="th-right"><div className="th-content right">% Capital Called <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Distributed <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">DPI <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.isHighlight ? 'row-highlight' : ''}>
                <td className="td-date">
                  {/* Replaced manual input/icon with the 2-in-1 component */}
                  <DateInputWithPicker 
                    initialDate={parseDateString(row.date)}
                    onDateChange={(newDate) => handleDateChange(row.id, newDate)}
                    isSingle={true}
                  />
                </td>
                
                <td className="td-right">{row.flow}</td>
                <td className="td-right">{row.capCalled}</td>
                <td className="td-right">{row.dist}</td>
                <td className="td-right">{row.dpi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllOperations;