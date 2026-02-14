import React, { useState, useEffect } from 'react';
import { useScenarioDDFees } from '../../../../../../../../hooks/Scenarios/useScenarioDDFees'; 
import { CloseIcon } from '../Icons'; 
import Toast from '../../../../../../../../components/Toast/Toast'; 
import './DDFees.css';

const DDFees = ({ fundId, scenarioId, onClose }) => {
  const { ddFees, annualTotals, updateFeeRate, loading } = useScenarioDDFees(fundId, scenarioId);
  const [localRows, setLocalRows] = useState([]);
  const [scenarioDDFeesIsSaving, setScenarioDDFeesIsSaving] = useState(false);
  const [scenarioDDFeesToast, setScenarioDDFeesToast] = useState(null);

  useEffect(() => {
    if (ddFees && ddFees.length > 0) {
      setLocalRows(ddFees);
    }
  }, [ddFees]);

  const handleLocalChange = (e, id, field) => {
    const newVal = e.target.value;
    setLocalRows(prev => prev.map(r => 
      r.dd_fee_id === id ? { ...r, [field]: newVal } : r
    ));
  };

  const handleSave = async () => {
    setScenarioDDFeesIsSaving(true);
    try {
      const updatePromises = localRows.map(row => {
        const original = ddFees.find(d => d.dd_fee_id === row.dd_fee_id);
        if (original.entry_fee_pct !== row.entry_fee_pct || original.exit_fee_pct !== row.exit_fee_pct) {
           return updateFeeRate(row.dd_fee_id, {
             entry_fee_pct: row.entry_fee_pct,
             exit_fee_pct: row.exit_fee_pct
           });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(updatePromises);

      setScenarioDDFeesToast({
        type: 'success',
        title: 'Success',
        message: 'Fees updated successfully.'
      });
      
      setTimeout(onClose, 1500);
    } catch (error) {
      setScenarioDDFeesToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update fees.'
      });
    } finally {
      setScenarioDDFeesIsSaving(false);
    }
  };

  const getYear = (dateStr) => {
    if (!dateStr) return '...';
    return dateStr.split('-')[0];
  };

  const formatMoney = (amount) => {
    if (!amount) return '-';
    return parseFloat(amount).toLocaleString('en-US', {
        useGrouping: true, 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/,/g, ' '); 
  };

    return (
    <div className="scenario-dd-fees-container">
      <div className="scenario-dd-fees-header-wrapper">
        <button className="scenario-dd-fees-close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="scenario-dd-fees-title">
          Due diligences fees
        </div>
      </div>

      <div className="scenario-dd-fees-table-wrapper">
        {loading && localRows.length === 0 ? (
            <div className="scenario-dd-fees-no-data">Loading...</div>
        ) : localRows.length === 0 ? (
            <div className="scenario-dd-fees-no-data-box">No Portfolios Found</div>
        ) : (
            <table className="scenario-dd-fees-table">
            <thead>
                <tr>
                <th className="scenario-dd-fees-th-inv"></th>
                <th className="scenario-dd-fees-th-center">Entry (% Cost)</th>
                <th className="scenario-dd-fees-th-center">Exit (% Cost)</th>
                <th className="scenario-dd-fees-th-right">Entry</th>
                <th className="scenario-dd-fees-th-right">Exit</th>
                </tr>
            </thead>
            <tbody>
                {localRows.map((row) => (
                <tr key={row.dd_fee_id}>
                    <td className="scenario-dd-fees-td-name">
                    <div className="scenario-dd-fees-inv-name-group">
                        <span className="scenario-dd-fees-inv-title">{row.investment_name}</span>
                        <span className="scenario-dd-fees-inv-period">
                            {getYear(row.entry_date)} - {row.exit_date ? getYear(row.exit_date) : 'N/A'}
                        </span>
                    </div>
                    </td>

                    <td className="scenario-dd-fees-td-center">
                    {row.is_entry_sunk ? (
                        <span className="scenario-dd-fees-status-text-sunk">In portfolio</span>
                    ) : (
                        <input 
                            className="scenario-dd-fees-input" 
                            type="number"
                            value={row.entry_fee_pct} 
                            onChange={(e) => handleLocalChange(e, row.dd_fee_id, 'entry_fee_pct')}
                        />
                    )}
                    </td>

                    <td className="scenario-dd-fees-td-center">
                    {row.is_exit_sunk ? (
                        <span className="scenario-dd-fees-status-text-sunk">Exited</span>
                    ) : (
                        <input 
                            className="scenario-dd-fees-input" 
                            type="number"
                            step="0.01"
                            value={row.exit_fee_pct}
                            onChange={(e) => handleLocalChange(e, row.dd_fee_id, 'exit_fee_pct')}
                        />
                    )}
                    </td>

                    <td className="scenario-dd-fees-td-center">
                        {row.is_entry_sunk ? (
                            <span className="scenario-dd-fees-status-text-sunk-small">In portfolio</span>
                        ) : (
                            <span className="scenario-dd-fees-val-text">{formatMoney(row.entry_amount)}</span>
                        )}
                    </td>

                    <td className="scenario-dd-fees-td-center">
                        {row.is_exit_sunk ? (
                            <span className="scenario-dd-fees-status-text-sunk-small">Exited</span>
                        ) : (
                            <span className="scenario-dd-fees-val-text">{formatMoney(row.exit_amount)}</span>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>

      <div className="scenario-dd-fees-footer">
        <div className="scenario-dd-fees-actions">
          <button 
            className="scenario-dd-fees-btn-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="scenario-dd-fees-btn-save" 
            onClick={handleSave}
            disabled={scenarioDDFeesIsSaving}
          >
            {scenarioDDFeesIsSaving ? "Saving..." : "Save"}
          </button>
          {scenarioDDFeesToast && (
            <Toast
              type={scenarioDDFeesToast.type}
              title={scenarioDDFeesToast.title}
              message={scenarioDDFeesToast.message}
              onClose={() => setScenarioDDFeesToast(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DDFees;