import React, { useState, useEffect, useMemo } from 'react';
import './InvestedPortfolio.css';
import { SortIcon, LockOpenIcon, LockClosedIcon, SensitivityIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import Sensitivity from '../Sensitivity/Sensitivity'; 

function InvestedPortfolio({ activeMode, investedData }) { 
    // 1. Strict Input: Use passed data or empty array. No internal mock data.
    const [rows, setRows] = useState(investedData || []);
    
    // Sync state if prop changes
    useEffect(() => {
        setRows(investedData || []);
    }, [investedData]);

    const [lockedRows, setLockedRows] = useState([]);
    const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null); 

    // --- Logic ---
    const toggleLock = (rowId) => {
        setLockedRows(prev => 
            prev.includes(rowId) 
                ? prev.filter(id => id !== rowId) 
                : [...prev, rowId]
        );
    };

    const handleSensitivityClick = (rowId) => {
        setActiveSensitivityRowId(prev => prev === rowId ? null : rowId);
    };

    // --- Date Helper Logic ---
    const formatDateForTable = (dateObj) => { 
        if (!dateObj) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear(); 
        return `${day}.${month}.${String(year).slice(-2)}`; 
    };
    
    const parseDateString = (dateStr) => { 
        if (!dateStr) return new Date();
        const parts = dateStr.split('.'); 
        if (parts.length !== 3) return new Date();
        let [day, month, year] = parts;
        if (year.length === 2) year = "20" + year;
        return new Date(year, month - 1, day);
    };

    const handleInputChange = (id, field, value) => {
        setRows((prevRows) => 
            prevRows.map((row) => 
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const handleRowDateChange = (rowId, newDate) => {
        const newDateStr = formatDateForTable(newDate);
        handleInputChange(rowId, 'exitDate', newDateStr);
    };

    // --- 2. Dynamic Summary Calculation (Matches RealizedPortfolio Pattern) ---
    const summary = useMemo(() => {
        const defaults = {
            avgDuration: "0 yrs",
            totalCost: "0",
            totalExitVal: "0",
            totalDividends: "0",
            avgIrr: "0.00%",
            avgMoic: "0.00x"
        };

        if (!rows || rows.length === 0) return defaults;

        // Helper: Clean string and parse to float
        const parseVal = (str) => {
            if (!str) return 0;
            return parseFloat(String(str).replace(/[^0-9.-]/g, "")) || 0;
        };

        // Helper: Format number with spaces
        const formatNum = (num) => {
            return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        };

        let sumDuration = 0;
        let sumCost = 0;
        let sumExitVal = 0;
        let sumDividends = 0;
        let sumIrr = 0;
        let sumMoic = 0;

        rows.forEach(row => {
            // Extract numeric duration (e.g., "3 yrs" -> 3)
            const durationVal = parseFloat(String(row.duration).replace(/[^0-9.]/g, "")) || 0;
            
            sumDuration += durationVal;
            sumCost += parseVal(row.cost);
            sumExitVal += parseVal(row.exit_value); // Note: check key name (exit_value vs exitVal)
            sumDividends += parseVal(row.dividends);
            sumIrr += parseVal(row.irr);
            sumMoic += parseVal(row.moic);
        });

        const count = rows.length;

        return {
            avgDuration: (sumDuration / count).toFixed(1) + " yrs",
            totalCost: formatNum(sumCost),
            totalExitVal: formatNum(sumExitVal),
            totalDividends: formatNum(sumDividends),
            avgIrr: (sumIrr / count).toFixed(2) + "%",
            avgMoic: (sumMoic / count).toFixed(2) + "x"
        };
    }, [rows]);

    const renderSortableHeader = (text, sorted = false, right = false, showCurrency = false) => {
        const cls = `inv-th-wrap ${right ? "inv-right" : "inv-left"}`;
        return (
            <div className={cls}>
                <div className="inv-th-group">
                    {text}
                    {showCurrency && <span className="inv-currency-indicator">(€)</span>}
                    <SortIcon className={`inv-sort ${sorted ? "active" : ""}`} />
                </div>
            </div>
        );
    };

    const COL_SPAN = 9; 

    return (
        <div className="portfolio-section">
            <h3 className="section-title">
                Invested portfolio
                <span className="section-count">{rows.length}</span>
            </h3>
            
            <div className="inv-table-container no-borders">
                <table className="inv-table content-fit">
                    <thead>
                        <tr>
                            <th className="inv-col-dealname">{renderSortableHeader("Deal Name", true)}</th>
                            <th>{renderSortableHeader("Duration")}</th>
                            <th className="inv-col-numeric">{renderSortableHeader("Cost", false, true, true)}</th>
                            <th className="inv-col-numeric">{renderSortableHeader("Exit Value", false, true, true)}</th>
                            <th className="inv-col-numeric">{renderSortableHeader("Dividends/Interests", false, true, true)}</th>
                            <th className="inv-col-numeric">{renderSortableHeader("IRR", false, true)}</th>
                            <th className="inv-col-numeric">{renderSortableHeader("MOIC (incl. dividends)", false, true)}</th>
                            <th>{renderSortableHeader("Exit Date")}</th>
                            
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <th className="inv-col-action"></th>}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r, index) => (
                            <React.Fragment key={r.id}>
                                <tr className={index % 2 === 0 ? "inv-gray" : ""}>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 500 }}>{r.name}</span>
                                            <span style={{ fontSize: "12px", color: "#375A89" }}>{r.date}</span>
                                        </div>
                                    </td>
                                    <td className="inv-right">{r.duration}</td>
                                    <td className="inv-right">{r.cost}</td>
                                    <td className="inv-right">{r.exit_value}</td>
                                    <td className="inv-right">{r.dividends}</td>
                                    <td className="inv-right">{r.irr}</td>
                                    <td className="inv-right">
                                        <input 
                                            className="inv-input" 
                                            value={r.moic} 
                                            onChange={(e) => handleInputChange(r.id, 'moic', e.target.value)} 
                                        />
                                    </td>

                                    <td className="inv-date-cell">
                                        <DateInputWithPicker 
                                            initialDate={parseDateString(r.exitDate)}
                                            onDateChange={(date) => handleRowDateChange(r.id, date)}
                                            isSingle={true}
                                        />
                                    </td>

                                    {/* Action Cells */}
                                    {activeMode === 'target' && (
                                        <td className="inv-center">
                                            <button 
                                                className={`action-icon-btn ${lockedRows.includes(r.id) ? 'locked' : ''}`}
                                                onClick={() => toggleLock(r.id)}
                                            >
                                                {lockedRows.includes(r.id) ? <LockClosedIcon /> : <LockOpenIcon />}
                                            </button>
                                        </td>
                                    )}

                                    {activeMode === 'sensitivity' && (
                                        <td className="inv-center">
                                            <button 
                                                className="action-icon-btn sensitivity"
                                                onClick={() => handleSensitivityClick(r.id)}
                                            >
                                                <SensitivityIcon />
                                            </button>
                                        </td>
                                    )}
                                </tr>

                                {activeMode === 'sensitivity' && activeSensitivityRowId === r.id && (
                                    <tr className="sensitivity-expanded-row">
                                        <td colSpan={COL_SPAN} className="sensitivity-table-cell"> 
                                            <Sensitivity rowData={r} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}

                        <tr className="inv-summary-row">
                            <td>Total</td>
                            <td className="inv-right">{summary.avgDuration}</td>
                            <td className="inv-right">{summary.totalCost}</td>
                            <td className="inv-right">{summary.totalExitVal}</td>
                            <td className="inv-right">{summary.totalDividends}</td>
                            <td className="inv-right">{summary.avgIrr}</td>
                            <td className="inv-right">{summary.avgMoic}</td>
                            <td className="inv-right">-</td>
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <td></td>}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InvestedPortfolio;