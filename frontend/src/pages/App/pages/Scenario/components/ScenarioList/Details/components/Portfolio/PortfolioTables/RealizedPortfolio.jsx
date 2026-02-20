import React, { useMemo } from 'react';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../../../components/Sort/TableSort';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';

import './PortfolioTables.css'; 

function RealizedPortfolio({ fundId, scenarioId, realizedData }) {
    const rawData = realizedData || [];
    
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();
    const formatDate = useDateFormatter();

    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(rawData, "name");

    /* ===== CALCULATIONS ===== */

    const summary = useMemo(() => {
        const defaults = {
            avgDuration: 0,
            totalCost: 0,
            totalExitVal: 0,
            totalDividends: 0,
            avgIrr: 0,
            avgMoic: 0
        };

        if (!rawData || rawData.length === 0) return defaults;

        const parseVal = (v) => {
            if (typeof v === 'number') return v;
            return parseFloat(String(v || "").replace(/[^0-9.-]/g, "")) || 0;
        };

        let totals = { dur: 0, cost: 0, exit: 0, div: 0, irr: 0, moic: 0 };

        rawData.forEach(row => {
            totals.dur += parseVal(row.input_duration);
            totals.cost += parseVal(row.display_cost || row.cost);
            totals.exit += parseVal(row.exit_value);
            totals.div += parseVal(row.dividends_interests);
            totals.irr += parseVal(row.irr);
            totals.moic += parseVal(row.input_moic);
        });

        const count = rawData.length;

        return {
            avgDuration: totals.dur / count,
            totalCost: totals.cost,
            totalExitVal: totals.exit,
            totalDividends: totals.div,
            avgIrr: totals.irr / count,
            avgMoic: totals.moic / count
        };
    }, [rawData]);

    return (
        <div className="scenario-pf-section">
            <h3 className="scenario-pf-section-title">
                Realized portfolio 
                <span className="scenario-pf-section-count">{rawData.length}</span>
            </h3>
            
            <div className="scenario-pf-table-container no-borders"> 
                <table className="scenario-pf-table content-fit"> 
                    <thead>
                        <tr>
                            <th>
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
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, index) => (
                            <tr key={row.id} className={index % 2 === 0 ? "scenario-pf-gray" : ""}>
                                <td className="scenario-pf-left">
                                    <div className="scenario-pf-name-block">
                                        <span className="label">{row.name}</span>
                                        <span className="sub">{formatDate(row.first_investment_date)}</span>
                                    </div>
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.input_duration || 0} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={formatNumber(row.display_cost || row.cost)} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={formatNumber(row.exit_value)} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={formatNumber(row.dividends_interests)} readOnly />
                                </td> 
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={formatPercent(row.irr)} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.input_moic || 0} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <div className="scenario-pf-input-readonly-text">
                                        {formatDate(row.exit_date)}
                                    </div>
                                </td>
                            </tr>
                        ))}
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
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RealizedPortfolio;