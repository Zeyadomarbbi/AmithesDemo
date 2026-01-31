import React from 'react';
import './SRTable.css';

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
    <div className="sr-container">
      
      {/* === TABLE 1: WATERFALL / NOMINAL === */}
      <div className="sr-table-wrapper">
        <table className="sr-table">
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
      <div className="sr-table-wrapper mt-large">
        <table className="sr-table performance-table">
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
    </div>
  );
};

export default Operations;