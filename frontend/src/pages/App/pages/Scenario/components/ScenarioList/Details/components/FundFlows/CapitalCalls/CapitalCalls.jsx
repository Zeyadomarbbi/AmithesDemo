import React, { useState, useRef } from 'react';
import './CapitalCalls.css'; 
import { SortIcon, CalendarIcon, PlusIcon, MinusIcon } from '../Icons'; 
import DatePicker from '../../../../../../../../../../components/DatePicker';

const CapitalCalls = ({ scenarioId }) => {
  // Ref to the main container to calculate relative positions
  const containerRef = useRef(null);

  // State for dynamic position
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 80 });

  const [groupedRows, setGroupedRows] = useState({
    2025: [
      { id: 1, date: '01/02/2025', flow: '11 500 000', investment: '10 000 000', mgmtFees: '500 000', structFees: '500 000', dueDil: '300 000', other: '200 000', capCalled: '11.50%' },
      { id: 2, date: '01/04/2025', flow: '1 050 000', investment: '-', mgmtFees: '500 000', structFees: '-', dueDil: '500 000', other: '50 000', capCalled: '1.05%' },
      { id: 3, date: '01/08/2025', flow: '2 500 000', investment: '2 000 000', mgmtFees: '500 000', structFees: '-', dueDil: '-', other: '-', capCalled: '2.50%' },
      { id: 4, date: '01/10/2025', flow: '400 000', investment: '-', mgmtFees: '-', structFees: '-', dueDil: '400 000', other: '-', capCalled: '0.40%' },
    ],
    2026: [
      { id: 5, date: '01/03/2026', flow: '9 500 000', investment: '8 000 000', mgmtFees: '500 000', structFees: '-', dueDil: '1 000 000', other: '-', capCalled: '9.50%' },
      { id: 6, date: '01/06/2026', flow: '700 000', investment: '-', mgmtFees: '500 000', structFees: '-', dueDil: '-', other: '200 000', capCalled: '0.70%' },
      { id: 7, date: '01/10/2026', flow: '1 750 000', investment: '1 000 000', mgmtFees: '500 000', structFees: '-', dueDil: '-', other: '250 000', capCalled: '1.75%' },
    ],
    2027: [
       { id: 8, date: '01/03/2027', flow: '10 500 000', investment: '10 000 000', mgmtFees: '500 000', structFees: '-', dueDil: '-', other: '-', capCalled: '10.50%' },
    ]
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeRowInfo, setActiveRowInfo] = useState({ year: null, index: null });

  // --- HELPER FUNCTIONS ---
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

  // --- ACTIONS ---
  const handleAddRow = (year) => {
    const newId = Date.now();
    const newRow = { 
        id: newId, date: '', flow: '-', investment: '-', mgmtFees: '-', 
        structFees: '-', dueDil: '-', other: '-', capCalled: '0.00%' 
    };
    setGroupedRows(prev => ({
        ...prev,
        [year]: [...prev[year], newRow]
    }));
  };

  const handleRemoveRow = (year) => {
    setGroupedRows(prev => {
        const currentRows = prev[year];
        if (currentRows.length <= 1) return prev; 
        return {
            ...prev,
            [year]: currentRows.slice(0, -1)
        };
    });
  };

  // --- SMART POSITIONING LOGIC ---
  const handleDateClick = (year, index, e) => {
    setActiveRowInfo({ year, index });
    
    // 1. Calculate Position
    if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const triggerRect = e.currentTarget.getBoundingClientRect();

        // Calculate 'top' relative to the container
        let relativeTop = triggerRect.top - containerRect.top;
        
        // Check remaining space at the bottom of the viewport
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const pickerApproxHeight = 350; // Approximate height of calendar

        if (spaceBelow < pickerApproxHeight) {
            // If not enough space below, show ABOVE the input
            // (Move up by picker height + small gap)
            relativeTop = relativeTop - pickerApproxHeight + 10;
        } else {
            // Otherwise show BELOW the input
            // (Move down by input height)
            relativeTop = relativeTop + 40; 
        }

        // 80px is approximately the width of the sidebar column + padding
        setPickerPos({ top: relativeTop, left: 80 });
    }

    setShowDatePicker(true);
  };

  const handleClose = () => {
    setShowDatePicker(false);
    setActiveRowInfo({ year: null, index: null });
  };

  const handleApplyDate = (selection) => {
    if (selection && selection.start) {
        const newDateStr = formatDateForTable(selection.start);
        const { year, index } = activeRowInfo;
        setGroupedRows(prev => {
            const updatedYearRows = [...prev[year]];
            updatedYearRows[index] = { ...updatedYearRows[index], date: newDateStr };
            return { ...prev, [year]: updatedYearRows };
        });
    }
    handleClose();
  };

  let currentActiveDate = new Date();
  if (activeRowInfo.year && activeRowInfo.index !== null) {
      const r = groupedRows[activeRowInfo.year][activeRowInfo.index];
      if (r && r.date) currentActiveDate = parseDateString(r.date);
  }

  return (
    <div className="all-ops-container" ref={containerRef}> 
      
      {/* --- DYNAMIC FLOATING DATEPICKER --- */}
      {showDatePicker && (
        <div 
            className="static-floating-picker" 
            style={{ 
                top: `${pickerPos.top}px`, 
                left: `${pickerPos.left}px` 
            }}
        >
            <DatePicker 
                onClose={handleClose}
                onApply={handleApplyDate}
                initialDate={currentActiveDate} 
            />
        </div>
      )}

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
                                            <button className="ctrl-btn" onClick={() => handleAddRow(year)}><PlusIcon className="ctrl-icon" /></button>
                                            <span className="row-count">{rows.length}</span>
                                            <button className="ctrl-btn" onClick={() => handleRemoveRow(year)}><MinusIcon className="ctrl-icon" /></button>
                                        </div>
                                    </div>
                                </td>
                            )}

                            <td className="td-date">
                                <div 
                                    className="date-input-wrapper" 
                                    // Pass Event 'e' here for calculation
                                    onClick={(e) => handleDateClick(year, index, e)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input type="text" value={row.date} className="date-input" readOnly style={{ pointerEvents: 'none' }} />
                                    <div className="icon-wrapper"><CalendarIcon /></div>
                                </div>
                            </td>
                            <td className="td-right">{row.flow}</td>
                            <td className="td-right">{row.investment}</td>
                            <td className="td-right">{row.mgmtFees}</td>
                            <td className="td-right">{row.structFees}</td>
                            <td className="td-right">{row.dueDil}</td>
                            <td className="td-right">{row.other}</td>
                            <td className="td-right">{row.capCalled}</td>
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