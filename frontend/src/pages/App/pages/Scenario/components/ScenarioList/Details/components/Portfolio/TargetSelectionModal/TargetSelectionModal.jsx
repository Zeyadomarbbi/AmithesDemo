import React, { useState } from 'react';
import { CloseIcon } from '/src/components/Icons/InteractiveIcons'; 
import { useTargetMode } from '../../../../../../../../hooks/Scenarios/useTargetMode';
import Toast from '../../../../../../../../components/Toast/Toast'
import './TargetSelectionModal.css';

const TargetSelectionModal = ({ isOpen, onClose, onNext, shareClasses = [], fundId, scenarioId, unlockedPortfolios = [] }) => {
    const [activeTarget, setActiveTarget] = useState({ entity: null, metric: null, value: '' });
    const { executeTargetMode, loading, error } = useTargetMode(fundId, scenarioId);
    const [localError, setLocalError] = useState(null);
    const [dismissedError, setDismissedError] = useState(false);
    const displayError = !dismissedError && localError;
    if (!isOpen) return null;

    const columns = ['Fund', ...shareClasses];
    const metrics = [
        { id: 'total_distributed', label: 'Total Distributed' },
        { id: 'tvpi', label: 'TVPI' },
        { id: 'irr', label: 'IRR' }
    ];

    const handleInputChange = (entity, metricId, value) => {
        setLocalError(null);
        setDismissedError(false);
        const sanitizedValue = value.replace(/[^0-9.-]/g, '');
        setActiveTarget(
            sanitizedValue === ''
                ? { entity: null, metric: null, value: '' }
                : { entity, metric: metricId, value: sanitizedValue }
        );
    };

    const buildTargetType = (entity, metric) => {
        if (entity === 'Fund') {
            if (metric === 'irr') return 'fund_irr_net';
            if (metric === 'tvpi') return 'fund_tvpi';
            if (metric === 'total_distributed') return 'fund_total_distributed';
        } else {
            const entityKey = entity.toLowerCase().replace(/\s+/g, '_');
            if (metric === 'irr') return `irr_${entityKey}`;
            if (metric === 'tvpi') return `tvpi_${entityKey}`;
            if (metric === 'total_distributed') return `total_distributed_${entityKey}`;
        }
        return null;
    };

    const handleNext = async () => {
        setLocalError(null);

        if (!activeTarget.value || unlockedPortfolios.length === 0) return;

        const targetType = buildTargetType(activeTarget.entity, activeTarget.metric);
        if (!targetType) {
            setLocalError('Could not determine target type. Please reselect.');
            return;
        }

        let targetValue = parseFloat(activeTarget.value);
        if (isNaN(targetValue)) {
            setLocalError('Target value must be a valid number.');
            return;
        }

        if (activeTarget.metric === 'irr') {
            targetValue = targetValue / 100.0;
        }

        try {
            const result = await executeTargetMode({
                target_kpi_type: targetType,
                target_kpi_value: targetValue,
                unlocked_ids: unlockedPortfolios.map(p => p.id)
            });
            onNext(result);
        } catch (err) {
            // error is already set in the hook — just capture for local display
            setLocalError(err.message);
            onError?.(err.message);  
        }
    };


    const hasActiveTarget = activeTarget.value !== '';

    return (
        <div className="trgt-selection-mode-overlay" onClick={onClose}>
            <div className="trgt-selection-mode-container" onClick={(e) => e.stopPropagation()}>
                <div className="trgt-selection-mode-header">
                    <div>
                        <h2 className="trgt-selection-mode-title">Choose one target</h2>
                        <p className="trgt-selection-mode-subtitle">
                            Modifying MOIC for <strong>{unlockedPortfolios.length}</strong> unlocked deal(s).
                        </p>
                    </div>
                    <div className="trgt-selection-mode-close-icon" onClick={onClose}><CloseIcon /></div>
                </div>

                <div className="trgt-selection-mode-body">
                    <table className="trgt-selection-mode-table">
                        <thead>
                            <tr>
                                <th className="trgt-selection-mode-row-header"></th>
                                {columns.map((col) => (
                                    <th key={col} className="trgt-selection-mode-col-header">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((metric) => (
                                <tr key={metric.id}>
                                    <td className="trgt-selection-mode-row-label">
                                        {metric.label}
                                        {metric.id === 'total_distributed' && (
                                            <span className="trgt-selection-mode-currency"> (€)</span>
                                        )}
                                        {metric.id === 'irr' && (
                                            <span className="trgt-selection-mode-currency"> (%)</span>
                                        )}
                                    </td>
                                    {columns.map((col) => {
                                        const isActive = activeTarget.entity === col && activeTarget.metric === metric.id;
                                        const isDisabled = hasActiveTarget && !isActive;
                                        return (
                                            <td key={`${col}-${metric.id}`}>
                                                <input
                                                    type="text"
                                                    placeholder={metric.id === 'irr' ? 'e.g. 15' : 'e.g. 1.5'}
                                                    value={isActive ? activeTarget.value : ''}
                                                    onChange={(e) => handleInputChange(col, metric.id, e.target.value)}
                                                    disabled={isDisabled || loading}
                                                    className={`trgt-selection-mode-input ${isActive ? 'active-target-input' : ''}`}
                                                    style={{
                                                        opacity: isDisabled ? 0.5 : 1,
                                                        cursor: isDisabled ? 'not-allowed' : 'text'
                                                    }}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="trgt-selection-list-display">
                        <label className="trgt-selection-input-label">
                            Unlocked Deals ({unlockedPortfolios.length})
                        </label>
                        <div className="trgt-selection-items-container">
                            {unlockedPortfolios.map((portfolio) => (
                                <div key={portfolio.id} className="trgt-selection-item">
                                    <span className="trgt-selection-item-title">{portfolio.name}</span>
                                    <div className="trgt-selection-item-details">
                                        <span className="trgt-selection-item-detail-text">
                                            Date: {portfolio.first_investment_date
                                                ? new Date(portfolio.first_investment_date).toLocaleDateString()
                                                : '-'}
                                        </span>
                                        <span className="trgt-selection-item-detail-text">
                                            MOIC: {portfolio.input_moic
                                                ? `${parseFloat(portfolio.input_moic).toFixed(2)}x`
                                                : '-'}
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
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="trgt-selection-mode-btn-save"
                        onClick={handleNext}
                        disabled={!activeTarget.value || unlockedPortfolios.length === 0 || loading}
                    >
                        {loading ? 'Calculating...' : 'Next'}
                    </button>
                </div>
                {displayError && (
                    <Toast
                        type="error"
                        title="Error"
                        message={displayError}
                        onClose={() => { setLocalError(null); setDismissedError(true); }}
                    />
                    )}
            </div>
        </div>
    );
};

export default TargetSelectionModal;