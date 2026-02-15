// CapitalCalls.js
import React, { useMemo, useState, useEffect } from 'react';
import './CapitalCalls.css'; 
import { SortIcon, PlusIcon, MinusIcon } from '../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput';
import Toast from '../../../../../../../../components/Toast/Toast'; 
import { useNumberFormatter } from '../../../../../../../../../../components/useFormatter';

const CapitalCalls = ({ 
  fundId,
  scenarioId,
  data = [], 
  loading = false, 
  error = null, 
  onCreateDate, 
  onDeleteEntry,
  onSave
}) => {
  const formatNumber = useNumberFormatter();
  
  const [isSaving, setIsSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState({});
  const [pendingActions, setPendingActions] = useState([]);
  const [optimisticData, setOptimisticData] = useState([]);
  const [toast, setToast] = useState(null);

  // Update optimistic data when real data changes
  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };

  const formatDateForAPI = (dateObj) => {
    if (!dateObj) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const groupedRows = useMemo(() => {
    const groups = {};
    const sortedData = [...optimisticData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedData.forEach(row => {
      const year = row.year || new Date(row.date).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(row);
    });
    return groups;
  }, [optimisticData]);

  const handleAddClick = (year) => {
    // Create temporary ID for optimistic UI
    const tempId = `temp_${Date.now()}`;
    
    // Add optimistic entry immediately
    const newEntry = {
      summary_id: tempId,
      fund_id: fundId,
      scenario_id: scenarioId,
      date: `${year}-12-31`,
      year: parseInt(year),
      flows: 0,
      investment: 0,
      management_fees: 0,
      structuring_fees: 0,
      dd_fees: 0,
      opex: 0,
      other_expenses: 0,
      pct_capital_called: 0,
      source_type: 'projected_custom',
      is_user_inserted: true,
      updated_at: new Date().toISOString()
    };

    setOptimisticData(prev => [...prev, newEntry]);

    // Queue the add action
    setPendingActions(prev => [...prev, { 
      type: 'add', 
      year, 
      tempId,
      payload: {
        fund: fundId,
        scenario: scenarioId,
        date: `${year}-12-31`,
        year: parseInt(year)
      }
    }]);
  };

  const handleRemoveClick = (year) => {
    const yearRows = groupedRows[year] || [];
    
    // Find all custom editable entries in this year
    const customEntries = yearRows.filter(row => 
      row.source_type === 'projected_custom' && row.is_user_inserted
    );
    
    // Must have at least one custom entry to delete
    if (customEntries.length === 0) return;
    
    const lastCustomEntry = [...customEntries].pop();
    
    if (lastCustomEntry) {
      // Remove optimistically from UI
      setOptimisticData(prev => prev.filter(row => row.summary_id !== lastCustomEntry.summary_id));

      // If it's a temp entry, just remove from pending actions
      if (String(lastCustomEntry.summary_id).startsWith('temp_')) {
        setPendingActions(prev => prev.filter(action => action.tempId !== lastCustomEntry.summary_id));
        // Also remove from local changes if it was edited
        setLocalChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[lastCustomEntry.summary_id];
          return newChanges;
        });
      } else {
        // Real entry - queue for deletion (will be executed on Save)
        setPendingActions(prev => [...prev, { 
          type: 'remove', 
          year,
          summaryId: lastCustomEntry.summary_id 
        }]);
        // Also remove from local changes if it was edited
        setLocalChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[lastCustomEntry.summary_id];
          return newChanges;
        });
      }
    }
  };

  const handleDateChange = (row, newDate) => {
    if (!row.is_user_inserted || row.source_type !== 'projected_custom') {
      return;
    }
    
    const formattedDate = formatDateForAPI(newDate);
    
    // Update optimistic data
    setOptimisticData(prev => prev.map(r => 
      r.summary_id === row.summary_id ? { ...r, date: formattedDate } : r
    ));

    setLocalChanges(prev => ({
      ...prev,
      [row.summary_id]: { ...row, date: formattedDate }
    }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    
    try {
      // Execute all pending remove actions first
      const removeActions = pendingActions.filter(a => a.type === 'remove');
      for (const action of removeActions) {
        await onDeleteEntry(action.summaryId);
      }

      // Execute all pending add actions
      const addActions = pendingActions.filter(a => a.type === 'add');
      for (const action of addActions) {
        await onCreateDate(action.payload);
      }

      // Execute date changes (only for real entries, not temp ones)
      const realChanges = Object.entries(localChanges).filter(
        ([id]) => !id.startsWith('temp_')
      );
      
      for (const [id, updateData] of realChanges) {
        await onSave({ [id]: updateData });
      }

      // Clear pending actions and changes
      setPendingActions([]);
      setLocalChanges({});

      // Show success toast
      const totalChanges = removeActions.length + addActions.length + realChanges.length;
      if (totalChanges > 0) {
        setToast({
          type: 'success',
          title: 'Changes saved',
          message: `${totalChanges} change${totalChanges > 1 ? 's' : ''} saved successfully`
        });
      }

    } catch (err) {
      console.error('Save failed:', err);
      // Revert optimistic updates on error
      setOptimisticData(data);
      setPendingActions([]);
      setLocalChanges({});
      setToast({
        type: 'error',
        title: 'Save failed',
        message: 'Unable to save changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = pendingActions.length > 0 || Object.keys(localChanges).length > 0;
  const totalPendingChanges = pendingActions.length + Object.keys(localChanges).length;

  if (loading) {
    return (
      <div className="ff-capital-calls-container">
        <div className="ff-capital-calls-loading" style={{ padding: '40px', textAlign: 'center' }}>
          Loading capital calls...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ff-capital-calls-container">
        <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="ff-capital-calls-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          No capital calls found
        </div>
      </div>
    );
  }

  return (
    <div className="ff-capital-calls-container"> 
      <div className="ff-capital-calls-responsive-wrapper">   
        <table className="ff-capital-calls-table">
          <thead>
            <tr>
              <th className="ff-capital-calls-th ff-capital-calls-sidebar-header"></th> 
              <th className="ff-capital-calls-th ff-capital-calls-th-left">
                <div className="ff-capital-calls-th-content">Date <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Flows (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Investment (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Management Fees (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Structuring Fees (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Due diligence (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Opex (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">Other (€) <SortIcon /></div>
              </th>
              <th className="ff-capital-calls-th ff-capital-calls-th-right">
                <div className="ff-capital-calls-th-content ff-capital-calls-th-right-align">% Capital Called <SortIcon /></div>
              </th>
            </tr>
          </thead>
          
          {Object.keys(groupedRows).map(year => {
              const rows = groupedRows[year];
              return (
                <tbody key={`ff-group-${year}`} className="ff-capital-calls-tbody">
                    {rows.map((row, index) => {
                      const isEditable = row.is_user_inserted && row.source_type === 'projected_custom';
                      const displayDate = localChanges[row.summary_id]?.date || row.date;

                      return (
                        <tr key={row.summary_id} className="ff-capital-calls-tr">
                            {index === 0 && (
                                <td rowSpan={rows.length} className="ff-capital-calls-td-sidebar">
                                    <div className="ff-capital-calls-sidebar-content">
                                        <span className="ff-capital-calls-year-label">{year}</span>
                                        <div className="ff-capital-calls-control-box">
                                            <button 
                                              className="ff-capital-calls-ctrl-btn" 
                                              onClick={() => handleAddClick(year)}
                                              title="Add new date"
                                            >
                                              <PlusIcon />
                                            </button>
                                            <span className="ff-capital-calls-row-count">{rows.length}</span>
                                            <button 
                                              className="ff-capital-calls-ctrl-btn" 
                                              onClick={() => handleRemoveClick(year)}
                                              title="Delete last custom date"
                                            >
                                              <MinusIcon />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            )}
                            <td className="ff-capital-calls-td ff-capital-calls-td-date">
                              <DateInputWithPicker
                                initialDate={parseDateString(isEditable ? displayDate : row.date)}
                                onDateChange={(date) => handleDateChange(row, date)}
                                isSingle={true}
                                disabled={!isEditable}
                              />
                            </td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.flows)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.investment)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.management_fees)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.structuring_fees)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.dd_fees)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.opex)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.other_expenses)}</td>
                            <td className="ff-capital-calls-td ff-capital-calls-td-right">{formatNumber(row.pct_capital_called)}%</td>
                        </tr>
                      );
                    })}
                    <tr className="ff-capital-calls-spacer-row"><td colSpan="11"></td></tr>
                </tbody>
              );
          })}
        </table>
      </div>

      <div className="ff-capital-calls-footer">
        <div className="ff-capital-calls-actions">
          <button 
            className="ff-capital-calls-btn-save" 
            onClick={handleSaveClick}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? "Saving..." : hasUnsavedChanges ? `Save (${totalPendingChanges})` : "Save"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
};

export default CapitalCalls;