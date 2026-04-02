// AddNewScenarioModal.jsx (Updated)

import React, { useState } from 'react'; // Import useState
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import './AddNewScenarioModal.css';

// Receive new props: author and onSave
function AddNewScenarioModal({ author, onSave, onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const handleSave = () => {
        // .trim() prevents saving if the user only entered spaces
        if (!name.trim() || !description.trim()) return;

        const scenarioData = {
            name: name.trim(),
            description: description.trim(),
            author: author,
        };
        
        onSave(scenarioData);
    };

  return (
    <div className="modal-add-scenario-overlay" onClick={onClose}>
      
      <div className="modal-add-scenario-content" onClick={e => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <div className="modal-add-scenario-header">
          <h2 className="modal-add-scenario-title">Add A New Scenario</h2>
          <div className="modal-add-scenario-close-btn-wrapper" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>

        {/* --- BODY: Inputs --- */}
        <div className="modal-add-scenario-body">
          <div className="modal-add-scenario-input-group">
            <label className="modal-add-scenario-input-label">Name *</label>
            <input 
                type="text" 
                className="modal-add-scenario-input-field" 
                placeholder="placeholder"
                value={name}
                onChange={(e) => setName(e.target.value)} 
            />
          </div>
          
          <div className="modal-add-scenario-input-group">
            <label className="modal-add-scenario-input-label">Description *</label>
            <textarea 
                className="modal-add-scenario-textarea-field" 
                placeholder="placeholder" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* --- FOOTER: Buttons --- */}
        <div className="modal-add-scenario-footer">
          <button className="modal-add-scenario-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
                className="modal-add-scenario-btn-save" 
                onClick={handleSave}
                disabled={!name.trim() || !description.trim()} // Disable until fields are populated
            >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddNewScenarioModal;