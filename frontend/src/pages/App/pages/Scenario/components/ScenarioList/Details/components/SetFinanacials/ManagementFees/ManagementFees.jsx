import React, { useState, useMemo } from 'react';
import { useMasterManFees } from '../../../../../../../../hooks/Scenarios/useScenarioMasterManFee';
import { PlusIcon, CloseIcon } from '/src/components/Icons/InteractiveIcons';
import AddTranchModal from './components/NewTranch/AddTrancheModal.jsx';
import ViewTranchModal from './components/ViewTranch/ViewTranchModal.jsx';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '../../../../../../../../../../components/useFormatter';
import { PermissionGate } from '../../../../../../../../../../hooks/Auth/PermissionGate.jsx';
import './ManagementFees.css';

const ManagementFees = ({ fundId, scenarioId, onClose }) => {
    // 1. Hook Integration (No more hardcoded 2024/15)
    const formatNumber = useNumberFormatter();
    const { pivotedData, columns, loading, refresh } = useMasterManFees(fundId, scenarioId);
    // ------------------
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // 2. Data Processing (Transpose Logic remains the same)
    const { years, commitmentRows, costRows, dataByYear } = useMemo(() => {
        if (!pivotedData.length) return { years: [], commitmentRows: [], costRows: [], dataByYear: {} };

        const yearsList = pivotedData.map(d => d.year);
        
        const yearMap = {};
        pivotedData.forEach(row => { yearMap[row.year] = row; });

        const commCols = columns.filter(c => c.type === 'Share Class' || c.type === 'Tranche');
        const portCols = columns.filter(c => c.type === 'Portfolio');

        return {
            years: yearsList,
            commitmentRows: commCols,
            costRows: portCols,
            dataByYear: yearMap
        };
    }, [pivotedData, columns]);

    // Helper: Calculate Totals
    const getColumnTotal = (year, rowDefinitions) => {
        if (!dataByYear[year]) return 0;
        return rowDefinitions.reduce((sum, colDef) => {
            const val = dataByYear[year][colDef.key] || 0;
            return sum + val;
        }, 0);
    };

    const handleModalClose = () => {
        setIsAddModalOpen(false);
        setIsViewModalOpen(false);
        refresh(); 
    };

    if (loading && years.length === 0) {
        return <div className="mf-table-container"><div className="p-10 text-center">Loading Financials...</div></div>;
    }

    return (
        <div className="mf-table-container">
            <button className="mf-close-action" onClick={onClose}>
                <CloseIcon />
            </button>

            <div className="mf-action-header">
                <button className="mf-btn-base mf-btn-view" onClick={() => setIsViewModalOpen(true)}>
                    View tranches
                </button>
                <PermissionGate>
                <button className="mf-btn-base mf-btn-add" onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon />
                    Add tranche
                </button>
                </PermissionGate>
            </div>

            <table className="mf-table">
                <thead>
                    <tr>
                        <th className="th-label col-mf">
                            <div className="th-wrapper mf-wrapper">
                                <span>Management fees</span>
                            </div>
                        </th>
                        {years.map((year) => (
                            <th key={year} className="col-year">
                                <div className="th-wrapper year-wrapper">
                                    <span className="year-label">{year}</span>
                                    <span className="currency-indicator">(€)</span>
                                </div>
                            </th>
                        ))}
                        <th className="col-total"></th>
                    </tr>
                </thead>
                
                {/* SECTION 1: COMMITMENT BASIS */}
                <tbody>
                    {commitmentRows.map((colDef) => (
                        <tr key={colDef.key} className="row-standard">
                            <td className="cell-label">{colDef.label}</td>
                            {years.map((year) => (
                                <td key={year} className="cell-data-readonly">
                                    {formatNumber(dataByYear[year]?.[colDef.key])}
                                </td>
                            ))}
                            <td className="cell-total-final"></td>
                        </tr>
                    ))}
                    <tr className="row-total">
                        <td className="cell-label">Total on commitment</td>
                        {years.map((year) => (
                            <td key={year} className="cell-total-val">
                                {formatNumber(getColumnTotal(year, commitmentRows))}
                            </td>
                        ))}
                        <td className="cell-total-final"></td>
                    </tr>
                </tbody>

                {/* SECTION 2: COST BASIS */}
                <tbody>
                    {costRows.map((colDef) => (
                        <tr key={colDef.key} className="row-standard">
                            <td className="cell-label">{colDef.label}</td>
                            {years.map((year) => (
                                <td key={year} className="cell-data-readonly">
                                    {formatNumber(dataByYear[year]?.[colDef.key])}
                                </td>
                            ))}
                            <td className="cell-total-final"></td>
                        </tr>
                    ))}
                    <tr className="row-total">
                        <td className="cell-label">Total on cost</td>
                        {years.map((year) => (
                            <td key={year} className="cell-total-val">
                                {formatNumber(getColumnTotal(year, costRows))}
                            </td>
                        ))}
                        <td className="cell-total-final"></td>
                    </tr>
                </tbody>

                {/* FOOTER */}
                <tfoot>
                    <tr className="row-total grand-total">
                        <td className="cell-label">Total</td>
                        {years.map((year) => (
                            <td key={year} className="cell-total-val">
                                {formatNumber(
                                    getColumnTotal(year, commitmentRows) + getColumnTotal(year, costRows)
                                )}
                            </td>
                        ))}
                        <td className="cell-total-final"></td>
                    </tr>
                </tfoot>
            </table>

            <ViewTranchModal 
                fundId={fundId} 
                scenarioId={scenarioId} 
                isOpen={isViewModalOpen} 
                onClose={handleModalClose} 
            />
            <AddTranchModal 
                fundId={fundId} 
                scenarioId={scenarioId} 
                isOpen={isAddModalOpen} 
                onClose={handleModalClose} 
            />
        </div>
    );
};

export default ManagementFees;