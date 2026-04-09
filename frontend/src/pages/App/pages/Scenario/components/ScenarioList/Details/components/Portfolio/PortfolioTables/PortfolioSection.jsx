import React, { useState, useEffect, useMemo } from 'react';
import { xirr as xirrLib } from "@webcarrot/xirr";
import { LockOpenIcon, LockClosedIcon } from '/src/components/Icons/InteractiveIcons';
import { SensitivityIcon } from '/src/components/Icons/MiscIcons';
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../../../components/Sort/TableSort';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';
import Sensitivity from '../Sensitivity/Sensitivity';
import './PortfolioTables.css';


const parseVal = (v) => {
    if (typeof v === 'number') return v;
    return parseFloat(String(v || "").replace(/[^0-9.-]/g, "")) || 0;
};

const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return null;
    const hasPos = cashflows.some((c) => c.amount > 0);
    const hasNeg = cashflows.some((c) => c.amount < 0);
    if (!hasPos || !hasNeg) return null;
    return xirrLib(cashflows);
  } catch (err) {
    console.error("XIRR Lib Error:", err);
    return null;
  }
};


const calculateExitDate = (firstInvestDate, duration) => {
    if (!firstInvestDate) return null;
    const startDate = new Date(firstInvestDate);
    const totalMonths = Math.round((parseFloat(duration) || 0) * 12);
    const targetDate = new Date(startDate);
    targetDate.setMonth(startDate.getMonth() + totalMonths);
    if (targetDate.getDate() !== startDate.getDate()) targetDate.setDate(0);
    return targetDate;
};

const calculateExitValue = (cost, moic) => parseVal(cost) * parseVal(moic);

const buildSummary = (rows) => {
    if (!rows || rows.length === 0) {
        return { avgDuration: 0, totalCost: 0, totalExitVal: 0, totalDividends: 0, totalIrr: 0, totalMoic: 0 };
    }

    let sum = { cost: 0, exit: 0, dividends: 0, durationWeight: 0 };
    let aggregateCashflows = [];

    rows.forEach(r => {
        const cost = parseVal(r.display_cost || r.cost);
        const duration = parseVal(r.input_duration);
        const exitValue = parseVal(r.exit_value);
        const exitDate = r.exit_date;
        const dividends = parseVal(r.dividends_interests);

        sum.cost += cost;
        sum.exit += exitValue;
        sum.dividends += dividends;
        sum.durationWeight += (duration * cost); 

        const flows = r.transaction_flows || [];
        flows.forEach(f => {
            if (f.is_deleted) return;
            const type = (f.transaction_name || f.transaction_type_name || f.type || "").toLowerCase();
            const amt = parseVal(f.amount); 
            
            let signedAmount = 0;
            if (type.includes("invest") && !type.includes("divest")) {
                signedAmount = -Math.abs(amt);
            } else {
                signedAmount = Math.abs(amt);
            }
            
            aggregateCashflows.push({ date: new Date(f.date), amount: signedAmount });
        });

        if (exitDate && exitValue !== 0) {
            aggregateCashflows.push({
                date: new Date(exitDate),
                amount: Math.abs(exitValue)
            });
        }
    });

    const totalMoic = sum.cost > 0 ? (sum.exit + sum.dividends) / sum.cost : 0;
    const weightedDuration = sum.cost > 0 ? sum.durationWeight / sum.cost : 0;

    aggregateCashflows.sort((a, b) => a.date - b.date);
    const validCashflows = aggregateCashflows.filter(cf => cf.date instanceof Date && !isNaN(cf.date));
    const totalIrr = safeXirr(validCashflows) || 0;

    return {
        avgDuration: weightedDuration,
        totalCost: sum.cost,
        totalExitVal: sum.exit,
        totalDividends: sum.dividends,
        totalIrr: totalIrr,
        totalMoic: totalMoic,
    };
};



