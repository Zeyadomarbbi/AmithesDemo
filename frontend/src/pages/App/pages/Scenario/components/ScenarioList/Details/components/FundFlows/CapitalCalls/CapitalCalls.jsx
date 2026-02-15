import React, { useMemo } from 'react';
import './CapitalCalls.css'; 
import { SortIcon, PlusIcon, MinusIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';

// Receives data AND handlers from parent
const CapitalCalls = ({ data, onAddRow, onRemoveRow, onUpdateRow }) => {
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();
  const formatDate = useDateFormatter();
  // Group data by year
  const groupedRows = useMemo(() => {
    const groups = {};
    const sortedData = [...data].sort((a, b) => {
       const [d1, m1, y1] = a.date.split('/');
       const [d2, m2, y2] = b.date.split('/');
       return new Date(y1, m1-1, d1) - new Date(y2, m2-1, d2);
    });
    sortedData.forEach(row => {
      const year = row.date.split('/')[2] || 'Unknown';
      if (!groups[year]) groups[year] = [];
      groups[year].push(row);
    });
    return groups;
  }, [data]);

  // --- HELPERS ---
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
    if (!day || !month || !year) return new Date();
    return new Date(year, month - 1, day);
  };

  // --- RESTORED ACTIONS (Calling Parent) ---
  const handleAddClick = (year) => {
    if (onAddRow) onAddRow(year, 'call'); 
  };

  const handleRemoveClick = (year) => {
    if (onRemoveRow) onRemoveRow(year, 'call');
  };

  const handleDateChange = (id, newDate) => {
    if (onUpdateRow) {
      onUpdateRow(id, 'date', formatDateForTable(newDate));
    }
  };

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">   
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left sidebar-col-header"></th> 
              <th className="th-left"><div className="th-content">Date <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Investment <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Management Fees <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Structuring Fees <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Due diligence <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Other <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Capital Called <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          
          {Object.keys(groupedRows).map(year => {
              const rows = groupedRows[year];
              return (
                <tbody key={year} className="year-group-tbody">
                    {rows.map((row, index) => (
                        <tr key={row.id}>
                            {index === 0 && (
                                <td rowSpan={rows.length} className="td-sidebar-group">
                                    <div className="sidebar-content">
                                        <span className="year-label">{year}</span>
                                        <div className="control-box">
                                            {/* RESTORED: Calling the new handlers */}
                                            <button className="ctrl-btn" onClick={() => handleAddClick(year)}>
                                                <PlusIcon className="ctrl-icon" />
                                            </button>
                                            
                                            <span className="row-count">{rows.length}</span>
                                            
                                            <button className="ctrl-btn" onClick={() => handleRemoveClick(year)}>
                                                <MinusIcon className="ctrl-icon" />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            )}

                            <td className="td-date">
                                <DateInputWithPicker
                                    initialDate={parseDateString(row.date)}
                                    // RESTORED: Calling update handler
                                    onDateChange={(date) => handleDateChange(row.id, date)}
                                    isSingle={true}
                                />
                            </td>

                            <td className="td-right">{formatNumber(row.flow)}</td>
                            <td className="td-right">{formatNumber(row.investment)}</td>
                            <td className="td-right">{formatNumber(row.mgmtFees)}</td>
                            <td className="td-right">{formatNumber(row.structFees)}</td>
                            <td className="td-right">{formatNumber(row.dueDil)}</td>
                            <td className="td-right">{formatNumber(row.other)}</td>
                            <td className="td-right">{formatNumber(row.capCalled)}</td>
                        </tr>
                    ))}
                    <tr className="spacer-row"><td colSpan="9"></td></tr>
                </tbody>
              );
          })}
        </table>
      </div>
    </div>
  );
};

export default CapitalCalls;