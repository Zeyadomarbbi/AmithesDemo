import React, { useState } from 'react';
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import { useScenarioPortfolioProjections } from '../../../../../../../../hooks/Scenarios/useScenarioPortfolioProjections';
import './TargetFinalizationModal.css';

const TargetFinalizationModal = ({ isOpen, onClose, onSave, result, fundId, scenarioId }) => {
    const { updateProjection } = useScenarioPortfolioProjections(fundId, scenarioId);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !result) return null;

    const handleApply = async () => {
        setIsSaving(true);
        try {
            const updatePromises = result.investments.map(inv =>
                updateProjection(inv.projection_id, { input_moic: inv.suggested_moic })
            );
            await Promise.all(updatePromises);
            onSave({ success: true });
            onClose();
        } catch (err) {
            onSave({ success: false, error: err });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="trgt-finalization-overlay" onClick={onClose}>
            <div
                className="trgt-finalization-container"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="trgt-finalization-close-icon" onClick={onClose}>
                    <CloseIcon />
                </button>

                <div className="trgt-finalization-header">
                    <div>
                        <h2 className="trgt-finalization-title">Review Suggested MOICs</h2>
                        <p className="trgt-finalization-subtitle">
                            Target reached with an optimal MOIC of <strong>{result.optimal_moic.toFixed(2)}x</strong>
                        </p>
                    </div>
                </div>

                <div className="trgt-finalization-body">
                    <div className="trgt-finalization-section">
                        <h3 className="trgt-finalization-section-title">
                            Proposed Updates
                            <span className="trgt-finalization-section-count">{result.investments.length}</span>
                        </h3>

                        <div className="trgt-finalization-table-container">
                            <table className="trgt-finalization-table">
                                <thead>
                                    <tr>
                                        <th>Investment</th>
                                        <th>Current MOIC</th>
                                        <th>Suggested MOIC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.investments.length > 0 ? (
                                        result.investments.map((inv, index) => (
                                            <tr key={inv.investment_id} className={index % 2 === 0 ? "trgt-finalization-row-gray" : ""}>
                                                <td className="trgt-finalization-td-left">
                                                    <div className="trgt-finalization-name-block">
                                                        <span className="trgt-finalization-name-label">{inv.name}</span>
                                                        <span className="trgt-finalization-name-sub">ID: {inv.investment_id}</span>
                                                    </div>
                                                </td>
                                                <td className="trgt-finalization-td-left">
                                                    <input
                                                        className="trgt-finalization-input"
                                                        value={`${inv.current_moic.toFixed(2)}x`}
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="trgt-finalization-td-left">
                                                    <input
                                                        className="trgt-finalization-input trgt-finalization-input-highlight"
                                                        value={`${inv.suggested_moic.toFixed(2)}x`}
                                                        readOnly
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="trgt-finalization-cell-empty">
                                                No investments to update.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="trgt-finalization-footer">
                    <button
                        className="trgt-finalization-btn-cancel"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className="trgt-finalization-btn-save"
                        onClick={handleApply}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Applying...' : 'Apply Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TargetFinalizationModal;