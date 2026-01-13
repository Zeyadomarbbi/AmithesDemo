import React, { useState } from 'react';
import './ProjectedPortfolio.css'; 
import { SortIcon, CalendarIcon, PlusIcon, LockOpenIcon, LockClosedIcon, SensitivityIcon } from '../Icons'; 
import DatePicker from '../../../../../../../../../../components/DatePicker';
import Sensitivity from '../Sensitivity/Sensitivity'; // IMPORT Sensitivity component

const projectedData = [
    { 
        id: 1,
        name: "Solenix...",
        date: "", 
        duration: "-", 
        cost: "8 000 000",
        exit_value: "16 000 000",
        dividends: "150 000",
        irr: "12.45%",
        moic: "2.00x",
        exitDate: "07.08.25"
        // implicitly isNew: undefined (falsy)
    }
];

function ProjectedPortfolio({ data, activeMode }) { 
    const [rows, setRows] = useState(data || projectedData);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeRowId, setActiveRowId] = useState(null);
    const [lockedRows, setLockedRows] = useState([]);
    
    // --- NEW STATE: Active Sensitivity Row ---
    const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null); 

    // Total number of columns (8 data + 1 action)
    const COL_SPAN = 9; 

    // --- Logic ---
    const toggleLock = (rowId) => {
        setLockedRows(prev => prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]);
    };

    const handleSensitivityClick = (rowId) => {
        // Toggles the visibility of the Sensitivity Table for the clicked row
        setActiveSensitivityRowId(prev => prev === rowId ? null : rowId);
    };

    // --- Add New Row Logic ---
    const handleAddRow = () => {
        const newRow = {
            id: Date.now(),
            isNew: true, 	// <--- Flag to identify new rows
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

    // --- Date Picker Helper Logic ---
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

    const summary = {
        avgDuration: "-",
        totalCost: "8 000 000",
        totalExitVal: "16 000 000",
        totalDividends: "150 000",
        avgIrr: "12.45%", 
        avgMoic: "2.05x"
    };

    return (
        <div className="portfolio-section">
            <h3 className="section-title">
                Projected portfolio
                <span className="count">{rows.length}</span>
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

                            {/* === CONDITIONAL HEADERS === */}
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
                                                placeholder={r.isNew ? "New Deal Name" : ""}
                                                onChange={(e) => handleInputChange(r.id, 'name', e.target.value)}
                                            />
                                            <span style={{ fontSize: "12px", color: "#375A89", marginTop: "2px" }}>{r.date}</span>
                                        </div>
                                    </td>

                                    {/* DURATION */}
                                    <td>
                                        <input 
                                            className="proj-input" 
                                            style={{ width: '40px' }}
                                            value={r.duration} 
                                            onChange={(e) => handleInputChange(r.id, 'duration', e.target.value)}
                                        />
                                    </td>

                                    {/* COST */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.cost} 
                                            onChange={(e) => handleInputChange(r.id, 'cost', e.target.value)}
                                        />
                                    </td>

                                    {/* EXIT VALUE (Editable ONLY if New) */}
                                    <td className="proj-right">
                                        {r.isNew ? (
                                            <input 
                                                className="proj-input" 
                                                value={r.exit_value} 
                                                onChange={(e) => handleInputChange(r.id, 'exit_value', e.target.value)}
                                            />
                                        ) : (
                                            <span>{r.exit_value}</span>
                                        )}
                                    </td>

                                    {/* DIVIDENDS (Editable ONLY if New) */}
                                    <td className="proj-right">
                                        {r.isNew ? (
                                            <input 
                                                className="proj-input" 
                                                value={r.dividends} 
                                                onChange={(e) => handleInputChange(r.id, 'dividends', e.target.value)}
                                            />
                                        ) : (
                                            <span>{r.dividends}</span>
                                        )}
                                    </td>

                                    {/* IRR (Editable ONLY if New) */}
                                    <td className="proj-right">
                                        {r.isNew ? (
                                            <input 
                                                className="proj-input" 
                                                value={r.irr} 
                                                onChange={(e) => handleInputChange(r.id, 'irr', e.target.value)}
                                            />
                                        ) : (
                                            <span>{r.irr}</span>
                                        )}
                                    </td>
                                    
                                    {/* MOIC */}
                                    <td className="proj-right">
                                        <input 
                                            className="proj-input" 
                                            value={r.moic} 
                                            onChange={(e) => handleInputChange(r.id, 'moic', e.target.value)} 
                                        />
                                    </td>

                                    {/* DATE PICKER */}
                                    <td>
                                        <div className="proj-date-wrapper">
                                            <input
                                                className="proj-input proj-date-input" 
                                                value={r.exitDate}
                                                readOnly
                                                onClick={() => handleDateClick(r.id)}
                                            />
                                            <div className="proj-icon-overlay">
                                                <CalendarIcon />
                                            </div>

                                            {showDatePicker && activeRowId === r.id && (
                                                <div className="proj-picker-anchor">
                                                    <DatePicker 
                                                        onClose={handleClose}
                                                        onApply={handleApplyDate}
                                                        initialDate={r.exitDate ? parseDateString(r.exitDate) : new Date()} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* === CONDITIONAL ACTION CELL (Target) === */}
                                    {activeMode === 'target' && (
                                        <td className="proj-center">
                                            <button 
                                                className={`action-icon-btn ${lockedRows.includes(r.id) ? 'locked' : ''}`}
                                                onClick={() => toggleLock(r.id)}
                                            >
                                                {lockedRows.includes(r.id) ? (
                                                    <LockClosedIcon className="lock-icon" />
                                                ) : (
                                                    <LockOpenIcon className="lock-icon" />
                                                )}
                                            </button>
                                        </td>
                                    )}

                                    {/* === CONDITIONAL ACTION CELL (Sensitivity) === */}
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

                        <tr className="proj-summary-row">
                            <td>Total</td>
                            <td>-</td>
                            <td className="proj-right">{summary.totalCost}</td>
                            <td className="proj-right">{summary.totalExitVal}</td>
                            <td className="proj-right">{summary.totalDividends}</td>
                            <td className="proj-right">{summary.avgIrr}</td>
                            <td className="proj-right">{summary.avgMoic}</td>
                            <td className="proj-right">-</td>
                            
                            {/* Empty cell for Action column in summary */}
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