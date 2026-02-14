import React, { useState, useEffect } from 'react';
import './FinancialTable.css';
import { SortIcon } from './Icons'; 

const parseValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleanValue = String(value).replace(/ /g, '');
    if (cleanValue === '-' || cleanValue === 'ex: 100') return 0;
    return parseFloat(cleanValue) || 0;
};

const FinancialTable = ({ scenarioId, years, rows = [], localChanges = {}, onCellChange }) => {
    const [financialRows, setFinancialRows] = useState([]);

    useEffect(() => {
        if (!rows || rows.length === 0) {
            setFinancialRows([]);
            return;
        }

        const formatRow = (r) => {
            const rowState = { 
                label: r.line_item_name, 
                type: 'data', 
                originalId: r.line_item_id,
                category: r.category,
                specialField: r.special_field, 
                sourceValues: r.values 
            };
            
            years.forEach(({ year }) => {
                const valObj = r.values[year];
                const changeKey = `${r.line_item_id}_${year}`;
                
                if (localChanges[changeKey]) {
                    rowState[`v${year}`] = localChanges[changeKey].amount;
                } else {
                    rowState[`v${year}`] = (valObj && valObj.amount !== undefined) ? valObj.amount : "0";
                }
            });
            return rowState;
        };

        const incomeRows = rows.filter(r => r.category === 'Income').map(formatRow);
        const expenseRows = rows.filter(r => r.category === 'Expense').map(formatRow);
        const taxRows = rows.filter(r => r.category === 'Tax').map(formatRow);

        setFinancialRows([
            ...incomeRows,
            { label: 'Total Income', type: 'total-band' },
            ...expenseRows,
            { label: 'Total Expense', type: 'total-band' },
            ...taxRows,
            { label: 'Total Taxes', type: 'total-band' },
            
            // --- INJECT SPACER HERE ---
            { type: 'spacer' },
            
            { label: 'Net Profit/Loss', type: 'net-profit' }
        ]);
    }, [rows, years, localChanges]);

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
        // We look for the index of the total bands to slice the array correctly
        const incomeEndIndex = financialRows.findIndex(r => r.label === 'Total Income');
        const expenseEndIndex = financialRows.findIndex(r => r.label === 'Total Expense');
        const taxEndIndex = financialRows.findIndex(r => r.label === 'Total Taxes');
        
        if (incomeEndIndex === -1) return { incomeRows: [], expenseRows: [], taxRows: [] };

        const incomeRows = financialRows.slice(0, incomeEndIndex);
        // Expense starts after Total Income (index + 1)
        const expenseRows = financialRows.slice(incomeEndIndex + 1, expenseEndIndex);
        // Tax starts after Total Expense (index + 1)
        const taxRows = financialRows.slice(expenseEndIndex + 1, taxEndIndex);
        
        return { incomeRows, expenseRows, taxRows };
    };

    const calculateNetProfit = (yearKey) => {
        const { incomeRows, expenseRows, taxRows } = getGroupedRows();
        const income = parseValue(calculateColumnTotal(yearKey, incomeRows).replace(/,/g, ''));
        const expense = parseValue(calculateColumnTotal(yearKey, expenseRows).replace(/,/g, ''));
        const tax = parseValue(calculateColumnTotal(yearKey, taxRows).replace(/,/g, ''));
        return (income - expense - tax).toLocaleString('en-US');
    };

    const calculateNetProfitTotal = () => {
        let sum = 0;
        years.forEach(({ year }) => {
            const key = `v${year}`;
            const { incomeRows, expenseRows, taxRows } = getGroupedRows();
            const income = parseValue(calculateColumnTotal(key, incomeRows).replace(/,/g, ''));
            const expense = parseValue(calculateColumnTotal(key, expenseRows).replace(/,/g, ''));
            const tax = parseValue(calculateColumnTotal(key, taxRows).replace(/,/g, ''));
            sum += (income - expense - tax);
        });
        return sum.toLocaleString('en-US');
    };

    const getYearValue = (row, year) => {
        const key = `v${year}`;
        if (row.type === 'total-band') {
            const { incomeRows, expenseRows, taxRows } = getGroupedRows();
            if (row.label === 'Total Income') return calculateColumnTotal(key, incomeRows);
            if (row.label === 'Total Expense') return calculateColumnTotal(key, expenseRows);
            if (row.label === 'Total Taxes') return calculateColumnTotal(key, taxRows);
        }
        if (row.type === 'net-profit') {
            return calculateNetProfit(key);
        }
        return row[key] || "0";
    };

    const handleProjectedChange = (e, rowIndex, year) => {
        const newValue = e.target.value;
        const row = financialRows[rowIndex];
        
        setFinancialRows(prev => prev.map((r, i) => 
            i === rowIndex ? { ...r, [`v${year}`]: newValue } : r
        ));
        
        if (onCellChange && row.originalId) {
            onCellChange(row.originalId, year, newValue);
        }
    };

    return (
        <div className="table-container">
            <table className="fin-table">
                <thead>
                    <tr>
                        <th className="th-label col-pnl">
                            <div className="th-wrapper pnl-wrapper">
                                <span>PnL</span>
                                <SortIcon className="sort-icon" />
                            </div>
                        </th>
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
                        const isNetProfit = row.type === 'net-profit';
                        const isSpacer = row.type === 'spacer';
                        const isSeparator = row.type === 'separator'; // Kept in case you use it elsewhere

                        // --- 1. RENDER SPACER ROW ---
                        if (isSpacer) {
                            return (
                                <tr key={`spacer-${index}`} className="row-spacer">
                                    {/* Spans Label + Years + Total */}
                                    <td colSpan={years.length + 2}></td>
                                </tr>
                            );
                        }

                        // --- 2. RENDER SEPARATOR (Legacy) ---
                        if (isSeparator) {
                            return (
                                <tr key={index} className="row-separator">
                                    <td colSpan={years.length + 2}></td>
                                </tr>
                            );
                        }

                        const rowTotal = isNetProfit ? calculateNetProfitTotal() : calculateRowTotal(row); 

                        return (
                            <tr 
                                key={index} 
                                className={
                                    isTotalRow ? 'row-total' : 
                                    isNetProfit ? 'row-total' : 
                                    'row-standard'
                                }
                            >
                                <td className="cell-label">{row.label}</td>
                                {years.map((y) => {
                                    const value = getYearValue(row, y.year);
                                    
                                    let isReadOnly = false;
                                    
                                    if (isTotalRow || isNetProfit) {
                                        isReadOnly = true; 
                                    } else if (y.type === 'realized') {
                                        isReadOnly = true; 
                                    } else if (row.specialField) {
                                        isReadOnly = true; 
                                    } else if (row.sourceValues?.[y.year]?.status === 'Realized' || row.sourceValues?.[y.year]?.status === 'Automated') {
                                        isReadOnly = true;
                                    }

                                    return (
                                        <td 
                                            key={y.year} 
                                            className={
                                                y.type === 'realized' ? 'cell-realized' : 
                                                (isTotalRow || isNetProfit) ? 'cell-total-val' : 
                                                'cell-projected'
                                            }
                                        >
                                            {isReadOnly ? (
                                                <span className="read-only-val disabled-cell">{value}</span>
                                            ) : (
                                                <input 
                                                    key={`${index}-${y.year}`} 
                                                    className="proj-input" 
                                                    placeholder="ex : 100" 
                                                    value={value} 
                                                    onChange={(e) => handleProjectedChange(e, index, y.year)}
                                                />
                                            )}
                                        </td>
                                    );
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