import React, { useEffect } from 'react';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';
import { useScenarioFFDistribution } from '../../../../../../../../hooks/Scenarios/useScenarioFFDistribution'; // Ensure path is correct
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import { SortIcon } from '/src/components/Icons/InteractiveIcons'; 
import './Distributions.css';

const Distributions = ({ fundId, scenarioId, refreshTrigger }) => {
  // 1. Move Data Logic Here
  const { 
    distributions, 
    loading, 
    error,
    refresh 
  } = useScenarioFFDistribution(fundId, scenarioId);

  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };

  // 2. Listen for Parent Refresh Signal
  useEffect(() => {
    if (refreshTrigger > 0 && refresh) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  const calculateDividendsAndInterests = (row) => {
    const dividends = parseFloat(row.dividends || 0);
    const interests = parseFloat(row.interests || 0);
    return dividends + interests;
  };

  if (loading) {
    return (
      <div className="all-ops-container">
        <div className="table-responsive-wrapper">
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading distributions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-ops-container">
        <div className="table-responsive-wrapper">
          <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!distributions || distributions.length === 0) {
    return (
      <div className="all-ops-container">
        <div className="table-responsive-wrapper">
          <div style={{ padding: '40px', textAlign: 'center' }}>No distributions found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-ops-container"> 
      <div className="table-responsive-wrapper">    
        <table className="ops-table">
          <thead>
            <tr>
              <th className="th-left"><div className="th-content">Date <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Flows <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Divestment <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Dividends & Interests <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">Other <span className="header-hint">(€)</span> <SortIcon className="sort-icon" /></div></th>
              <th className="th-right"><div className="th-content right">% Distributed <SortIcon className="sort-icon" /></div></th>
            </tr>
          </thead>
          <tbody>
            {distributions.map((row) => (
              <tr key={row.summary_id}>
                <td className="td-date">                              
                  <DateInputWithPicker
                    initialDate={parseDateString(row.date)}
                    onDateChange={(date) => handleDateChange(row, date)}
                    isSingle={true}
                    disabled={true}
                  />
                </td>
                <td className="td-right">{formatNumber(row.flows)}</td>
                <td className="td-right">{formatNumber(row.divestment)}</td>
                <td className="td-right">{formatNumber(calculateDividendsAndInterests(row))}</td>
                <td className="td-right">{formatNumber(row.other)}</td>
                <td className="td-right">{formatPercentage(row.pct_distributed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Distributions;