import React, { useState, useEffect, useMemo } from 'react';
import { 
    LockOpenIcon, 
    LockClosedIcon, 
    SensitivityIcon 
} from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../../../components/Sort/TableSort';
import Sensitivity from '../Sensitivity/Sensitivity'; 
import './PortfolioTables.css'; 

function InvestedPortfolio({ activeMode, investedData, onChangeRow }) {
    const [localData, setLocalData] = useState(investedData || []);
    const [lockedRows, setLockedRows] = useState([]);
    const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null); 

    useEffect(() => {
        setLocalData(investedData || []);
    }, [investedData]);

    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(localData, "name");

    const calculateExitDate = (firstInvestDate, duration) => {
        if (!firstInvestDate) return null;
        const date = new Date(firstInvestDate);
        const yearsToAdd = parseFloat(duration) || 0;
        date.setFullYear(date.getFullYear() + Math.floor(yearsToAdd));
        const extraMonths = Math.round((yearsToAdd % 1) * 12);
        date.setMonth(date.getMonth() + extraMonths);
        return date;
    };

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

    const handleLocalInputChange = (id, field, value) => {
        setLocalData(prev => 
            prev.map(row => row.id === id ? { ...row, [field]: value } : row)
        );
        onChangeRow?.(id, field, value);
    };

    const summary = useMemo(() => {
        const defaults = {
            avgDuration: "0 yrs", totalCost: "0", totalExitVal: "0",
            totalDividends: "0", avgIrr: "0.00%", avgMoic: "0.00x"
        };

        if (!localData || localData.length === 0) return defaults;

        const parseVal = (v) => parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0;
        const formatNum = (n) => n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        let totals = { dur: 0, cost: 0, exit: 0, div: 0, irr: 0, moic: 0 };

        localData.forEach(row => {
            totals.dur += parseVal(row.input_duration);
            totals.cost += parseVal(row.display_cost || row.cost);
            totals.exit += parseVal(row.exit_value);
            totals.div += parseVal(row.dividends_interests);
            totals.irr += parseVal(row.irr);
            totals.moic += parseVal(row.input_moic);
        });

        const count = localData.length;

        return {
            avgDuration: (totals.dur / count).toFixed(1) + " yrs",
            totalCost: formatNum(totals.cost),
            totalExitVal: formatNum(totals.exit),
            totalDividends: formatNum(totals.div),
            avgIrr: (totals.irr / count).toFixed(2) + "%",
            avgMoic: (totals.moic / count).toFixed(2) + "x"
        };
    }, [localData]);

    const COL_SPAN = (activeMode === 'target' || activeMode === 'sensitivity') ? 9 : 8; 

    return (
        <div className="scenario-pf-section">
            <h3 className="scenario-pf-section-title">
                Invested portfolio
                <span className="scenario-pf-section-count">{localData.length}</span>
            </h3>
            
            <div className="scenario-pf-table-container no-borders">
                <table className="scenario-pf-table content-fit">
                    <thead>
                        <tr>
                            <th className="scenario-pf-col-dealname">
                                <SortableHeaderRenderer 
                                    label="Deal Name" columnKey="name"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="Duration" columnKey="input_duration"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="Cost" columnKey="cost"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                    right={false} showCurrency={true}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="Exit Value" columnKey="exit_value"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                    right={false} showCurrency={true}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="Dividends/Interests" columnKey="dividends_interests"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                    right={false} showCurrency={true}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="IRR" columnKey="irr"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                    right={false}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="MOIC" columnKey="input_moic"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                    right={false}
                                />
                            </th>
                            <th>
                                <SortableHeaderRenderer 
                                    label="Exit Date" columnKey="exit_date"
                                    currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                />
                            </th>
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <th className="scenario-pf-col-action"></th>}
                        </tr>
                    </thead>

                    <tbody>
                        {sortedRows.map((r, index) => {
                            const calculatedDate = calculateExitDate(r.first_investment_date, r.input_duration);

                            return (
                                <React.Fragment key={r.id}>
                                    <tr className={index % 2 === 0 ? "scenario-pf-gray" : ""}>
                                        <td className="scenario-pf-left">
                                            <div className="scenario-pf-name-block">
                                                <span className="label">{r.name}</span>
                                                <span className="sub">{r.first_investment_date || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="scenario-pf-left">
                                            <input 
                                                className="scenario-pf-input"
                                                value={r.input_duration ?? ""}
                                                onChange={(e) => handleLocalInputChange(r.id, 'input_duration', e.target.value)}
                                            />
                                        </td>
                                        <td className="scenario-pf-left">
                                            <input className="scenario-pf-input" value={r.display_cost || r.cost || 0} readOnly />
                                        </td>
                                        <td className="scenario-pf-left">
                                            <input className="scenario-pf-input" value={r.exit_value || 0} readOnly />
                                        </td>
                                        <td className="scenario-pf-left">
                                            <input className="scenario-pf-input" value={r.dividends_interests || 0} readOnly />
                                        </td>
                                        <td className="scenario-pf-left">
                                            <input className="scenario-pf-input" value={r.irr || "0.00%"} readOnly />
                                        </td>
                                        <td className="scenario-pf-left">
                                            <input 
                                                className="scenario-pf-input"
                                                value={r.input_moic ?? ""}
                                                onChange={(e) => handleLocalInputChange(r.id, 'input_moic', e.target.value)}
                                            />
                                        </td>
                                        <td className="scenario-pf-left">
                                            <DateInputWithPicker 
                                                initialDate={calculatedDate || new Date()}
                                                onDateChange={() => {}} 
                                                disabled={true}
                                                isSingle={true}
                                                dateFormat="DD/MM/YYYY"
                                            />
                                        </td>

                                        {activeMode === 'target' && (
                                            <td className="scenario-pf-center">
                                                <button 
                                                    className={`scenario-pf-action-btn ${lockedRows.includes(r.id) ? 'locked' : ''}`}
                                                    onClick={() => toggleLock(r.id)}
                                                >
                                                    {lockedRows.includes(r.id) ? <LockClosedIcon /> : <LockOpenIcon />}
                                                </button>
                                            </td>
                                        )}

                                        {activeMode === 'sensitivity' && (
                                            <td className="scenario-pf-center">
                                                <button 
                                                    className="scenario-pf-action-btn sensitivity"
                                                    onClick={() => handleSensitivityClick(r.id)}
                                                >
                                                    <SensitivityIcon />
                                                </button>
                                            </td>
                                        )}
                                    </tr>

                                    {activeMode === 'sensitivity' && activeSensitivityRowId === r.id && (
                                        <tr className="scenario-pf-sensitivity-expanded-row">
                                            <td colSpan={COL_SPAN} className="scenario-pf-left"> 
                                                <Sensitivity rowData={r} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        <tr className="scenario-pf-summary-row">
                            <td className="scenario-pf-left">Total</td>
                            <td className="scenario-pf-left">{summary.avgDuration}</td>
                            <td className="scenario-pf-left">{summary.totalCost}</td>
                            <td className="scenario-pf-left">{summary.totalExitVal}</td>
                            <td className="scenario-pf-left">{summary.totalDividends}</td>
                            <td className="scenario-pf-left">{summary.avgIrr}</td>
                            <td className="scenario-pf-left">{summary.avgMoic}</td>
                            <td className="scenario-pf-left">-</td>
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <td></td>}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InvestedPortfolio;