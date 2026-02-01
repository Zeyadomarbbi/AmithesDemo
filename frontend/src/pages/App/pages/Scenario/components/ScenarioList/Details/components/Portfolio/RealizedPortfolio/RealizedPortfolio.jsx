import React, { useMemo } from 'react';
import './RealizedPortfolio.css'; 
import { SortIcon } from '../Icons'; 

function RealizedPortfolio({ realizedData }) {
    // 1. Strict Input: Use passed data or empty array. No internal mock data.
    const data = realizedData || [];

    // 2. Dynamic Summary Calculation
    const summary = useMemo(() => {
        // Default empty state
        const defaults = {
            avgDuration: "0 yrs",
            totalCost: "0",
            totalExitVal: "0",
            totalDividends: "0",
            avgIrr: "0.00%",
            avgMoic: "0.00x"
        };

        if (!data || data.length === 0) return defaults;

        // Helper: Clean string and parse to float (e.g. "10 000" -> 10000, "12.5%" -> 12.5)
        const parseVal = (str) => {
            if (!str) return 0;
            return parseFloat(String(str).replace(/[^0-9.-]/g, "")) || 0;
        };

        // Helper: Format number with spaces (e.g. 16000000 -> "16 000 000")
        const formatNum = (num) => {
            return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        };

        let sumDuration = 0;
        let sumCost = 0;
        let sumExitVal = 0;
        let sumDividends = 0;
        let sumIrr = 0;
        let sumMoic = 0;

        // Loop through data to calculate totals
        data.forEach(row => {
            sumDuration += parseVal(row.duration);
            sumCost += parseVal(row.cost);
            sumExitVal += parseVal(row.exitVal);
            sumDividends += parseVal(row.dividends);
            sumIrr += parseVal(row.irr);
            sumMoic += parseVal(row.moic);
        });

        const count = data.length;

        return {
            avgDuration: (sumDuration / count).toFixed(1) + " yrs",
            totalCost: formatNum(sumCost),
            totalExitVal: formatNum(sumExitVal),
            totalDividends: formatNum(sumDividends),
            avgIrr: (sumIrr / count).toFixed(2) + "%", // Simple Average
            avgMoic: (sumMoic / count).toFixed(2) + "x" // Simple Average
        };
    }, [data]);

    const renderSortableHeader = (text, dataKey, isSorted = false, isRightAligned = false, showCurrency = false) => {
        const wrapperClass = `realized-th-wrapper ${isRightAligned ? 'realized-align-right' : 'realized-align-left'}`;
        
        return (
            <div className={wrapperClass}>
                <div className="realized-th-group">
                    {text}
                    {showCurrency && <span className="realized-currency-indicator">(€)</span>}
                    <SortIcon className={`realized-sort-icon ${isSorted ? 'active' : ''}`} />
                </div>
            </div>
        );
    };

    return (
        <div className="portfolio-scenario-section">
            <h3 className="pf-section-title">
                Realized portfolio 
                <span className="pf-section-count">{data.length}</span>
            </h3>
            
            <div className="realized-table-container no-borders"> 
                <table className="realized-table content-fit"> 
                    <thead>
                        <tr>
                            <th className="realized-col-dealname">{renderSortableHeader("Deal Name", 'name', true)}</th>
                            <th>{renderSortableHeader("Duration", 'duration')}</th> 
                            <th className="realized-col-numeric">{renderSortableHeader("Cost", 'cost', false, true, true)}</th>
                            <th className="realized-col-numeric">{renderSortableHeader("Exit Value", 'exitVal', false, true, true)}</th>
                            <th className="realized-col-numeric">{renderSortableHeader("Dividends/Interests", 'dividends', false, true, true)}</th>
                            <th className="realized-col-numeric">{renderSortableHeader("IRR", 'irr', false, true)}</th>
                            <th className="realized-col-numeric">{renderSortableHeader("MOIC (incl. dividends)", 'moic', false, true)}</th>
                            {/* FIXED: Added 'true' for Right Alignment */}
                            <th>{renderSortableHeader("Exit Date", 'exitDate', false, true)}</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr 
                                key={row.id} 
                                className={index % 2 === 0 ? 'realized-row-banded-gray' : ''} 
                            >
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 500 }}>{row.name}</span>
                                        <span style={{ fontSize: '12px', color: '#375A89' }}>{row.date}</span>
                                    </div>
                                </td>
                                <td>{row.duration}</td>
                                <td className="realized-cell-right">{row.cost}</td>
                                <td className="realized-cell-right">{row.exitVal}</td>
                                <td className="realized-cell-right">{row.dividends}</td> 
                                <td className="realized-cell-right">{row.irr}</td>
                                <td className="realized-cell-right">{row.moic}</td>
                                <td className="realized-cell-right">{row.exitDate || '-'}</td>
                            </tr>
                        ))}
                        <tr className="realized-row-summary"> 
                            <td>Total</td>
                            <td>{summary.avgDuration}</td>
                            <td className="realized-cell-right">{summary.totalCost}</td>
                            <td className="realized-cell-right">{summary.totalExitVal}</td>
                            <td className="realized-cell-right">{summary.totalDividends}</td>
                            <td className="realized-cell-right">{summary.avgIrr}</td>
                            <td className="realized-cell-right">{summary.avgMoic}</td>
                            <td className="realized-cell-right">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RealizedPortfolio;