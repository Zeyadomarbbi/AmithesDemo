import React, { useState, useEffect, useMemo } from 'react';
import { LockOpenIcon, LockClosedIcon } from '/src/components/Icons/InteractiveIcons';
import { SensitivityIcon } from '/src/components/Icons/MiscIcons';
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../../../components/Sort/TableSort';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';
import Sensitivity from '../Sensitivity/Sensitivity'; 
import './PortfolioTables.css'; 

function InvestedPortfolio({ fundId, scenarioId, activeMode, investedData, onChangeRow, onRowClick, lockedRows, onToggleLock }) {
    const [localData, setLocalData] = useState(investedData || []);
    const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null); 
    const [closingRowId, setClosingRowId] = useState(null);
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();
    const formatDate = useDateFormatter();

    useEffect(() => {
        setLocalData(investedData || []);
    }, [investedData]);
    console.log("investedData 2 ", investedData)
    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(localData, "name");

    /* ===== HELPERS ===== */

    const calculateExitDate = (firstInvestDate, duration) => {
        if (!firstInvestDate) return null;
        const startDate = new Date(firstInvestDate);
        const yearsToAdd = parseFloat(duration) || 0;
        const totalMonths = Math.round(yearsToAdd * 12);
        
        const targetDate = new Date(startDate);
        targetDate.setMonth(startDate.getMonth() + totalMonths);

        if (targetDate.getDate() !== startDate.getDate()) {
            targetDate.setDate(0);
        }
        return targetDate;
    };

    const calculateExitValue = (cost, moic) => {
        const c = parseFloat(cost) || 0;
        const m = parseFloat(moic) || 0;
        return c * m;
    };

    /* ===== HANDLERS ===== */

    const toggleLock = (rowId) => {
        setLockedRows(prev => 
            prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
        );
    };

    const handleSensitivityClick = (rowId) => {
        if (activeSensitivityRowId === rowId) {
            setClosingRowId(rowId);
            setTimeout(() => {
                setActiveSensitivityRowId(null);
                setClosingRowId(null);
            }, 600); 
        } else {
            setActiveSensitivityRowId(rowId);
            setClosingRowId(null);
        }
    };

    const handleLocalInputChange = (id, field, value) => {
        setLocalData(prev => 
            prev.map(row => row.id === id ? { ...row, [field]: value } : row)
        );
        onChangeRow?.(id, field, value);
    };

    /* ===== CALCULATIONS ===== */

    const summary = useMemo(() => {
        const defaults = {
            avgDuration: 0, totalCost: 0, totalExitVal: 0,
            totalDividends: 0, avgIrr: 0, avgMoic: 0
        };

        if (!localData || localData.length === 0) return defaults;

        const parseVal = (v) => {
            if (typeof v === 'number') return v;
            return parseFloat(String(v || "").replace(/[^0-9.-]/g, "")) || 0;
        };

        let totals = { dur: 0, cost: 0, exit: 0, div: 0, irr: 0, moic: 0 };

        localData.forEach(row => {
            const currentBasis = parseVal(row.display_cost || row.cost);
            const currentExitVal = currentBasis * parseVal(row.input_moic);

            totals.dur += parseVal(row.input_duration);
            totals.cost += currentBasis;
            totals.exit += currentExitVal;
            totals.div += parseVal(row.dividends_interests);
            totals.irr += parseVal(row.irr);
            totals.moic += parseVal(row.input_moic);
        });

        const count = localData.length;

        return {
            avgDuration: totals.dur / count,
            totalCost: totals.cost,
            totalExitVal: totals.exit,
            totalDividends: totals.div,
            avgIrr: totals.irr / count,
            avgMoic: totals.moic / count
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
                            <th className="scenario-pf-left">
                                <SortableHeaderRenderer 
                                    label="Deal Name" columnKey="name"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={false} {false}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="Duration" columnKey="input_duration"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {false}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="Cost" columnKey="cost"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {true}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="Exit Value" columnKey="exit_value"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {true}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="Dividends/Interests" columnKey="dividends_interests"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {true}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="IRR" columnKey="irr"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {false}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="MOIC" columnKey="input_moic"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {false}
                                />
                            </th>
                            <th className="scenario-pf-center">
                                <SortableHeaderRenderer 
                                    label="Exit Date" columnKey="exit_date"
                                    currentSortKey={sortKey}  toggleSort={toggleSort}
                                    center={true} {false}
                                />
                            </th>
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <th className="scenario-pf-center">Actions</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {sortedRows.map((r) => {
                            const calculatedDate = calculateExitDate(r.first_investment_date, r.input_duration);
                            const localExitValue = calculateExitValue(r.display_cost || r.cost, r.input_moic);

                            return (
                                <React.Fragment key={r.id}>
                                    <tr>
                                        <td className="scenario-pf-left">
                                            <div 
                                                className="scenario-pf-name-block" 
                                                onClick={() => onRowClick?.(r)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span className="label">{r.name}</span>
                                                <span className="sub">{formatDate(r.first_investment_date)}</span>
                                            </div>
                                        </td>
                                        <td className="scenario-pf-center">
                                            <input 
                                                className="scenario-pf-input"
                                                value={r.input_duration ?? ""}
                                                onChange={(e) => handleLocalInputChange(r.id, 'input_duration', e.target.value)}
                                            />
                                        </td>
                                        <td className="scenario-pf-center">
                                            <input className="scenario-pf-input" value={formatNumber(r.display_cost || r.cost)} readOnly />
                                        </td>
                                        <td className="scenario-pf-center">
                                            <input className="scenario-pf-input" value={formatNumber(localExitValue)} readOnly />
                                        </td>
                                        <td className="scenario-pf-center">
                                            <input className="scenario-pf-input" value={formatNumber(r.dividends_interests)} readOnly />
                                        </td>
                                        <td className="scenario-pf-center">
                                            <input className="scenario-pf-input" value={formatPercent(r.irr)} readOnly />
                                        </td>
                                        <td className="scenario-pf-center">
                                            <input 
                                                className="scenario-pf-input"
                                                value={r.input_moic ?? ""}
                                                onChange={(e) => handleLocalInputChange(r.id, 'input_moic', e.target.value)}
                                            />
                                        </td>
                                        <td className="scenario-pf-center">
                                            <DateInputWithPicker 
                                                initialDate={calculatedDate || new Date()}
                                                onDateChange={() => {}} 
                                                disabled={true}
                                                isSingle={true}
                                                dateFormat="DD/MM/YYYY"
                                            />
                                        </td>

                                        {(activeMode === 'target' || activeMode === 'sensitivity') && (
                                            <td className="scenario-pf-center">
                                                <div className="scenario-pf-th-group" style={{justifyContent: 'center'}}>
                                                    {activeMode === 'target' && (
                                                        <button 
                                                            className={`scenario-pf-action-btn ${lockedRows.includes(r.id) ? 'locked' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent row click
                                                                onToggleLock(r.id);
                                                            }}
                                                        >
                                                            {lockedRows.includes(r.id) ? <LockClosedIcon /> : <LockOpenIcon />}
                                                        </button>
                                                    )}
                                                    {activeMode === 'sensitivity' && (
                                                        <button 
                                                            className="scenario-pf-action-btn sensitivity"
                                                            onClick={() => handleSensitivityClick(r.id)}
                                                        >
                                                            <SensitivityIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>

                                {(activeMode === 'sensitivity' && (activeSensitivityRowId === r.id || closingRowId === r.id)) && (
                                    <tr className="scenario-pf-sensitivity-expanded-row">
                                        <td colSpan={COL_SPAN} className="scenario-pf-center"> 
                                            <Sensitivity 
                                                fundId={fundId}
                                                scenarioId={scenarioId}
                                                rowData={r} 
                                                isClosing={closingRowId === r.id}
                                            />
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            );
                        })}

                        <tr className="scenario-pf-summary-row">
                            <td className="scenario-pf-left">Total</td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value={`${summary.avgDuration.toFixed(1)} yrs`} readOnly />
                            </td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value={formatNumber(summary.totalCost)} readOnly />
                            </td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value={formatNumber(summary.totalExitVal)} readOnly />
                            </td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value={formatNumber(summary.totalDividends)} readOnly />
                            </td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value={formatPercent(summary.avgIrr)} readOnly />
                            </td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value={`${summary.avgMoic.toFixed(2)}x`} readOnly />
                            </td>
                            <td className="scenario-pf-center">
                                <input className="scenario-pf-input" value="-" readOnly />
                            </td>
                            {(activeMode === 'target' || activeMode === 'sensitivity') && <td></td>}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InvestedPortfolio;