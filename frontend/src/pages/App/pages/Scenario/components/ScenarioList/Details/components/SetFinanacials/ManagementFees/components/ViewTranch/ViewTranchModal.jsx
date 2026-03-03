import React, { useEffect, useState } from 'react';
import { useManFeeTranches } from '../../utils/useScenarioManFeeTranches';
import { CloseIcon } from '../../../Icons'; 
import DateInputWithPicker from '../../../../../../../../../../../../components/DateComponents/DateInput';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../../../../../components/Sort/TableSort';
import Prompt from '../../../../../../../../../../components/Toast/Prompt';

import './ViewTranchModal.css';
import { PermissionGate } from '../../../../../../../../../../../../hooks/Auth/PermissionGate';

const ViewTranchesModal = ({ isOpen, onClose, fundId, scenarioId }) => {
    const { tranches: rawData, loading, deleteTranche, refresh } = useManFeeTranches(fundId, scenarioId);
    const [deletePrompt, setDeletePrompt] = useState(null);

    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(rawData || [], "tranche_name");

    // Fetch latest data whenever modal opens
    useEffect(() => {
        if (isOpen && refresh) {
            refresh();
        }
    }, [isOpen, refresh]);

    if (!isOpen) return null;

    const openDeletePrompt = (row) => {
        setDeletePrompt({
            id: row.tranche_id,
            name: row.tranche_name
        });
    };

    const handleConfirmDelete = async () => {
        if (deletePrompt) {
            await deleteTranche(deletePrompt.id);
            setDeletePrompt(null);
            if (refresh) refresh();
        }
    };

    return (
        <div className="man-fee-tranches-modal-overlay">
            <div className="man-fee-tranches-modal-content-wide">
                <button className="man-fee-tranches-modal-close-icon" onClick={onClose}>
                    <CloseIcon />
                </button>

                <div className="scenario-pf-section">
                    <h3 className="scenario-pf-section-title">
                        Active Tranches
                        <span className="scenario-pf-section-count">{rawData?.length || 0}</span>
                    </h3>

                    <div className="scenario-pf-table-container no-borders">
                        {loading ? (
                            <div className="man-fee-tranches-loading-state">Loading tranches...</div>
                        ) : (
                            <table className="scenario-pf-table content-fit">
                                <thead>
                                    <tr>
                                        <th>
                                            <SortableHeaderRenderer 
                                                label="Name" columnKey="tranche_name"
                                                currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                                center={false}
                                            />
                                        </th>
                                        <th>
                                            <SortableHeaderRenderer 
                                                label="Amount" columnKey="amount"
                                                currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                                center={true} showCurrency={true}
                                            />
                                        </th>
                                        <th>
                                            <SortableHeaderRenderer 
                                                label="Class" columnKey="share_class_name"
                                                currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                                center={true} showCurrency={false}
                                            />
                                        </th>
                                        <th style={{ width: '140px' }}>
                                            <SortableHeaderRenderer 
                                                label="Date" columnKey="start_date"
                                                currentSortKey={sortKey} currentSortDir={sortDir} toggleSort={toggleSort}
                                                center={true} showCurrency={false}
                                            />
                                        </th>
                                        <PermissionGate>
                                        <th style={{ width: '80px' }}>Actions</th>
                                        </PermissionGate>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRows.length > 0 ? (
                                        sortedRows.map((row, index) => (
                                            <tr key={row.tranche_id} className={index % 2 === 0 ? "scenario-pf-gray" : ""}>
                                                <td className="scenario-pf-left">
                                                    <div className="scenario-pf-name-block">
                                                        <span className="label">{row.tranche_name}</span>
                                                        <span className="sub">ID: {row.tranche_id}</span>
                                                    </div>
                                                </td>
                                                <td className="scenario-pf-left">
                                                    <input 
                                                        className="man-fee-scenario-pf-input" 
                                                        value={parseFloat(row.amount).toLocaleString('en-US').replace(/,/g, ' ')} 
                                                        readOnly 
                                                    />
                                                </td>
                                                <td className="scenario-pf-left">
                                                    <input className="man-fee-scenario-pf-input" value={row.share_class_name} readOnly />
                                                </td>
                                                <td className="scenario-pf-left">
                                                    <DateInputWithPicker 
                                                        initialDate={new Date(row.start_date)}
                                                        disabled={true}
                                                        dateFormat="DD/MM/YYYY"
                                                    />
                                                </td>
                                                <PermissionGate>
                                                <td className="scenario-pf-center">
                                                    <button 
                                                        className="man-fee-tranches-text-btn-red" 
                                                        onClick={() => openDeletePrompt(row)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                                </PermissionGate>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="man-fee-tranches-cell-empty">
                                                No active tranches found for this scenario.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {deletePrompt && (
                <Prompt 
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete "${deletePrompt.name}"? This action cannot be undone.`}
                    onCancel={() => setDeletePrompt(null)}
                    onConfirm={handleConfirmDelete}
                    type="error"
                    confirmLabel="Delete"
                />
            )}
        </div>
    );
};

export default ViewTranchesModal;