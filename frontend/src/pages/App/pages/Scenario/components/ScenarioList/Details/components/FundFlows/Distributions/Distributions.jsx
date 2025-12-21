import React from 'react';
import './Distributions.css';
import { SortIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';

const Distributions = ({ data }) => { // Accepts data prop

  // Helper: Convert "DD/MM/YYYY" string to Date object
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  };

  const handleDateChange = (rowId, newDate) => {
    console.log("Update parent logic here");
  };

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">   
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left"><div className="th-content">Date <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Divestment <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Dividends <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Recycling <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Other <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Distributed <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="td-date">
                  <DateInputWithPicker 
                    initialDate={parseDateString(row.date)}
                    onDateChange={(newDate) => handleDateChange(row.id, newDate)}
                    isSingle={true}
                  />
                </td>
                
                <td className="td-right">{row.flow}</td>
                <td className="td-right">{row.divestment || '-'}</td>
                <td className="td-right">{row.dividends || '-'}</td>
                <td className="td-right">{row.recycling || '-'}</td>
                <td className="td-right">{row.other || '-'}</td>
                <td className="td-right">{row.distPercent || '0.00%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Distributions;