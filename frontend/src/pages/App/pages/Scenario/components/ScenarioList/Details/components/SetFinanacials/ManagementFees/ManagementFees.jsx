import React, { useState } from 'react';
import { PlusIcon, CloseIcon } from '../Icons'; 
import AddTranchModal from './components/NewTranch/AddTrancheModal.jsx';
import ViewTranchModal from './components/ViewTranch/ViewTranchModal.jsx';
import './ManagementFees.css';

const parseValue = (value) => {
    if (!value) return 0;
    const cleanValue = String(value).replace(/\s/g, ''); 
    if (cleanValue === '-' || cleanValue === '' || isNaN(cleanValue)) return 0;
    return parseFloat(cleanValue);
};

const initialShares = [
    { label: 'Shares A1', v2024: '300 000', v2025: '500 000', v2026: '500 000', v2027: '300 000', v2028: '-', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Shares A2', v2024: '1 500 000', v2025: '2 000 000', v2026: '2 000 000', v2027: '1 500 000', v2028: '-', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Shares B', v2024: '50 000', v2025: '250 000', v2026: '250 000', v2027: '50 000', v2028: '-', v2029: '-', v2030: '-', v2031: '-' },
];

const initialInvestments = [
    { label: 'Investment #1', v2024: '-', v2025: '-', v2026: '-', v2027: '150 000', v2028: '150 000', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Investment #2', v2024: '-', v2025: '-', v2026: '-', v2027: '120 000', v2028: '120 000', v2029: '-', v2030: '-', v2031: '-' },
    { label: 'Investment #3', v2024: '-', v2025: '-', v2026: '-', v2027: '130 000', v2028: '130 000', v2029: '130 000', v2030: '-', v2031: '-' },
    { label: 'Investment #4', v2024: '-', v2025: '-', v2026: '-', v2027: '150 000', v2028: '150 000', v2029: '150 000', v2030: '150 000', v2031: '-' },
    { label: 'Investment #5', v2024: '-', v2025: '-', v2026: '-', v2027: '100 000', v2028: '100 000', v2029: '100 000', v2030: '100 000', v2031: '-' },
    { label: 'Investment #6', v2024: '-', v2025: '-', v2026: '-', v2027: '50 000', v2028: '50 000', v2029: '50 000', v2030: '50 000', v2031: '50 000' },
];

const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031'];

const ManagementFees = ({ fundId, scenarioId, onClose }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const formatNumber = (num) => (num === 0 ? '-' : num.toLocaleString('en-US').replace(/,/g, ' '));

    const calculateTotal = (yearKey, dataSet) => {
        return dataSet.reduce((acc, row) => acc + parseValue(row[yearKey]), 0);
    };

    const renderRows = (dataSet) => dataSet.map((row, idx) => (
        <tr key={idx} className="row-standard">
            <td className="cell-label">{row.label}</td>
            {years.map((year) => (
                <td key={year} className="cell-data-readonly">
                    {row[`v${year}`] || '-'}
                </td>
            ))}
            <td className="cell-total-final"></td>
        </tr>
    ));

    return (
        <div className="mf-table-container">
            <button className="mf-close-action" onClick={onClose}>
                <CloseIcon />
            </button>

            <div className="mf-action-header">
                <button className="mf-btn-base mf-btn-view" onClick={() => setIsViewModalOpen(true)}>
                    View tranches
                </button>
                <button className="mf-btn-base mf-btn-add" onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon />
                    Add tranche
                </button>
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
                
                <tbody>
                    {renderRows(initialShares)}
                    <tr className="row-total">
                        <td className="cell-label">Total on commitment</td>
                        {years.map((year) => (
                            <td key={year} className="cell-total-val">
                                {formatNumber(calculateTotal(`v${year}`, initialShares))}
                            </td>
                        ))}
                        <td className="cell-total-final"></td>
                    </tr>
                </tbody>

                <tbody>
                    {renderRows(initialInvestments)}
                    <tr className="row-total">
                        <td className="cell-label">Total on cost</td>
                        {years.map((year) => (
                            <td key={year} className="cell-total-val">
                                {formatNumber(calculateTotal(`v${year}`, initialInvestments))}
                            </td>
                        ))}
                        <td className="cell-total-final"></td>
                    </tr>
                </tbody>

                <tfoot>
                    <tr className="row-total grand-total">
                        <td className="cell-label">Total</td>
                        {years.map((year) => {
                            const subtotalShares = calculateTotal(`v${year}`, initialShares);
                            const subtotalInvest = calculateTotal(`v${year}`, initialInvestments);
                            return (
                                <td key={year} className="cell-total-val">
                                    {formatNumber(subtotalShares + subtotalInvest)}
                                </td>
                            );
                        })}
                        <td className="cell-total-final"></td>
                    </tr>
                </tfoot>
            </table>

            <ViewTranchModal 
                fundId={fundId} 
                scenarioId={scenarioId} 
                isOpen={isViewModalOpen} 
                onClose={() => setIsViewModalOpen(false)} 
            />
            <AddTranchModal 
                fundId={fundId} 
                scenarioId={scenarioId} 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
        </div>
    );
};

export default ManagementFees;