function PortfolioSection({
    title,
    fundId,
    scenarioId,
    rows = [],
    readOnly = false,
    activeMode = null,
    hasActions = false, // Added to catch the prop passed from Portfolio.jsx
    onChangeRow,
    onRowClick,
    lockedRows = [],
    onToggleLock,
}) {
    const [localRows, setLocalRows] = useState(rows);
    const [activeSensitivityRowId, setActiveSensitivityRowId] = useState(null);
    const [closingRowId, setClosingRowId] = useState(null);

    const formatNumber  = useNumberFormatter();
    const formatPercent = usePercentageFormatter();
    const formatDate    = useDateFormatter();

    const { sorted: sortedRows, sortKey, toggleSort } = useTableSort(localRows, "name");

    useEffect(() => { setLocalRows(rows); }, [rows]);

    const summary    = useMemo(() => buildSummary(localRows), [localRows]);
    
    // Determines if the 9th column should exist in the grid at all
    const showActionsColumn = hasActions || activeMode === 'target' || activeMode === 'sensitivity';
    
    // Determines if THIS specific section should render the interactive buttons
    const canShowButtons = !readOnly && showActionsColumn;
    
    const baseColumns = 8;
    const COL_SPAN = showActionsColumn ? baseColumns + 1 : baseColumns;

    const handleLocalInputChange = (id, field, value) => {
        setLocalRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
        onChangeRow?.(id, field, value);
    };

    const handleSensitivityClick = (rowId) => {
        if (activeSensitivityRowId === rowId) {
            setClosingRowId(rowId);
            setTimeout(() => { setActiveSensitivityRowId(null); setClosingRowId(null); }, 600);
        } else {
            setActiveSensitivityRowId(rowId);
            setClosingRowId(null);
        }
    };

    return (
        <>
            <thead>
                <tr>
                    <th className="scenario-pf-section-header" colSpan={COL_SPAN}>
                        <span className="scenario-pf-section-title">
                            {title}
                            <span className="scenario-pf-section-count">{localRows.length}</span>
                        </span>
                    </th>
                </tr>
                <tr>
                    <th className="scenario-pf-left">
                        <SortableHeaderRenderer label="Deal Name" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} center={false}  />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="Duration" columnKey="input_duration" currentSortKey={sortKey} toggleSort={toggleSort} center={true}  />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="Cost" columnKey="cost" currentSortKey={sortKey} toggleSort={toggleSort} center={true}  />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="Exit Value" columnKey="exit_value" currentSortKey={sortKey} toggleSort={toggleSort} center={true}  />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="Dividends/Interests" columnKey="dividends_interests" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="IRR" columnKey="irr" currentSortKey={sortKey} toggleSort={toggleSort} center={true}  />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="MOIC" columnKey="input_moic" currentSortKey={sortKey} toggleSort={toggleSort} center={true}  />
                    </th>
                    <th className="scenario-pf-center">
                        <SortableHeaderRenderer label="Exit Date" columnKey="exit_date" currentSortKey={sortKey} toggleSort={toggleSort} center={true} />
                    </th>
                    {/* Render column header but hide text if readOnly is true */}
                    {showActionsColumn && <th className="scenario-pf-center">{canShowButtons ? 'Actions' : ''}</th>}
                </tr>
            </thead>

            <tbody>
                {sortedRows.map((r) => {
                    const calculatedDate = calculateExitDate(r.first_investment_date, r.input_duration);
                    const localExitValue = calculateExitValue(r.display_cost || r.cost, r.input_moic);
                    const isSensitivityActive = activeMode === 'sensitivity' && activeSensitivityRowId === r.id;
                    return (
                        <React.Fragment key={r.id}>
                            <tr className={isSensitivityActive ? 'scenario-pf-row-active' : ''}>
                                <td className="scenario-pf-left">
                                    <div
                                        className="scenario-pf-name-block"
                                        onClick={() => onRowClick?.(r)}
                                        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                    >
                                        <span className="label">{r.name}</span>
                                        <span className="sub">{formatDate(r.first_investment_date)}</span>
                                    </div>
                                </td>

                                <td className="scenario-pf-center">
                                    {readOnly
                                        ? <input className="scenario-pf-input" value={r.input_duration || 0} readOnly />
                                        : <input className="scenario-pf-input" value={r.input_duration ?? ""} onChange={(e) => handleLocalInputChange(r.id, 'input_duration', e.target.value)} />
                                    }
                                </td>

                                <td className="scenario-pf-center">
                                    <input className="scenario-pf-input" value={formatNumber(r.display_cost || r.cost)} readOnly />
                                </td>

                                <td className="scenario-pf-center">
                                    <input className="scenario-pf-input" value={formatNumber(readOnly ? r.exit_value : localExitValue)} readOnly />
                                </td>

                                <td className="scenario-pf-center">
                                    <input className="scenario-pf-input" value={formatNumber(r.dividends_interests)} readOnly />
                                </td>

                                <td className="scenario-pf-center">
                                    <input className="scenario-pf-input" value={formatPercent(r.irr)} readOnly />
                                </td>

                                <td className="scenario-pf-center">
                                    {readOnly
                                        ? <input className="scenario-pf-input" value={r.input_moic || 0} readOnly />
                                        : <input className="scenario-pf-input" value={r.input_moic ?? ""} onChange={(e) => handleLocalInputChange(r.id, 'input_moic', e.target.value)} />
                                    }
                                </td>

                                <td className="scenario-pf-center">
                                    <DateInputWithPicker
                                        initialDate={readOnly
                                            ? (r.exit_date ? new Date(r.exit_date) : new Date())
                                            : (calculatedDate || new Date())
                                        }
                                        onDateChange={() => {}}
                                        disabled={true}
                                        isSingle={true}
                                        dateFormat="DD/MM/YYYY"
                                    />
                                </td>

                                {showActionsColumn && (
                                    <td className="scenario-pf-center">
                                        {canShowButtons && (
                                            <div className="scenario-pf-th-group" style={{ justifyContent: 'center' }}>
                                                {activeMode === 'target' && (
                                                    <button
                                                        className={`scenario-pf-action-btn ${lockedRows.includes(r.id) ? 'locked' : ''}`}
                                                        onClick={(e) => { e.stopPropagation(); onToggleLock(r.id); }}
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
                                        )}
                                    </td>
                                )}
                            </tr>

                            {activeMode === 'sensitivity' && (activeSensitivityRowId === r.id || closingRowId === r.id) && (
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
                        <input className="scenario-pf-input" value={formatPercent(summary.totalIrr*100)} readOnly />
                    </td>
                    <td className="scenario-pf-center">
                        <input className="scenario-pf-input" value={`${summary.totalMoic.toFixed(2)}x`} readOnly />
                    </td>
                    <td className="scenario-pf-center">
                        <input className="scenario-pf-input" value="-" readOnly />
                    </td>
                    {/* Render empty styled cell so the background color spans correctly */}
                    {showActionsColumn && <td className="scenario-pf-center" />}
                </tr>
            </tbody>
        </>
    );
}

export default PortfolioSection;