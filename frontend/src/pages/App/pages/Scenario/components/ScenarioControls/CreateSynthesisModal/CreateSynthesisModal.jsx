// CreateSynthesisModal.jsx
import React, { useState } from 'react';
import './CreateSynthesisModal.css'; // Use a new CSS file
import { CloseIcon } from '../Icons'; 

function CreateSynthesisModal({ selectedScenarioIds, allScenarios, onSave, onClose }) { 
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    // Filter selected scenarios using the list passed from the parent
    const selectedScenarios = allScenarios.filter(s => 
        selectedScenarioIds.includes(s.id)
    );

    const handleSave = () => {
        if (!name || !description) return;

        // Collect all data needed by the parent
        const synthesisData = {
            name: name,
            description: description,
            scenarioIds: selectedScenarioIds,
            // Pass titles for the 'links' property in the parent's state
            scenarioTitles: selectedScenarios.map(s => s.title), 
            createdDate: new Date().toLocaleDateString('en-GB'),
        };
        
        // Execute the parent's function to add the new synthesis
        onSave(synthesisData);
        // The modal will be closed by the parent's onSave handler
    };

    return (
        <div className="modal-overlay-synthesis" onClick={onClose}>
            
            <div className="modal-content-synthesis" onClick={e => e.stopPropagation()}>
                
                {/* --- HEADER --- */}
                <div className="modal-header">
                    <h2 className="modal-title-synthesis">Create Scenario Synthesis</h2>
                    <div className="close-btn-wrapper" onClick={onClose}>
                        <CloseIcon />
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="modal-body">
                    
                    {/* Scenario List Display */}
                    <div className="scenario-list-display">
                        <label className="input-label">Selected Scenarios ({selectedScenarios.length})</label>
                        <div className="scenario-items-container">
                            {selectedScenarios.map((scenario) => (
                                <div key={scenario.id} className="scenario-item">
                                    <span className="item-title">{scenario.title}</span>
                                    <div className="item-details">
                                        <span className="item-detail-text">Created: {scenario.createdDate}</span>
                                        <span className="item-detail-text">By: {scenario.author}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Synthesis Name Input */}
                    <div className="input-group">
                        <label className="input-label">Name *</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="e.g., Q4 Investor Presentation Synthesis"
                            value={name}
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    
                    {/* Synthesis Description Input */}
                    <div className="input-group">
                        <label className="input-label">Description *</label>
                        <textarea 
                            className="textarea-field" 
                            placeholder="Briefly describe the purpose of this synthesis." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={!name || !description || selectedScenarios.length === 0}>
                        Create
                    </button>
                </div>

            </div>
        </div>
    );
}

export default CreateSynthesisModal;