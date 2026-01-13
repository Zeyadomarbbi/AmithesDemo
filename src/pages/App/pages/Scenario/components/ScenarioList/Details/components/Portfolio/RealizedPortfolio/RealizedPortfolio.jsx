import React from 'react';
import './RealizedPortfolio.css'; 
import { SortIcon } from '../Icons'; 

// New Dummy Data Structure (including Dividends and Exit Date)
const realizedData = [
    { 
        id: 1, 
        name: "Terapia Group", 
        date: "30.06.20", 
        duration: "5 yrs", 
        cost: "6 000 000", 
        exitVal: "12 000 000", 
        dividends: "1 000 000", 
        exitDate: "30.06.25",    
        irr: "12.54%", 
        moic: "2.00x" 
    },
    { 
        id: 2, 
        name: "Alpha Corp", 
        date: "01.01.19", 
        duration: "4 yrs", 
        cost: "10 000 000", 
        exitVal: "25 000 000", 
        dividends: "500 000",
        exitDate: "01.01.2023",
        irr: "25.00%", 
        moic: "2.55x" 
    }
];



function RealizedPortfolio({ realizedData: incomingData }) {
    const data = incomingData || realizedData;
    const avgDuration = (() => {
    if (!realizedData || realizedData.length === 0) return "";

    const nums = realizedData.map(r =>
        parseFloat(String(r.duration).replace(/[^0-9.]/g, ""))
    );

    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg.toFixed(1) + " yrs";
    })();
    const summary = {
        avgDuration: avgDuration,
        totalCost: "16 000 000",
        totalExitVal: "37 000 000",
        totalDividends: "1 500 000",
        avgIrr: "18.77%", 
        avgMoic: "2.33x"
    };

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
        <div className="portfolio-section">
            <h3 className="section-title">
                Realized portfolio 
                <span className="count">{data.length}</span>
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
                            <th>{renderSortableHeader("Exit Date", 'exitDate')}</th> {/* FIX: dataKey added */}
                        </tr>
                    </thead>
                    <tbody>
                        {realizedData.map((row, index) => (
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
                                <td>{row.exitDate}</td>
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