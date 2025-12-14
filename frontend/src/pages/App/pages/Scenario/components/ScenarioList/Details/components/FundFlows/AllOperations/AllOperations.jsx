import React from 'react';
import './AllOperations.css';
import { SortIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';

const AllOperations = ({ data }) => { // Accepts data prop

  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  };

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">   
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left"><div className="th-content">Date <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Capital Called <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Distributed <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">DPI <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className={row.type === 'dist' ? 'row-highlight' : ''}>
                <td className="td-date">
                  <DateInputWithPicker 
                    initialDate={parseDateString(row.date)}
                    isSingle={true}
                  />
                </td>
                
                <td className="td-right">{row.flow}</td>
                <td className="td-right">{row.capCalled || '-'}</td>
                <td className="td-right">{row.distPercent || '-'}</td>
                <td className="td-right">{row.dpi || '0.00x'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllOperations;