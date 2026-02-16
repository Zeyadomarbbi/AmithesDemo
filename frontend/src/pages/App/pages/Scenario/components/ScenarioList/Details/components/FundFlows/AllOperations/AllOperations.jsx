import React, { useEffect } from 'react';
import './AllOperations.css';
import { SortIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import { useScenarioFFAllOperations } from './useScenarioFFAllOperations'; 
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../../../../components/useFormatter';

const AllOperations = ({ fundId, scenarioId, refreshTrigger }) => {
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();

  const { 
    allOperations, 
    loading, 
    error, 
    refresh 
  } = useScenarioFFAllOperations(fundId, scenarioId);

  useEffect(() => {
    if (refreshTrigger > 0 && refresh) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    // Handle YYYY-MM-DD (standard API format)
    return new Date(dateStr);
  };

  if (loading) return <div>Loading...</div>; // simplified for brevity
  if (error) return <div>Error: {error}</div>;
  if (!allOperations || allOperations.length === 0) return <div>No operations found</div>;

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">    
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left"><div className="th-content">Date <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Capital Called <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Distributed <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">DPI <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          <tbody>
            {allOperations.map((row) => (
              <tr key={row.all_operations_id} className={row.flow_type === 'distribution' ? 'row-highlight' : ''}>
                <td className="td-date">
                  <DateInputWithPicker 
                    initialDate={parseDateString(row.date)}
                    isSingle={true}
                    disabled={true} 
                  />
                </td>
                
                {/* Fixed: row.flows (was row.flow) */}
                <td className="td-right">{formatNumber(row.flows)}</td>
                
                {/* Fixed: row.pct_capital_called (was row.capCalled) */}
                <td className="td-right">
                  {formatPercentage(row.pct_capital_called)}
                </td>
                
                {/* Fixed: row.pct_distributed (was row.distPercent) */}
                <td className="td-right">
                   {formatPercentage(row.pct_distributed)}
                </td>
                
                {/* Fixed: row.dpi with specific 'x' formatting */}
                <td className="td-right">
                  {row.dpi ? `${parseFloat(row.dpi).toFixed(2)}x` : '0.00x'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllOperations;