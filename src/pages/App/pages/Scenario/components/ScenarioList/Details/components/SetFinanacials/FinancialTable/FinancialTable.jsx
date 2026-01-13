import React, { useState } from 'react';
import './FinancialTable.css';
import { SortIcon } from './Icons'; 

const parseValue = (value) => {
    if (!value) return 0;
    const cleanValue = String(value).replace(/ /g, '');
    if (cleanValue === '-' || cleanValue === 'ex: 100') return 0;
    return parseFloat(cleanValue) || 0;
};

const initialRows = [
    { label: 'Unrealized gain', type: 'data', hasExpand: true, v2024: '500 000', v2025: '10 500 000' },
    { label: 'Realized gain', type: 'data', hasExpand: true, v2024: '-', v2025: '500 000' },
    { label: 'Other income', type: 'data', v2024: '-', v2025: '250 000' },
    { label: 'Total Income', type: 'total-band' },
    
    { label: 'Man. fees', type: 'data', hasExpand: true, v2024: '500 000', v2025: '2 000 000' },
    { label: 'Due dil. fees', type: 'data', hasExpand: true, v2024: '345 000', v2025: '500 000' },
    { label: 'Audit fees', type: 'data', v2024: '75 000', v2025: '80 000' },
    { label: 'Legal fees', type: 'data', v2024: '50 000', v2025: '50 000' },
    { label: 'Admin fees', type: 'data', v2024: '150 000', v2025: '160 000' },
    { label: 'Other', type: 'data', v2024: '30 000', v2025: '40 000' },
    
    { label: 'Total Expense', type: 'total-band' },
    
    { label: 'NWT', type: 'data', v2024: '5 000', v2025: '5 000' },
    { label: 'Total Taxes', type: 'total-band' }
];

const years = [
    { year: '2024', type: 'realized' },
    { year: '2025', type: 'realized' },
    { year: '2026', type: 'projected' },
    { year: '2027', type: 'projected' },
    { year: '2028', type: 'projected' },
    { year: '2029', type: 'projected' },
    { year: '2030', type: 'projected' },
    { year: '2031', type: 'projected' },
];

const FinancialTable = ({ scenarioId }) => {
    const [financialRows, setFinancialRows] = useState(() => {
        return initialRows.map(row => {
            const newRow = { ...row };
            if (row.type === 'data' || row.type === 'total-band') {
                for (let year = 2024; year <= 2031; year++) {
                    const key = `v${year}`;
                    newRow[key] = row[key] || ''; 
                }
            }
            return newRow;
        });
    });

    // --- Logic Helpers ---

    const calculateRowTotal = (row) => {
        let sum = 0;
        years.forEach(({ year }) => {
            const key = `v${year}`;
            sum += parseValue(row[key]);
        });
        return sum.toLocaleString('en-US');
    };

    const calculateColumnTotal = (yearKey, rowsToSum) => {
        let sum = 0;
        rowsToSum.forEach(row => {
            const value = row[yearKey];
            sum += parseValue(value);
        });
        return sum.toLocaleString('en-US');
    };

    const getGroupedRows = () => {
        const incomeEndIndex = financialRows.findIndex(r => r.label === 'Total Income');
        const expenseEndIndex = financialRows.findIndex(r => r.label === 'Total Expense');
        const nwtIndex = financialRows.findIndex(r => r.label === 'NWT');

        const incomeRows = financialRows.slice(0, incomeEndIndex);
        const expenseRows = financialRows.slice(4, expenseEndIndex);
        const nwtRow = financialRows[nwtIndex]; 
        
        return { incomeRows, expenseRows, nwtRow };
    };

    const getYearValue = (row, year) => {
        const key = `v${year}`;
        if (row.type === 'total-band') {
            const { incomeRows, expenseRows, nwtRow } = getGroupedRows();
            if (row.label === 'Total Income') return calculateColumnTotal(key, incomeRows);
            if (row.label === 'Total Expense') return calculateColumnTotal(key, expenseRows);
            if (row.label === 'Total Taxes') return calculateColumnTotal(key, [nwtRow]);
        }
        return row[key] || '';
    };

    // --- Interaction Handlers ---

    const handleProjectedChange = (e, rowIndex, year) => {
        if (e.key === 'Enter') {
            const newValue = e.target.value;
            setFinancialRows(prev => prev.map((row, i) => 
                i === rowIndex ? { ...row, [`v${year}`]: newValue } : row
            ));
            e.target.blur();
        }
    };

    const handleExpandClick = (rowIndex, label) => {
        console.log(`Triggering auto-fill for ${label} (Row ${rowIndex})`);
        const mockFetchedData = {
            v2026: '120 000', v2027: '130 000', v2028: '140 000',
            v2029: '150 000', v2030: '160 000', v2031: '170 000'
        };
        setFinancialRows(prevRows => prevRows.map((row, i) => {
            if (i === rowIndex) return { ...row, ...mockFetchedData };
            return row;
        }));
    };

    return (
        <div className="table-container">
            <table className="fin-table">
                <thead>
                    <tr>
                        {/* PnL Column: Wrapper gets 'pnl-wrapper' */}
                        <th className="th-label col-pnl">
                            <div className="th-wrapper pnl-wrapper">
                                <span>PnL</span>
                                <SortIcon className="sort-icon" />
                            </div>
                        </th>
                        
                        {/* Years Columns: Wrapper gets 'year-wrapper' */}
                            {years.map((y) => (
                            <th key={y.year} className={`col-year ${y.type}`}>
                                <div className="th-wrapper year-wrapper">
                                <div className="th-group">
                                    <span className="year">{y.year}</span>
                                    <span className="currency-indicator">(€)</span>
                                    <SortIcon className="sort-icon" />
                                </div>
                                </div>
                            </th>
                            ))}
                        {/* Total Column: Wrapper gets 'total-wrapper' */}
                        <th className="col-total">
                            <div className="th-wrapper total-wrapper">
                                <div className="th-group">
                                <span>Total cumulated</span>
                                <span className="currency-indicator">(€)</span>
                                <SortIcon className="sort-icon" />
                                </div>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {financialRows.map((row, index) => {
                        const isTotalRow = row.type === 'total-band';
                        const rowTotal = calculateRowTotal(row); 
                        const isReadOnly = row.hasExpand; 

                        return (
                            <tr key={index} className={isTotalRow ? 'row-total' : 'row-standard'}>
                                <td className="cell-label">
                                    {row.label}
                                    {row.hasExpand && (
                                        <span 
                                            className="expand-icon" 
                                            onClick={() => handleExpandClick(index, row.label)}
                                        >
                                            +
                                        </span>
                                    )}
                                </td>

                                {years.map((y) => {
                                    const value = getYearValue(row, y.year);
                                    
                                    if (y.type === 'realized') {
                                        return <td key={y.year} className="cell-realized">{value}</td>;
                                    } else {
                                        if (isTotalRow) return <td key={y.year} className="cell-total-val">{value}</td>;
                                        return (
                                            <td key={y.year} className="cell-projected">
                                                <input 
                                                    key={`${index}-${y.year}-${value}`} 
                                                    className={`proj-input ${isReadOnly ? 'input-disabled' : ''}`} 
                                                    placeholder={isReadOnly ? '-' : "ex : 100"} 
                                                    defaultValue={value} 
                                                    disabled={isReadOnly}
                                                    onKeyDown={(e) => handleProjectedChange(e, index, y.year)}
                                                />
                                            </td>
                                        );
                                    }
                                })}
                                <td className="cell-total-final">{rowTotal}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default FinancialTable;