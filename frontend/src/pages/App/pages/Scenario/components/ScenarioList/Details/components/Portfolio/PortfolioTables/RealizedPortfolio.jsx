import React, { useMemo } from 'react';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../../../components/Sort/TableSort';
import './PortfolioTables.css'; 

function RealizedPortfolio({ realizedData }) {
    const rawData = realizedData || [];

    // Integrated sorting hook
    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(rawData, "name");

    /* ===== CALCULATIONS ===== */

    const summary = useMemo(() => {
        const defaults = {
            avgDuration: "0 yrs",
            totalCost: "0",
            totalExitVal: "0",
            totalDividends: "0",
            avgIrr: "0.00%",
            avgMoic: "0.00x"
        };

        if (!rawData || rawData.length === 0) return defaults;

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

        rawData.forEach(row => {
            sumDuration += parseVal(row.input_duration);
            sumCost += parseVal(row.display_cost || row.cost);
            sumExitVal += parseVal(row.exit_value);
            sumDividends += parseVal(row.dividends_interests);
            sumIrr += parseVal(row.irr);
            sumMoic += parseVal(row.input_moic);
        });

        const count = rawData.length;

        return {
            avgDuration: (sumDuration / count).toFixed(1) + " yrs",
            totalCost: formatNum(sumCost),
            totalExitVal: formatNum(sumExitVal),
            totalDividends: formatNum(sumDividends),
            avgIrr: (sumIrr / count).toFixed(2) + "%", 
            avgMoic: (sumMoic / count).toFixed(2) + "x" 
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
                                        <span className="sub">{row.first_investment_date || '-'}</span>
                                    </div>
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.input_duration || 0} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.display_cost || row.cost || 0} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.exit_value || 0} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.dividends_interests || 0} readOnly />
                                </td> 
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.irr || "0.00%"} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <input className="scenario-pf-input" value={row.input_moic || 0} readOnly />
                                </td>
                                <td className="scenario-pf-left">
                                    <div className="scenario-pf-input-readonly-text">
                                        {row.exit_date || '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        <tr className="scenario-pf-summary-row"> 
                            <td className="scenario-pf-left">Total</td>
                            <td className="scenario-pf-left">{summary.avgDuration}</td>
                            <td className="scenario-pf-left">{summary.totalCost}</td>
                            <td className="scenario-pf-left">{summary.totalExitVal}</td>
                            <td className="scenario-pf-left">{summary.totalDividends}</td>
                            <td className="scenario-pf-left">{summary.avgIrr}</td>
                            <td className="scenario-pf-left">{summary.avgMoic}</td>
                            <td className="scenario-pf-left">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RealizedPortfolio;