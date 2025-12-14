import React, { useState, useEffect, useMemo } from 'react';
import './ProjectedPortfolio.css'; 
import { SortIcon, PlusIcon, LockOpenIcon, LockClosedIcon, SensitivityIcon } from '../Icons'; 
// CHANGED: Use the smart component
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import Sensitivity from '../Sensitivity/Sensitivity'; 

function ProjectedPortfolio({ projectedData, activeMode }) { 
    // 1. Strict Input: Use passed data or empty array.
    const [rows, setRows] = useState(projectedData || []);

    // Sync state if prop changes
    useEffect(() => {
        setRows(projectedData || []);
    }, [projectedData]);

    const [lockedRows, setLockedRows] = useState([]);
    const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null); 

    const COL_SPAN = 9; 

    // --- Logic ---
    const toggleLock = (rowId) => {
        setLockedRows(prev => prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]);
    };

    const handleSensitivityClick = (rowId) => {
        setActiveSensitivityRowId(prev => prev === rowId ? null : rowId);
    };

    // --- Add New Row Logic ---
    const handleAddRow = () => {
        const newRow = {
            id: Date.now(),
            isNew: true,    
            name: "",       
            date: "",       
            duration: "",   
            cost: "",
            exit_value: "", 
            dividends: "",
            irr: "",
            moic: "",
            exitDate: ""    
        };
        setRows([...rows, newRow]);
    };

    // --- Data Update Helper ---
    const handleInputChange = (id, field, value) => {
        setRows((prevRows) => 
            prevRows.map((row) => 
                row.id === id ? { ...row, [field]: value } : row
            )
        );
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

    // --- Date Picker Handler ---
    const handleRowDateChange = (rowId, newDate) => {
        const newDateStr = formatDateForTable(newDate);
        handleInputChange(rowId, 'exitDate', newDateStr);
    };

    // --- 2. Dynamic Summary Calculation ---
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

        const parseVal = (str) => {
            if (!str) return 0;
            return parseFloat(String(str).replace(/[^0-9.-]/g, "")) || 0;
        };

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
            const durationVal = parseFloat(String(row.duration).replace(/[^0-9.]/g, "")) || 0;
            sumDuration += durationVal;
            sumCost += parseVal(row.cost);
            sumExitVal += parseVal(row.exit_value); 
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
        const cls = `proj-th-wrap ${right ? "proj-right" : "proj-left"}`;
        return (
            <div className={cls}>
                <div className="proj-th-group">
                    {text}
                    {showCurrency && <span className="proj-currency-indicator">(€)</span>}
                    <SortIcon className={`proj-sort ${sorted ? "active" : ""}`} />
                </div>
            </div>
        );
    };

    return (
        <div className="portfolio-section">
            <h3 className="section-title">
                Projected portfolio
                <span className="section-count">{rows.length}</span>
            </h3>
            
            <div className="proj-table-container no-borders">
                <table className="proj-table content-fit">
                    <thead>
                        <tr>
                            <th className="proj-col-dealname">{renderSortableHeader("Deal Name", true)}</th>
                            <th>{renderSortableHeader("Duration")}</th>
                            <th className="proj-col-numeric">{renderSortableHeader("Cost", false, true, true)}</th>
                            <th className="proj-col-numeric">{renderSortableHeader("Exit Value", false, true, true)}</th>
                            <th className="proj-col-numeric">{renderSortableHeader("Dividends/Interests", false, true, true)}</th>
                            <th className="proj-col-numeric">{renderSortableHeader("IRR", false, true)}</th>
                            <th className="proj-col-numeric">{renderSortableHeader("MOIC (incl. dividends)", false, true)}</th>
                            <th>{renderSortableHeader("Exit Date")}</th>

                            {(activeMode === 'target' || activeMode === 'sensitivity') && <th className="proj-col-action"></th>}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r, index) => (
                            <React.Fragment key={r.id}>
                                <tr className={index % 2 === 0 ? "proj-gray" : ""}>
                                    {/* DEAL NAME */}
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <input 
                                                className="proj-input proj-input-name" 
                                                value={r.name} 
                                                placeholder={r.isNew ? "New Deal" : ""}
                                                onChange={(e) => handleInputChange(r.id, 'name', e.target.value)}
                                            />
                                        </div>
                                    </td>

                                    {/* DURATION */}
                                    <td>
                                        <input 
                                            className="proj-input" 
                                            value={r.duration} 
                                            placeholder={r.isNew ? "yrs" : ""}
                                            onChange={(e) => handleInputChange(r.id, 'duration', e.target.value)}
                                        />
                                    </td>

                                    {/* COST */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.cost} 
                                            placeholder={r.isNew ? "-" : ""}
                                            onChange={(e) => handleInputChange(r.id, 'cost', e.target.value)}
                                        />
                                    </td>

                                    {/* EXIT VALUE */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.exit_value} 
                                            placeholder={r.isNew ? "-" : ""}
                                            onChange={(e) => handleInputChange(r.id, 'exit_value', e.target.value)}
                                        />
                                    </td>

                                    {/* DIVIDENDS */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.dividends} 
                                            placeholder={r.isNew ? "-" : ""}
                                            onChange={(e) => handleInputChange(r.id, 'dividends', e.target.value)}
                                        />
                                    </td>

                                    {/* IRR */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.irr} 
                                            placeholder={r.isNew ? "-" : ""}
                                            onChange={(e) => handleInputChange(r.id, 'irr', e.target.value)}
                                        />
                                    </td>
                                    
                                    {/* MOIC */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.moic} 
                                            placeholder={r.isNew ? "-" : ""}
                                            onChange={(e) => handleInputChange(r.id, 'moic', e.target.value)} 
                                        />
                                    </td>

                                    {/* DATE PICKER */}
                                    <td className="proj-date-cell">
                                        <DateInputWithPicker 
                                            initialDate={parseDateString(r.exitDate)}
                                            onDateChange={(date) => handleRowDateChange(r.id, date)}
                                            isSingle={true}
                                        />
                                    </td>

                                    {/* ACTION CELL */}
                                    {activeMode === 'target' && (
                                        <td className="proj-center">
                                            <button 
                                                className={`action-icon-btn ${lockedRows.includes(r.id) ? 'locked' : ''}`}
                                                onClick={() => toggleLock(r.id)}
                                            >
                                                {lockedRows.includes(r.id) ? <LockClosedIcon className="lock-icon" /> : <LockOpenIcon className="lock-icon" />}
                                            </button>
                                        </td>
                                    )}

                                    {activeMode === 'sensitivity' && (
                                        <td className="proj-center">
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

                        <tr className="proj-summary-row">
                            <td>Total</td>
                            <td className="proj-right">{summary.avgDuration}</td>
                            <td className="proj-right">{summary.totalCost}</td>
                            <td className="proj-right">{summary.totalExitVal}</td>
                            <td className="proj-right">{summary.totalDividends}</td>
                            <td className="proj-right">{summary.avgIrr}</td>
                            <td className="proj-right">{summary.avgMoic}</td>
                            <td className="proj-right">-</td>
                            
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <td></td>}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* NEW DEAL BUTTON */}
            <button className="proj-add-btn" onClick={handleAddRow}>
                <PlusIcon className="proj-plus-icon" />
                <span>New deal</span>
            </button>
        </div>
    );
}

export default ProjectedPortfolio;