import React from 'react';
import './Operations.css';

const operationsData = [
  { label: 'Invest #1', nominal: '30 000 000', hurdle: '7 575 758', catchup: '-', special: '12 000 000' },
  { label: 'Invest #2', nominal: '40 000 000', hurdle: '10 101 010', catchup: '-', special: '16 000 000' },
  { label: 'Invest #3', nominal: '29 000 000', hurdle: '7 323 232', catchup: '-', special: '11 600 000' },
  { label: 'Invest #4', nominal: '29 000 000', hurdle: '7 323 232', catchup: '-', special: '11 600 000' },
  { label: 'Invest #5', nominal: '29 000 000', hurdle: '7 323 232', catchup: '-', special: '11 600 000' },
  { label: 'Invest #6', nominal: '-', hurdle: '7 323 232', catchup: '-', special: '11 600 000' },
  { label: 'Shares B', nominal: '-', hurdle: '-', catchup: '6 250 000', special: '10 400 000' },
  { label: 'Fund', nominal: '100 000 000', hurdle: '25 000 000', catchup: '6 250 000', special: '50 000 000', isTotal: true },
];

const investmentPerformanceData = [
  { label: 'Shares A1', tvpi: '1.45x', irr: '9.08%' },
  { label: 'Shares A2', tvpi: '1.45x', irr: '9.08%' },
  { label: 'Shares A3', tvpi: '1.43x', irr: '8.75%' },
  { label: 'Shares B1', tvpi: '1.88x', irr: '31.65%' },
  { label: 'Shares B2', tvpi: '1.88x', irr: '31.65%' },
  { label: 'Shares B3', tvpi: '1.88x', irr: '31.65%' },
  { label: 'Fund', tvpi: '1.49x', irr: '10.21%', isTotal: true },
];

const Operations = () => {
  return (
    <div className="operations-container">
      
      {/* === TABLE 1: WATERFALL / NOMINAL === */}
      <div className="operations-table-wrapper">
        <table className="operations-table">
          <thead>
            <tr>
              <th className="th-label"></th> 
              <th className="th-val">Nominal <span>(€)</span></th>
              <th className="th-val">Hurdle <span>(€)</span></th>
              <th className="th-val">Catch-up <span>(€)</span></th>
              <th className="th-val">Special Return <span>(€)</span></th>
            </tr>
          </thead>
          <tbody>
            {operationsData.map((row, index) => (
              <tr key={index} className={row.isTotal ? 'row-fund' : ''}>
                <td className="td-label">{row.label}</td>
                <td className="td-val" title={row.nominal}>{row.nominal}</td>
                <td className="td-val" title={row.hurdle}>{row.hurdle}</td>
                <td className="td-val" title={row.catchup}>{row.catchup}</td>
                <td className="td-val" title={row.special}>{row.special}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === TABLE 2: PERFORMANCE === */}
      <div className="operations-table-wrapper mt-large">
        <table className="operations-table performance-table">
        <thead>
            <tr>
            <th className="th-label"></th>
            <th className="th-val">TVPI</th>
            <th className="th-val">IRR</th>
            </tr>
        </thead>
        <tbody>
            {investmentPerformanceData.map((row, index) => (
            <tr key={index} className={row.isTotal ? 'row-fund' : ''}>
                <td className="td-label">{row.label}</td>
                <td className="td-val" title={row.tvpi}>{row.tvpi}</td>
                <td className="td-val" title={row.irr}>{row.irr}</td>
            </tr>
            ))}
        </tbody>
        </table>
      </div>

      {/* === KPI CARDS === */}
      <div className="operations-kpi-row">
        <div className="kpi-card">
          <span className="kpi-title">Break-even Hurdle</span>
          <span className="kpi-number">1.76x</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Break-even DPI 1.00x</span>
          <span className="kpi-number">1.23x</span>
        </div>
      </div>

    </div>
  );
};

export default Operations;