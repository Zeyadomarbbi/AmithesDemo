import React, { useState } from 'react';
import './Distributions.css';
import { SortIcon, CalendarIcon } from '../Icons'; 
import DatePicker from '../../../../../../../../../../components/DatePicker';

const Distributions = ({ scenarioId }) => {
  // 1. Updated Data State to match the specific columns for Distributions
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
      recycling: '1 000 000', // Example with Recycling
      other: '-', 
      distPercent: '15.00%' 
    },
  ]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);

  const formatDateForTable = (dateObj) => {
    if (!dateObj) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  };

  const handleDateClick = (rowId) => {
    setActiveRowId(rowId);
    setShowDatePicker(true);
  };

  const handleClose = () => {
    setShowDatePicker(false);
    setActiveRowId(null);
  };

  const handleApplyDate = (selection) => {
    if (selection && selection.start) {
      const newDateStr = formatDateForTable(selection.start);
      setRows((prevRows) => 
        prevRows.map((row) => {
          if (row.id === activeRowId) {
            return { ...row, date: newDateStr };
          }
          return row;
        })
      );
    }
    handleClose();
  };

  const activeRow = rows.find(r => r.id === activeRowId);

  return (
    <div className="all-ops-container"> 
      
      {/* --- FLOATING DATEPICKER (Static Overlay) --- */}
      {showDatePicker && (
        <div className="static-floating-picker">
            <DatePicker 
                onClose={handleClose}
                onApply={handleApplyDate}
                initialDate={activeRow ? parseDateString(activeRow.date) : new Date()} 
            />
        </div>
      )}

      <div className="table-responsive-wrapper">   
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left">
                <div className="th-content">
                   Date <SortIcon className="sort-icon" />
                </div>
              </th>

              {/* 1. Flows */}
              <th className="th-right"> 
                <div className="th-content right">
                    Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              {/* 2. Divestment */}
              <th className="th-right"> 
                <div className="th-content right">
                    Divestment <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              {/* 3. Dividends & Interests */}
              <th className="th-right"> 
                <div className="th-content right">
                    Dividends & Interests <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              {/* 4. Recycling (New Field) */}
              <th className="th-right"> 
                <div className="th-content right">
                    Recycling <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              {/* 5. Other */}
              <th className="th-right"> 
                <div className="th-content right">
                    Other <span className="header-hint">(€)</span> <SortIcon className="sort-icon" />
                </div>
              </th>

              {/* 6. % Distributed */}
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
                  <div 
                    className="date-input-wrapper" 
                    onClick={() => handleDateClick(row.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <input 
                        type="text" 
                        value={row.date} 
                        className="date-input" 
                        readOnly 
                        style={{ pointerEvents: 'none' }} 
                    />
                    <div className="icon-wrapper">
                      <CalendarIcon />
                    </div>
                  </div>
                </td>
                
                {/* Data Cells mapped to new structure */}
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