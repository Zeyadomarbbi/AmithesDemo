// CreateSynthesisModal.jsx
import React, { useState } from 'react';
import './CreateSynthesisModal.css';
import { CloseIcon } from '../Icons';

function CreateSynthesisModal({ selectedScenarioIds, allScenarios, onSave, onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const selectedScenarios = allScenarios.filter(s =>
        selectedScenarioIds.includes(s.id)
    );

    const handleSave = () => {
        if (!name || !description) return;

        const synthesisData = {
            name: name,
            description: description,
            scenarioIds: selectedScenarioIds,
            scenarioTitles: selectedScenarios.map(s => s.title),
            createdDate: new Date().toLocaleDateString('en-GB'),
        };

        onSave(synthesisData);
    };

    return (
        <div className="create-synth-overlay" onClick={onClose}>

            <div className="create-synth-content" onClick={e => e.stopPropagation()}>

                {/* --- HEADER --- */}
                <div className="create-synth-header">
                    <h2 className="create-synth-title">Create Scenario Synthesis</h2>
                    <div className="create-synth-close-btn" onClick={onClose}>
                        <CloseIcon />
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="create-synth-body">

                    {/* Scenario List Display */}
                    <div className="create-synth-scenario-list">
                        <label className="create-synth-label">Selected Scenarios ({selectedScenarios.length})</label>
                        <div className="create-synth-scenario-items">
                            {selectedScenarios.map((scenario) => (
                                <div key={scenario.id} className="create-synth-scenario-item">
                                    <span className="create-synth-item-title">{scenario.title}</span>
                                    <div className="create-synth-item-details">
                                        <span className="create-synth-item-detail-text">Created: {scenario.createdDate}</span>
                                        <span className="create-synth-item-detail-text">By: {scenario.author}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Synthesis Name Input */}
                    <div className="create-synth-input-group">
                        <label className="create-synth-label">Name *</label>
                        <input
                            type="text"
                            className="create-synth-input-field"
                            placeholder="e.g., Q4 Investor Presentation Synthesis"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Synthesis Description Input */}
                    <div className="create-synth-input-group">
                        <label className="create-synth-label">Description *</label>
                        <textarea
                            className="create-synth-textarea-field"
                            placeholder="Briefly describe the purpose of this synthesis."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="create-synth-footer">
                    <button className="create-synth-btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="create-synth-btn-save"
                        onClick={handleSave}
                        disabled={!name || !description || selectedScenarios.length === 0}
                    >
                        Create
                    </button>
                </div>

            </div>
        </div>
    );
}

export default CreateSynthesisModal;