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
    <div className="modal-overlay-add-scenario" onClick={onClose}>
      
      <div className="modal-content-add-scenario" onClick={e => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <div className="modal-header-add-scenario">
          <h2 className="modal-title-add-scenario">Add A New Scenario</h2>
          <div className="close-btn-wrapper" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>

        {/* --- BODY: Inputs --- */}
        <div className="modal-body-add-scenario">
          <div className="input-group-add-scenario">
            <label className="input-label">Name *</label>
            <input 
                type="text" 
                className="input-field" 
                placeholder="placeholder"
                value={name}
                onChange={(e) => setName(e.target.value)} 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Description *</label>
            <textarea 
                className="textarea-field" 
                placeholder="placeholder" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* --- FOOTER: Buttons --- */}
        <div className="modal-footer-add-scenario">
          <button className="btn-cancel-add-scenario" onClick={onClose}>
            Cancel
          </button>
          <button 
                className="btn-save-add-scenario" 
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