import React, { useState, useEffect } from 'react';
import './FinancialTable.css';
// Assuming SortIcon is available in './Icons'
import { SortIcon } from './Icons'; 

// Function to safely parse a string value into a number (removes spaces, handles dashes)
const parseValue = (value) => {
    if (!value) return 0;
    const cleanValue = String(value).replace(/ /g, '');
    if (cleanValue === '-' || cleanValue === 'ex: 100') return 0;
    return parseFloat(cleanValue) || 0;
};

// Initial data (Mocking the financial structure)
const initialRows = [
    { label: 'Unrealized gain', type: 'data', v2024: '500 000', v2025: '10 500 000' },
    { label: 'Realized gain', type: 'data', v2024: '-', v2025: '500 000' },
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
    // 1. Initialize State and projected fields
    const [financialRows, setFinancialRows] = useState(() => {
        return initialRows.map(row => {
            const newRow = { ...row };
            if (row.type === 'data' || row.type === 'total-band') {
                for (let year = 2024; year <= 2031; year++) {
                    const key = `v${year}`;
                    // Initialize projected fields to an empty string if they don't exist
                    newRow[key] = row[key] || ''; 
                }
            }
            return newRow;
        });
    });

    // --- Calculation Helpers ---

    // Total Cumulated (Sum across all columns for a single row)
    const calculateRowTotal = (row) => {
        let sum = 0;
        years.forEach(({ year }) => {
            const key = `v${year}`;
            sum += parseValue(row[key]);
        });
        return sum.toLocaleString('en-US');
    };

    // Total Income/Expense (Sum down a column for grouped rows)
    const calculateColumnTotal = (yearKey, rowsToSum) => {
        let sum = 0;
        rowsToSum.forEach(row => {
            const value = row[yearKey];
            sum += parseValue(value);
        });
        return sum.toLocaleString('en-US');
    };

    // Helper to get grouped rows (Income, Expense, Tax)
    const getGroupedRows = () => {
        // Find indices of total rows for precise slicing
        const incomeEndIndex = financialRows.findIndex(r => r.label === 'Total Income'); // 3
        const expenseEndIndex = financialRows.findIndex(r => r.label === 'Total Expense'); // 10
        const nwtIndex = financialRows.findIndex(r => r.label === 'NWT'); // 12

        const incomeRows = financialRows.slice(0, incomeEndIndex); // Rows 0, 1, 2
        const expenseRows = financialRows.slice(4, expenseEndIndex); // Rows 4-9
        const nwtRow = financialRows[nwtIndex]; 
        
        return { incomeRows, expenseRows, nwtRow };
    };

    // --- State Update Handler ---

    const handleProjectedChange = (e, rowIndex, year) => {
        if (e.key === 'Enter') {
            const newValue = e.target.value;
            
            const newRows = financialRows.map((row, i) => {
                if (i === rowIndex) {
                    return { ...row, [`v${year}`]: newValue };
                }
                return row;
            });
            setFinancialRows(newRows);
            e.target.blur();
        }
    };

    // Helper function to retrieve the year value (used for rendering data AND total calculation logic)
    const getYearValue = (row, year) => {
        const key = `v${year}`;
        
        // If it's a Total row, calculate the column sum instead of reading state directly
        if (row.type === 'total-band') {
            const { incomeRows, expenseRows, nwtRow } = getGroupedRows();
            
            if (row.label === 'Total Income') return calculateColumnTotal(key, incomeRows);
            if (row.label === 'Total Expense') return calculateColumnTotal(key, expenseRows);
            if (row.label === 'Total Taxes') return calculateColumnTotal(key, [nwtRow]);
        }
        
        // Return stored state value for data rows
        return row[key] || '';
    };

    // --- Render Logic ---

    return (
        <div className="table-container">
            <table className="fin-table">
              <thead>
                <tr>
                  {/* PnL Column */}
                  <th className="col-pnl">
                    <div className="th-wrapper pnl-wrapper">
                      <span>PnL</span>
                      <SortIcon className="sort-icon" />
                    </div>
                  </th>

                  {/* Year Columns */}
                  {years.map((y) => (
                    <th key={y.year} className={`col-year ${y.type}`}>
                      <div className="th-wrapper">
                        <div className="header-content">
                          {y.year}
                          <span className="currency-indicator">(€)</span>
                        </div>
                        <SortIcon className="sort-icon" />
                      </div>
                    </th>
                  ))}

                  {/* Total Column */}
                  <th className="col-total">
                    <div className="th-wrapper">
                      <div className="header-content">
                          Total cumulated
                          <span className="currency-indicator">(€)</span>
                      </div>
                      <SortIcon className="sort-icon" />
                    </div>
                  </th>
                </tr>
              </thead>

                <tbody>
                    {financialRows.map((row, index) => {
                        const isTotalRow = row.type === 'total-band';
                        const rowTotal = calculateRowTotal(row); 
                        
                        return (
                            <tr key={index} className={isTotalRow ? 'row-total' : 'row-standard'}>
                                {/* 1. Label Column */}
                                <td className="cell-label">
                                    {row.label}
                                    {row.hasExpand && <span className="expand-icon">+</span>}
                                </td>

                                {/* 2. Dynamic Year Columns */}
                                {years.map((y) => {
                                    const value = getYearValue(row, y.year);
                                    
                                    if (y.type === 'realized') {
                                        return (
                                            <td key={y.year} className="cell-realized">
                                                {value}
                                            </td>
                                        );
                                    } else {
                                        // Projected Inputs or Projected Totals
                                        if (isTotalRow) {
                                            return <td key={y.year} className="cell-total-val">{value}</td>;
                                        }
                                        return (
                                            <td key={y.year} className="cell-projected">
                                                <input 
                                                    className="proj-input" 
                                                    placeholder="ex : 100" 
                                                    defaultValue={value} 
                                                    onKeyDown={(e) => handleProjectedChange(e, index, y.year)}
                                                />
                                            </td>
                                        );
                                    }
                                })}

                                {/* 3. Total Column (Cumulative sum) */}
                                <td className="cell-total-final">
                                    {rowTotal}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default FinancialTable;