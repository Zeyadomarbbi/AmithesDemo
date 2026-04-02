import React, { useState, useEffect } from 'react';
import { useNumberFormatter } from '../../../../../../../../../../components/useFormatter';
import { downloadFinancialsAsExcel } from "../utils/downloadFinancialsAsExcel.js";
import { EditLineIcon } from '/src/components/Icons/InteractiveIcons';
import { SortableHeaderRenderer } from '../../../../../../../../../../components/Sort/TableSort.jsx';
import './FinancialTable.css';

const parseValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleanValue = String(value).replace(/[^\d.-]/g, '');
    if (cleanValue === '' || cleanValue === '-') return 0;
    return parseFloat(cleanValue) || 0;
};

export default function FinancialTable({ years, rows = [], localChanges = {}, onCellChange, triggerDownload }) {
    const formatNumber = useNumberFormatter();
    const [financialRows, setFinancialRows] = useState([]);
    // State to track which cell is currently being edited
    const [editingCell, setEditingCell] = useState(null); // { rowIndex, year }

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
                    rowState[`v${year}`] = (valObj && valObj.amount !== undefined) ? valObj.amount : 0;
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
            { type: 'spacer' },
            { label: 'Net Profit/Loss', type: 'net-profit' }
        ]);
    }, [rows, years, localChanges]);

    useEffect(() => {
        if (!triggerDownload) return;
        downloadFinancialsAsExcel({ years, financialRows, calculateNetProfitTotal, getYearValue });
    }, [triggerDownload, years, financialRows]);

    const calculateRowTotal = (row) => {
        let sum = 0;
        years.forEach(({ year }) => {
            sum += parseValue(row[`v${year}`]);
        });
        return sum;
    };

    const calculateColumnTotal = (yearKey, rowsToSum) => {
        let sum = 0;
        rowsToSum.forEach(row => {
            sum += parseValue(row[yearKey]);
        });
        return sum;
    };

    const getGroupedRows = () => {
        const incomeEndIndex = financialRows.findIndex(r => r.label === 'Total Income');
        const expenseEndIndex = financialRows.findIndex(r => r.label === 'Total Expense');
        const taxEndIndex = financialRows.findIndex(r => r.label === 'Total Taxes');
        
        if (incomeEndIndex === -1) return { incomeRows: [], expenseRows: [], taxRows: [] };

        const incomeRows = financialRows.slice(0, incomeEndIndex);
        const expenseRows = financialRows.slice(incomeEndIndex + 1, expenseEndIndex);
        const taxRows = financialRows.slice(expenseEndIndex + 1, taxEndIndex);
        
        return { incomeRows, expenseRows, taxRows };
    };

    const calculateNetProfit = (yearKey) => {
        const { incomeRows, expenseRows, taxRows } = getGroupedRows();
        const income = calculateColumnTotal(yearKey, incomeRows);
        const expense = calculateColumnTotal(yearKey, expenseRows);
        const tax = calculateColumnTotal(yearKey, taxRows);
        return income - expense - tax;
    };

    const calculateNetProfitTotal = () => {
        let sum = 0;
        years.forEach(({ year }) => {
            sum += calculateNetProfit(`v${year}`);
        });
        return sum;
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
        return row[key] ?? 0;
    };

    const handleProjectedChange = (e, rowIndex, year) => {
        const rawValue = e.target.value.replace(/[^\d.-]/g, '');
        const row = financialRows[rowIndex];
        
        setFinancialRows(prev => prev.map((r, i) => 
            i === rowIndex ? { ...r, [`v${year}`]: rawValue } : r
        ));
        
        if (onCellChange && row.originalId) {
            onCellChange(row.originalId, year, rawValue);
        }
    };

    return (
        <div className="fin-table-container">
            <table className="fin-table">
                <thead>
                    <tr>
                        <th className="th-label col-pnl">
                            <div className="th-wrapper pnl-wrapper">
                                <SortableHeaderRenderer 
                                    label="PnL" 
                                    center={false} 
                                    showCurrency={false} 
                                    showSortIcon={false} 
                                    toggleSort={() => {}} 
                                />
                            </div>
                        </th>
                        {years.map((y) => (
                            <th key={y.year} className={`col-year ${y.type}`}>
                                <div className="th-wrapper year-wrapper">
                                    <SortableHeaderRenderer 
                                        label={y.year} 
                                        center={true} 
                                        showCurrency={true} 
                                        showSortIcon={false} 
                                        toggleSort={() => {}} 
                                    />
                                </div>
                            </th>
                        ))}
                        <th className="col-total">
                            <div className="th-wrapper total-wrapper">
                                <SortableHeaderRenderer 
                                    label="Total cumulated" 
                                    center={true} 
                                    showCurrency={true} 
                                    showSortIcon={false} 
                                    toggleSort={() => {}} 
                                />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {financialRows.map((row, index) => {
                        const isTotalRow = row.type === 'total-band';
                        const isNetProfit = row.type === 'net-profit';
                        const isSpacer = row.type === 'spacer';

                        if (isSpacer) {
                            return (
                                <tr key={`spacer-${index}`} className="row-spacer">
                                    <td colSpan={years.length + 2}></td>
                                </tr>
                            );
                        }

                        const rawRowTotal = isNetProfit ? calculateNetProfitTotal() : calculateRowTotal(row);
                        const rowTotalDisplay = formatNumber(rawRowTotal);

                        return (
                            <tr 
                                key={index} 
                                className={isTotalRow || isNetProfit ? 'row-total' : 'row-standard'}
                            >
                                <td className="cell-label">{row.label}</td>
                                {years.map((y) => {
                                    const rawValue = getYearValue(row, y.year);
                                    const isEditing = editingCell?.rowIndex === index && editingCell?.year === y.year;
                                    
                                    let isReadOnly = false;
                                    const READONLY_SPECIAL_FIELDS = ['REALIZED_GAIN', 'UNREALIZED_GAIN', 'MANAGEMENT_FEES', 'DD_FEES'];

                                    if (isTotalRow || isNetProfit) {
                                        isReadOnly = true;
                                    } else if (y.type === 'realized') {
                                        isReadOnly = true;
                                    } else if (row.specialField && READONLY_SPECIAL_FIELDS.includes(row.specialField)) {
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
                                                <span className="read-only-val disabled-cell">
                                                    {formatNumber(rawValue)}
                                                </span>
                                            ) : isEditing ? (
                                                <input 
                                                    autoFocus
                                                    key={`${index}-${y.year}`} 
                                                    className="proj-input" 
                                                    placeholder="ex : 100" 
                                                    value={rawValue} 
                                                    onChange={(e) => handleProjectedChange(e, index, y.year)}
                                                    onBlur={() => setEditingCell(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                                                />
                                            ) : (
                                                <div 
                                                    className="editable-cell-display"
                                                    onClick={() => setEditingCell({ rowIndex: index, year: y.year })}
                                                >
                                                    <span className="formatted-val">
                                                        {formatNumber(rawValue)}
                                                    </span>
                                                    <EditLineIcon />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="cell-total-final">{rowTotalDisplay}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}