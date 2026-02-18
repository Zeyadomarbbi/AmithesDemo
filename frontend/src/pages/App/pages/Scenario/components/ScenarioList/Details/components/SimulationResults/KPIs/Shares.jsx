import React, { useMemo } from 'react';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../../../../components/useFormatter';
import './SRTable.css';

const Shares = ({ allocations, performance }) => {
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();
    console.log("allocations", allocations)
    console.log("performance", performance)
    // Safe wrapper to handle 0/nulls as '-' 
    const fmtMoney = (val) => {
        if (val === undefined || val === null || val === 0) return '-';
        return formatNumber(val);
    };

    const tableData = useMemo(() => {
        if (!allocations) return [];
        const rows = Object.entries(allocations)
            .filter(([key]) => key !== 'Fund')
            .map(([key, data]) => ({ label: key, ...data }));
        
        if (allocations['Fund']) {
            rows.push({ label: 'Fund', ...allocations['Fund'], isTotal: true });
        }
        return rows;
    }, [allocations]);

    const performanceRows = useMemo(() => {
        if (!performance) return [];
        const rows = Object.entries(performance)
            .filter(([key]) => key !== 'Fund')
            .map(([key, data]) => ({ label: key, ...data }));
        
        if (performance['Fund']) {
            rows.push({ label: 'Fund', ...performance['Fund'], isTotal: true });
        }
        return rows;
    }, [performance]);

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
              <th className="th-val">Total <span>(€)</span></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} className={row.isTotal ? 'row-fund' : ''}>
                <td className="td-label">{row.label}</td>
                <td className="td-val">{fmtMoney(row['Nominal Repayment'])}</td>
                <td className="td-val">{fmtMoney(row['Hurdle'])}</td>
                <td className="td-val">{fmtMoney(row['Catch-up'])}</td>
                <td className="td-val">{fmtMoney(row['Special Return'])}</td>
                <td className="td-val">{fmtMoney(row['Total'])}</td>
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
            {performanceRows.map((row, index) => (
            <tr key={index} className={row.isTotal ? 'row-fund' : ''}>
                <td className="td-label">{row.label}</td>
                <td className="td-val">
                    {row.TVPI ? `${formatNumber(row.TVPI)}x` : '-'}
                </td>
                <td className="td-val">
                    {row.IRR ? formatPercent(row.IRR*100) : '-'}
                </td>
            </tr>
            ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default Shares;