import React, { useState } from 'react';
import { CloseIcon } from '../Icons'; 
import { useScenarioPortfolioProjections } from '../../../../../../../../hooks/Scenarios/useScenarioPortfolioProjections';
import './TargetSelectionModal.css';

const TargetFinalizationModal = ({ isOpen, onClose, onSave, result, fundId, scenarioId }) => {
    const { updateProjection } = useScenarioPortfolioProjections(fundId, scenarioId);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !result) return null;

    const handleApply = async () => {
        setIsSaving(true);
        try {
            // Loop through suggested changes and hit your existing updateProjection endpoint
            const updatePromises = result.investments.map(inv => 
                updateProjection(inv.projection_id, { input_moic: inv.suggested_moic })
            );
            
            await Promise.all(updatePromises);
            onSave({ success: true }); // Triggers parent success toast
            onClose();
        } catch (err) {
            onSave({ success: false, error: err }); // Triggers parent error toast
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="trgt-selection-mode-overlay" onClick={onClose}>
            <div 
                className="trgt-selection-mode-container" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '550px' }} // Slightly narrower for the preview
            >
                <div className="trgt-selection-mode-header">
                    <div>
                        <h2 className="trgt-selection-mode-title">Review Suggested MOICs</h2>
                        <p 
                            className="trgt-selection-mode-subtitle" 
                            style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontWeight: 'normal' }}
                        >
                            Target reached with an optimal MOIC of <strong>{result.optimal_moic.toFixed(2)}x</strong>
                        </p>
                    </div>
                    <div className="trgt-selection-mode-close-icon" onClick={onClose}>
                        <CloseIcon />
                    </div>
                </div>

                <div className="trgt-selection-mode-body">
                    <div className="trgt-selection-list-display">
                        <label className="trgt-selection-input-label">
                            Proposed Updates ({result.investments.length})
                        </label>
                        <div 
                            className="trgt-selection-items-container" 
                            style={{ maxHeight: '350px' }}
                        >
                            {result.investments.map((inv) => (
                                <div key={inv.investment_id} className="trgt-selection-item">
                                    <span className="trgt-selection-item-title">
                                        {inv.name}
                                    </span>
                                    <div className="trgt-selection-item-details">
                                        <span className="trgt-selection-item-detail-text">
                                            Current: {inv.current_moic.toFixed(2)}x
                                        </span>
                                        <span 
                                            className="trgt-selection-item-detail-text" 
                                            style={{ color: '#F59E0B', fontWeight: 'bold' }}
                                        >
                                            → New: {inv.suggested_moic.toFixed(2)}x
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="trgt-selection-mode-footer">
                    <button 
                        className="trgt-selection-mode-btn-cancel" 
                        onClick={onClose} 
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button 
                        className="trgt-selection-mode-btn-save" 
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