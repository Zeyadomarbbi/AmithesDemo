import React, { useState } from 'react';
import './ManagementFees.css';
import { SortIcon } from '../Icons'; 

const parseValue = (value) => {
    if (!value) return 0;
    const cleanValue = String(value).replace(/\s/g, ''); 
    if (cleanValue === '-' || cleanValue === '' || isNaN(cleanValue)) return 0;
    return parseFloat(cleanValue);
};

const initialRows = [
    // --- SHARES SECTION ---
    { label: 'Shares A1', type: 'data', v2024: '300 000', v2025: '500 000', v2026: '500 000', v2027: '300 000', v2028: '-', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Shares A2', type: 'data', v2024: '1 500 000', v2025: '2 000 000', v2026: '2 000 000', v2027: '1 500 000', v2028: '-', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Shares B', type: 'data', v2024: '50 000', v2025: '250 000', v2026: '250 000', v2027: '50 000', v2028: '-', v2029: '-', v2030: '-', v2031: '-' },
    
    { label: 'Total on commitment', type: 'total-band' },

    // --- INVESTMENTS SECTION ---
    { label: 'Investment #1', type: 'data', v2024: '-', v2025: '-', v2026: '-', v2027: '150 000', v2028: '150 000', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Investment #2', type: 'data', v2024: '-', v2025: '-', v2026: '-', v2027: '120 000', v2028: '120 000', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Investment #3', type: 'data', v2024: '-', v2025: '-', v2026: '-', v2027: '130 000', v2028: '130 000', v2029: '130 000', v2030: '-', v2031: '-' },
    { label: 'Investment #4', type: 'data', v2024: '-', v2025: '-', v2026: '-', v2027: '150 000', v2028: '150 000', v2029: '150 000', v2030: '150 000', v2031: '-' },
    { label: 'Investment #5', type: 'data', v2024: '-', v2025: '-', v2026: '-', v2027: '100 000', v2028: '100 000', v2029: '100 000', v2030: '100 000', v2031: '-' },
    { label: 'Investment #6', type: 'data', v2024: '-', v2025: '-', v2026: '-', v2027: '50 000', v2028: '50 000', v2029: '50 000', v2030: '50 000', v2031: '50 000' },

    { label: 'Total on cost', type: 'total-band' },

    // --- GRAND TOTAL ---
    { label: 'Total', type: 'total-band' }
];

const years = [
    { year: '2024', type: 'realised' },
    { year: '2025', type: 'realised' },
    { year: '2026', type: 'projected' },
    { year: '2027', type: 'projected' },
    { year: '2028', type: 'projected' },
    { year: '2029', type: 'projected' },
    { year: '2030', type: 'projected' },
    { year: '2031', type: 'projected' },
];

const ManagementFees = () => {
    const [rows, setRows] = useState(() => {
        return initialRows.map(row => {
            const newRow = { ...row };
            if (row.type === 'data') {
                years.forEach(({ year }) => {
                    const key = `v${year}`;
                    newRow[key] = row[key] || ''; 
                });
            }
            return newRow;
        });
    });

    // --- Helpers ---
    const formatNumber = (num) => {
        if (num === 0) return '-'; 
        return num.toLocaleString('en-US').replace(/,/g, ' '); 
    };

    const calculateColumnTotal = (yearKey, rowsToSum) => {
        let sum = 0;
        rowsToSum.forEach(row => {
            sum += parseValue(row[yearKey]);
        });
        return formatNumber(sum);
    };

    const getGroupedRows = () => {
        const commitmentIndex = rows.findIndex(r => r.label === 'Total on commitment');
        const costIndex = rows.findIndex(r => r.label === 'Total on cost');
        const sharesRows = rows.slice(0, commitmentIndex);
        const investmentRows = rows.slice(commitmentIndex + 1, costIndex);
        return { sharesRows, investmentRows };
    };

    const getYearValue = (row, year) => {
        const key = `v${year}`;
        if (row.type === 'total-band') {
            const { sharesRows, investmentRows } = getGroupedRows();
            if (row.label === 'Total on commitment') return calculateColumnTotal(key, sharesRows);
            if (row.label === 'Total on cost') return calculateColumnTotal(key, investmentRows);
            if (row.label === 'Total') {
                const sumShares = parseValue(calculateColumnTotal(key, sharesRows));
                const sumInvest = parseValue(calculateColumnTotal(key, investmentRows));
                return formatNumber(sumShares + sumInvest);
            }
        }
        return row[key] || '';
    };

    const handleProjectedChange = (e, rowIndex, year) => {
        if (e.key === 'Enter') {
            const newValue = e.target.value;
            setRows(prev => prev.map((row, i) => 
                i === rowIndex ? { ...row, [`v${year}`]: newValue } : row
            ));
            e.target.blur();
        }
    };

    return (
        <div className="mf-table-container">
            <table className="mf-table">
                <thead>
                    <tr>
                        <th className="th-label col-mf">
                            <div className="th-wrapper mf-wrapper">
                                <span>Management fees</span>
                                <SortIcon className="sort-icon" />
                            </div>
                        </th>
                        
                        {years.map((y) => {
                            // Determine text color based on type
                            const isProjected = y.type === 'projected';
                            const headerClass = isProjected ? 'text-blue' : 'text-black';

                            return (
                                <th key={y.year} className={`col-year ${y.type}`}>
                                    <div className="th-wrapper year-wrapper">
                                        <div className="th-stack">
                                            {/* Top Line: Year + Currency + Sort */}
                                            <div className="th-top">
                                                <span className={`year ${headerClass}`}>{y.year}</span>
                                                <span className="currency-indicator">(€)</span>
                                                <SortIcon className="sort-icon" />
                                            </div>
                                            {/* Bottom Line: Type */}
                                            <div className={`th-bottom ${headerClass}`}>
                                                {y.type}
                                            </div>
                                        </div>
                                    </div>
                                </th>
                            )
                        })}

                        <th className="col-total"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const isTotalRow = row.type === 'total-band';
                        // REMOVED: isReadOnly check so all projected cells are inputs
                        
                        return (
                            <tr key={index} className={isTotalRow ? 'row-total' : 'row-standard'}>
                                <td className="cell-label">
                                    {row.label}
                                </td>

                                {years.map((y) => {
                                    const value = getYearValue(row, y.year);
                                    
                                    if (y.type === 'realised' || isTotalRow) {
                                        return <td key={y.year} className={isTotalRow ? "cell-total-val" : "cell-realised"}>{value}</td>;
                                    } else {
                                        // Projected columns -> Always Input
                                        return (
                                            <td key={y.year} className="cell-projected">
                                                <input 
                                                    key={`${index}-${y.year}-${value}`} 
                                                    className="proj-input" 
                                                    defaultValue={value} 
                                                    onKeyDown={(e) => handleProjectedChange(e, index, y.year)}
                                                />
                                            </td>
                                        );
                                    }
                                })}
                                <td className="cell-total-final"></td> 
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ManagementFees;