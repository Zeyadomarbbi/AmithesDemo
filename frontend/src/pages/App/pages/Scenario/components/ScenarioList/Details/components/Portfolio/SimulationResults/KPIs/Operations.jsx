import React, { useMemo } from 'react';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../../../../../components/useFormatter';
import './SRTable.css';

const Operations = ({ operations, performance }) => {
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();

    const fmtMoney = (val) => {
        if (val === undefined || val === null || val === 0) return '-';
        return formatNumber(val);
    };

    const tableData = useMemo(() => {
        if (!operations) return [];
        const rows = Object.entries(operations)
            .filter(([key]) => key !== 'Fund')
            .map(([key, data]) => ({ label: key, ...data }));
        
        if (operations['Fund']) {
            rows.push({ label: 'Fund', ...operations['Fund'], isTotal: true });
        }
        return rows;
    }, [operations]);

    return (
    <div className="sr-container">
      
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
  );
};

export default Operations;