import React, { useState } from 'react';
import './InvestedPortfolio.css';
import { SortIcon, CalendarIcon, LockOpenIcon, LockClosedIcon, SensitivityIcon } from '../Icons'; 
import DatePicker from '../../../../../../../../../../components/DatePicker';
import Sensitivity from '../Sensitivity/Sensitivity'; // Adjust path as needed

const investedData = [
    { 
        id: 1,
        name: "Vantech AI",
        date: "30.06.21",
        duration: "3 yrs",
        cost: "8 000 000",
        exit_value: "20 000 000",
        dividends: "-",
        irr: "18.40%",
        moic: "2.50x",
        exitDate: "07.08.26"
    },
    { 
        id: 2,
        name: "Alyra BioTech",
        date: "30.06.22",
        duration: "2 yrs",
        cost: "7 000 000",
        exit_value: "10 500 000",
        dividends: "100000",
        irr: "10.10%",
        moic: "1.51x",
        exitDate: "07.08.27"
    },
    { 
        id: 3,
        name: "NeoGrid",
        date: "30.06.23",
        duration: "1 yr",
        cost: "9 000 000",
        exit_value: "18 000 000",
        dividends: "-",
        irr: "22.00%",
        moic: "2.02x",
        exitDate: "07.08.28"
    },
    { 
        id: 4,
        name: "Medisis",
        date: "30.06.24",
        duration: "0 yrs",
        cost: "10 000 000",
        exit_value: "30 000 000",
        dividends: "-",
        irr: "30.00%",
        moic: "3.00x",
        exitDate: "07.08.29"
    }
];

function InvestedPortfolio({ activeMode }) { 
    const [rows, setRows] = useState(investedData);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeRowId, setActiveRowId] = useState(null);
    const [lockedRows, setLockedRows] = useState([]);

    // --- NEW STATE: Active Sensitivity Row ---
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
        // Toggles the visibility of the Sensitivity Table for the clicked row
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

    // --- Date Picker Handlers ---
    const handleDateClick = (rowId) => {
        setActiveRowId(rowId);
        setShowDatePicker(true);
    };

    const handleClose = () => {
        setShowDatePicker(false);
        setActiveRowId(null);
    };

    const handleApplyDate = (selection) => {
        if (selection && selection.start) {
            const newDateStr = formatDateForTable(selection.start);
            setRows((prevRows) => 
                prevRows.map((row) => {
                    if (row.id === activeRowId) {
                        return { ...row, exitDate: newDateStr };
                    }
                    return row;
                })
            );
        }
        handleClose();
    };

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

    const summary = {
        avgDuration: "5 yrs",
        totalCost: "16 000 000",
        totalExitVal: "37 000 000",
        totalDividends: "1 500 000",
        avgIrr: "18.77%", 
        avgMoic: "2.33x"
    };

    // Total number of columns (8 data + 1 action)
    const COL_SPAN = 9; 

    return (
        <div className="portfolio-section">
            <h3 className="section-title">
                Invested portfolio
                <span className="count">{rows.length}</span>
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
                            
                            {/* === CONDITIONAL HEADERS === */}
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
                                    <td>{r.duration}</td>
                                    <td className="inv-right">{r.cost}</td>
                                    <td className="inv-right">{r.exit_value}</td>
                                    <td className="inv-right">{r.dividends}</td>
                                    <td className="inv-right">{r.irr}</td>
                                    <td className="inv-right">
                                        <input className="inv-input" value={r.moic} onChange={() => {}} />
                                    </td>

                                    {/* Date Cell */}
                                    <td>
                                        <div className="inv-date-wrapper">
                                            <input
                                                className="inv-input inv-date-input" 
                                                value={r.exitDate}
                                                readOnly
                                                onClick={() => handleDateClick(r.id)}
                                            />
                                            <div className="inv-icon-overlay">
                                                <CalendarIcon />
                                            </div>
                                            {showDatePicker && activeRowId === r.id && (
                                                <div className="inv-picker-anchor">
                                                    <DatePicker 
                                                        onClose={handleClose}
                                                        onApply={handleApplyDate}
                                                        initialDate={r.exitDate ? parseDateString(r.exitDate) : new Date()} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* === CONDITIONAL ACTION CELL (Target/Sensitivity) === */}
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

                                {/* === CONDITIONAL SENSITIVITY TABLE ROW === */}
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
                            <td>-</td>
                            <td className="inv-right">{summary.totalCost}</td>
                            <td className="inv-right">{summary.totalExitVal}</td>
                            <td className="inv-right">{summary.totalDividends}</td>
                            <td className="inv-right">{summary.avgIrr}</td>
                            <td className="inv-right">{summary.avgMoic}</td>
                            <td className="inv-right">-</td>
                            
                            {/* Empty cell for Action column in summary */}
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <td></td>}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InvestedPortfolio;